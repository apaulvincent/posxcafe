import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { useState, useEffect } from 'react';

export function useDiscounts() {
  const discounts = useLiveQuery(() => db.discounts.toArray(), []) || [];
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If no discounts exist, seed some defaults
    const seed = async () => {
      try {
        const count = await db.discounts.count();
        if (count === 0) {
          await db.discounts.bulkAdd([
            { id: crypto.randomUUID(), name: 'Disabled Discount', type: 'percent', value: 10, is_active: true, sync_status: 'synced' },
            { id: crypto.randomUUID(), name: 'Senior Discount', type: 'percent', value: 12, is_active: true, sync_status: 'synced' },
            { id: crypto.randomUUID(), name: 'Loyalty Discount', type: 'percent', value: 5, is_active: true, sync_status: 'synced' },
          ]);
        }
      } catch (e) {
        console.error('Failed to seed discounts', e);
      } finally {
        setLoading(false);
      }
    };
    
    seed();
  }, []);

  return { discounts, loading };
}
