import { useLiveQuery } from 'dexie-react-hooks';
import { db, type LocalProduct } from '../lib/db';

export type Product = LocalProduct;

export function useProducts() {
  const rawProducts = useLiveQuery(() => db.products.toArray());
  const loading = rawProducts === undefined;
  const products = rawProducts || [];
  
  const sortedProducts = [...products].sort((a, b) => a.name.localeCompare(b.name));

  const addProduct = async (product: Omit<LocalProduct, 'id'>) => {
    const newProduct = {
      ...product,
      id: crypto.randomUUID()
    };
    await db.products.add(newProduct);
    if (navigator.onLine) {
      import('../lib/sync').then(({ syncUp }) => syncUp());
    }
  };

  const updateProduct = async (id: string, updates: Partial<LocalProduct>) => {
    await db.products.update(id, updates);
    if (navigator.onLine) {
      import('../lib/sync').then(({ syncUp }) => syncUp());
    }
  };

  const deleteProduct = async (id: string) => {
    await db.products.delete(id);
    if (navigator.onLine) {
      import('../lib/sync').then(({ syncUp }) => syncUp());
    }
  };

  return { products: sortedProducts, loading, error: null, addProduct, updateProduct, deleteProduct };
}
