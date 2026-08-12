import { useLiveQuery } from 'dexie-react-hooks';
import { db, type LocalCategory } from '../lib/db';
import { supabase } from '../lib/supabase';

export type Category = LocalCategory;

export function useCategories() {
  const rawCategories = useLiveQuery(() => db.categories.toArray());
  const loading = rawCategories === undefined;
  const categories = rawCategories || [];

  const addCategory = async (category: Omit<LocalCategory, 'id'>) => {
    const newCategory = {
      ...category,
      id: crypto.randomUUID(),
      sync_status: 'pending' as const
    };
    await db.categories.add(newCategory);
    if (navigator.onLine) {
      import('../lib/sync').then(({ syncUp }) => syncUp());
    }
  };

  const updateCategory = async (id: string, updates: Partial<LocalCategory>) => {
    await db.categories.update(id, { ...updates, sync_status: 'pending' });
    if (navigator.onLine) {
      import('../lib/sync').then(({ syncUp }) => syncUp());
    }
  };

  const deleteCategory = async (id: string) => {
    if (!navigator.onLine) {
      throw new Error("You must be online to delete a category.");
    }
    
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) {
      console.error("Error deleting category in Supabase", error);
      throw new Error("Cannot delete category: " + error.message);
    }
    
    await db.categories.delete(id);
  };

  return { categories, loading, error: null, addCategory, updateCategory, deleteCategory };
}
