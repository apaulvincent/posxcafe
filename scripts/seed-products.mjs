import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function seedProducts() {
  console.log("Logging in as admin...");
  await supabase.auth.signInWithPassword({ email: 'admin@green.coffee', password: 'password123' });
  console.log("Seeding categories and products...");

  await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  const categories = [
    { slug: 'coffee', name: 'Coffee', count_text: '50 items', status_text: 'Available', alert: false, theme_class: 'active-coffee' },
    { slug: 'tea', name: 'Tea', count_text: '20 items', status_text: 'Available', alert: false, theme_class: 'active-tea' },
    { slug: 'snack', name: 'Snack', count_text: '10 items', status_text: 'Need to re-stock', alert: true, theme_class: 'active-snack' }
  ];

  const { data: insertedCats } = await supabase.from('categories').insert(categories).select();

  if (insertedCats) {
    const coffeeCat = insertedCats.find(c => c.slug === 'coffee').id;
    
    const products = [
      { category_id: coffeeCat, name: 'Americano', price: 4.00, image_url: '/products/americano.jpg' },
      { category_id: coffeeCat, name: 'Cappuccino', price: 3.30, image_url: '/products/cappuccino.jpg' },
      { category_id: coffeeCat, name: 'Caramel Mac', price: 4.00, image_url: '/products/caramel_macchiato.jpg' },
      { category_id: coffeeCat, name: 'Cold Brew', price: 4.00, image_url: '/products/cold_brew.jpg' },
      { category_id: coffeeCat, name: 'Latte', price: 4.50, image_url: '/products/latte.jpg' },
    ];
    await supabase.from('products').insert(products);
    console.log("Seeded Products");
  }
}

seedProducts().catch(console.error);
