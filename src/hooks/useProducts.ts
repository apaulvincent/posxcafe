import { useLiveQuery } from 'dexie-react-hooks';
import { db, type LocalProduct } from '../lib/db';
import { supabase } from '../lib/supabase';

export type Product = LocalProduct;

export function useProducts() {
  const rawProducts = useLiveQuery(() => db.products.toArray());
  const loading = rawProducts === undefined;
  const products = (rawProducts || []).filter(p => !p.is_archived);
  
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
    if (!navigator.onLine) {
      throw new Error("You must be online to archive a product.");
    }

    const { error } = await supabase.from('products').update({ is_archived: true }).eq('id', id);
    
    if (error) {
      console.error("Error archiving product in Supabase", error);
      throw new Error("Cannot archive product: " + error.message);
    }

    await db.products.update(id, { is_archived: true, sync_status: 'pending' });
  };

  return { products: sortedProducts, loading, error: null, addProduct, updateProduct, deleteProduct };
}
