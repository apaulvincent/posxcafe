import { supabase } from './supabase';
import { db } from './db';

// Pull latest products and categories from Supabase to IndexedDB
export async function syncDown() {
  try {
    // Fetch categories
    const { data: categories, error: catError } = await supabase.from('categories').select('*');
    if (catError) throw catError;
    if (categories) {
      await db.categories.bulkPut(categories);
    }

    // Fetch products
    const { data: products, error: prodError } = await supabase.from('products').select('*');
    if (prodError) throw prodError;
    if (products) {
      await db.products.bulkPut(products);
    }

    // Fetch recent orders for dashboard (last 100)
    const { data: orders, error: ordError } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(100);
    if (ordError) throw ordError;
    if (orders) {
      // Check for new online orders
      const existingOrderIds = new Set((await db.orders.toArray()).map(o => o.id));
      const newOrders = orders.filter(o => !existingOrderIds.has(o.id));
      
      const newOnlineOrders = newOrders.filter(o => o.order_type === 'Order Online');
      
      if (newOnlineOrders.length > 0) {
        const notifs = newOnlineOrders.map(o => ({
          id: crypto.randomUUID(),
          type: 'order' as const,
          title: 'New Online Order',
          message: `Receipt #${o.receipt_number || o.id.split('-')[0]} just arrived online.`,
          is_read: false,
          created_at: new Date().toISOString(),
          sync_status: 'pending' as const
        }));
        await db.notifications.bulkAdd(notifs);
      }

      // mark them as synced so we don't re-upload them
      const syncedOrders = orders.map(o => ({ ...o, sync_status: 'synced' as const }));
      await db.orders.bulkPut(syncedOrders);
    }

    // Fetch recent notifications
    const { data: notifications, error: notifError } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50);
    if (notifError) throw notifError;
    if (notifications) {
      const syncedNotifs = notifications.map(n => ({ ...n, sync_status: 'synced' as const }));
      await db.notifications.bulkPut(syncedNotifs);
    }

    console.log('Successfully synced data down from Supabase');
  } catch (error) {
    console.error('Error syncing down:', error);
  }
}

// Push pending orders and notifications from IndexedDB to Supabase
export async function syncUp() {
  try {
    // 1. Sync Orders
    const pendingOrders = await db.orders.where('sync_status').equals('pending').toArray();
    
    if (pendingOrders.length > 0) {
      for (const order of pendingOrders) {
        // Upload order
        const { sync_status, ...orderData } = order;
        const { error: orderError } = await supabase.from('orders').upsert([orderData], { onConflict: 'id' });
        
        if (orderError) {
          console.error('Error uploading order', order.id, orderError);
          continue;
        }

        // Check if items already exist in Supabase (since we upserted the order, it might be a status update)
        const { data: existingItems } = await supabase.from('order_items').select('id').eq('order_id', order.id).limit(1);
        
        if (!existingItems || existingItems.length === 0) {
          // Upload items
          const items = await db.orderItems.where('order_id').equals(order.id).toArray();
          if (items.length > 0) {
            // Strip auto-incrementing local 'id' before sending to Supabase
            const itemsToUpload = items.map(({ id, ...rest }) => rest);
            const { error: itemsError } = await supabase.from('order_items').insert(itemsToUpload);
            
            if (itemsError) {
              console.error('Error uploading items for order', order.id, itemsError);
              continue; // Don't mark as synced if items failed
            }
          }
        }

        // Mark as synced locally
        await db.orders.update(order.id, { sync_status: 'synced' });
      }
      console.log(`Successfully synced ${pendingOrders.length} orders up to Supabase`);
    }

    // 2. Sync Notifications
    const pendingNotifs = await db.notifications.where('sync_status').equals('pending').toArray();
    if (pendingNotifs.length > 0) {
      for (const notif of pendingNotifs) {
        const { sync_status, ...notifData } = notif;
        const { error } = await supabase.from('notifications').upsert([notifData], { onConflict: 'id' });
        if (error) {
          console.error('Error uploading notification', notif.id, error);
          continue;
        }
        await db.notifications.update(notif.id, { sync_status: 'synced' });
      }
      console.log(`Successfully synced ${pendingNotifs.length} notifications up to Supabase`);
    }

  } catch (error) {
    console.error('Error syncing up:', error);
  }
}

export async function syncAll() {
  if (!navigator.onLine) return;
  await syncUp();
  await syncDown();
}
