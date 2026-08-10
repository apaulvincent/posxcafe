import { useLiveQuery } from 'dexie-react-hooks';
import { db, type LocalProduct } from '../lib/db';
import { supabase, getStoragePathFromUrl } from '../lib/supabase';

export type Product = LocalProduct;

export function useProducts() {
  const rawProducts = useLiveQuery(() => db.products.toArray());
  const loading = rawProducts === undefined;
  const products = rawProducts || [];
  
  const sortedProducts = [...products].sort((a, b) => a.name.localeCompare(b.name));

  const addProduct = async (product: Omit<LocalProduct, 'id'>) => {
    const newProduct = {
      ...product,
      id: crypto.randomUUID(),
      sync_status: 'pending' as const
    };
    
    await db.products.add(newProduct);
    
    if (navigator.onLine) {
      import('../lib/sync').then(({ syncUp }) => syncUp());
    }
  };

  const updateProduct = async (id: string, updates: Partial<LocalProduct>) => {
    await db.products.update(id, { ...updates, sync_status: 'pending' });
    
    if (navigator.onLine) {
      import('../lib/sync').then(({ syncUp }) => syncUp());
    }
  };

  const deleteProduct = async (id: string) => {
    if (navigator.onLine) {
      // Get the product before deleting to find its image_url
      const product = await db.products.get(id);
      if (product?.image_url) {
        const path = getStoragePathFromUrl(product.image_url);
        if (path) supabase.storage.from('images').remove([path]).catch(console.error);
      }

      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) console.error("Error deleting product in Supabase", error);
    }
    
    await db.products.delete(id);
  };

  return { products: sortedProducts, loading, error: null, addProduct, updateProduct, deleteProduct };
}
