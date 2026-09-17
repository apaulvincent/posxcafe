import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function seed() {
  console.log("Logging in as admin...");
  await supabase.auth.signInWithPassword({ email: 'admin@green.coffee', password: 'password123' });
  console.log("Seeding data...");

  // Seed Sales Statistics
  const salesStats = [
    { time_label: '10 AM', coffee_val: 200, tea_val: 100, snack_val: 50 },
    { time_label: '11 AM', coffee_val: 400, tea_val: 150, snack_val: 100 },
    { time_label: '12 PM', coffee_val: 600, tea_val: 200, snack_val: 300 },
    { time_label: '1 PM', coffee_val: 800, tea_val: 300, snack_val: 400 },
    { time_label: '2 PM', coffee_val: 700, tea_val: 250, snack_val: 350 },
    { time_label: '3 PM', coffee_val: 500, tea_val: 150, snack_val: 200 },
    { time_label: '4 PM', coffee_val: 900, tea_val: 400, snack_val: 500 }
  ];

  await supabase.from('statistics_sales').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('statistics_sales').insert(salesStats);
  console.log("Seeded Sales Statistics");

  // Seed Performance Statistics
  const perfStats = [
    { subject: 'Expresso', score: 120, full_mark: 150 },
    { subject: 'Americano', score: 98, full_mark: 150 },
    { subject: 'Mocha', score: 86, full_mark: 150 },
    { subject: 'Salted Caramel', score: 99, full_mark: 150 },
    { subject: 'Flat White', score: 85, full_mark: 150 },
    { subject: 'Latte', score: 65, full_mark: 150 },
    { subject: 'Ice Coffee', score: 110, full_mark: 150 }
  ];

  await supabase.from('statistics_performance').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('statistics_performance').insert(perfStats);
  console.log("Seeded Performance Statistics");

  // Get some products to use for order items
  const { data: products } = await supabase.from('products').select('*').limit(3);
  if (!products || products.length === 0) {
    console.log("No products found, skipping order seeding");
    return;
  }

  // Seed Orders
  await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  const mockOrders = [
    { customer_name: 'John Smith', table_number: 'B1', order_type: 'Dine In', subtotal: 18.18, tax: 1.82, total: 20.00, status: 'completed' },
    { customer_name: 'Michael Will', table_number: 'Takeaway', order_type: 'Take Away', subtotal: 21.82, tax: 2.18, total: 24.00, status: 'completed' },
    { customer_name: 'Kevin Brown', table_number: 'B2', order_type: 'Dine In', subtotal: 21.82, tax: 2.18, total: 24.00, status: 'completed' },
    { customer_name: 'Lia Thompson', table_number: 'Online', order_type: 'Order Online', subtotal: 3.64, tax: 0.36, total: 4.00, status: 'completed' },
  ];

  for (const orderData of mockOrders) {
    const { data: insertedOrder, error } = await supabase.from('orders').insert([orderData]).select().single();
    if (error) {
      console.error("Error inserting order:", error);
      continue;
    }

    // Insert dummy items for the order
    const items = products.map(p => ({
      order_id: insertedOrder.id,
      product_id: p.id,
      quantity: 1,
      unit_price: p.price,
      notes: ''
    }));

    await supabase.from('order_items').insert(items);
  }
  
  console.log("Seeded Orders and Order Items");
}

seed().catch(console.error);
