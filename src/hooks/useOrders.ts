import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type LocalOrder } from '../lib/db';
import { supabase } from '../lib/supabase';

export type Order = LocalOrder;

export function useOrders() {
  const rawOrders = useLiveQuery(() => db.orders.orderBy('created_at').reverse().toArray());
  const loading = rawOrders === undefined;
  const orders = rawOrders || [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayOrders = orders.filter(o => new Date(o.created_at) >= today);
  const localPendingOrders = todayOrders.filter(o => ['pending', 'preparing'].includes(o.status));
  
  const [globalTotalToday, setGlobalTotalToday] = useState(todayOrders.length);
  const [globalPendingToday, setGlobalPendingToday] = useState(localPendingOrders.length);

  useEffect(() => {
    // Sync local count immediately
    setGlobalTotalToday(Math.max(globalTotalToday, todayOrders.length));
    setGlobalPendingToday(localPendingOrders.length); // Trust local for pending to allow it to go down

    if (navigator.onLine) {
      const fetchGlobalCount = async () => {
        try {
          const { data } = await supabase
            .from('orders')
            .select('status')
            .gte('created_at', today.toISOString());
            
          if (data) {
            setGlobalTotalToday(Math.max(data.length, todayOrders.length));
            
            // For pending, we don't want Math.max because pending should go down when completed
            const globalPending = data.filter(o => ['pending', 'preparing'].includes(o.status)).length;
            // Add unsynced local pending orders that aren't in Supabase yet
            const unsyncedPending = localPendingOrders.filter(lo => lo.sync_status === 'pending').length;
            setGlobalPendingToday(globalPending + unsyncedPending);
          }
        } catch (e) {
          console.error('Failed to fetch global order count', e);
        }
      };

      fetchGlobalCount();
      
      const interval = setInterval(fetchGlobalCount, 30000); // Check every 30s
      return () => clearInterval(interval);
    }
  }, [todayOrders.length, localPendingOrders.length]);

  return { 
    orders, 
    totalOrdersToday: globalTotalToday, 
    pendingOrdersCount: globalPendingToday,
    loading, 
    refetch: () => {} 
  }; 
}
