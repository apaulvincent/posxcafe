import { useLiveQuery } from 'dexie-react-hooks';
import { db, type LocalCategory } from '../lib/db';

export type Category = LocalCategory & {
  count_text?: string;
  theme_class?: string;
};

export function useCategories() {
  const rawCategories = useLiveQuery(() => db.categories.toArray());
  const loading = rawCategories === undefined;
  const categories = rawCategories || [];

  const addCategory = async (category: Omit<LocalCategory, 'id'>) => {
    const newCategory = {
      ...category,
      id: crypto.randomUUID()
    };
    await db.categories.add(newCategory);
    if (navigator.onLine) {
      import('../lib/sync').then(({ syncUp }) => syncUp());
    }
  };

  const updateCategory = async (id: string, updates: Partial<LocalCategory>) => {
    await db.categories.update(id, updates);
    if (navigator.onLine) {
      import('../lib/sync').then(({ syncUp }) => syncUp());
    }
  };

  const deleteCategory = async (id: string) => {
    await db.categories.delete(id);
    if (navigator.onLine) {
      import('../lib/sync').then(({ syncUp }) => syncUp());
    }
  };

  return { categories, loading, error: null, addCategory, updateCategory, deleteCategory };
}
