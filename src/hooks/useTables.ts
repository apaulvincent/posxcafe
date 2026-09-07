import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { useState, useEffect } from 'react';

export function useTables() {
  const tables = useLiveQuery(() => db.diningTables.toArray(), []) || [];
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If no tables exist, seed defaults (Table 1 to 10)
    const seed = async () => {
      try {
        const count = await db.diningTables.count();
        if (count === 0) {
          const defaultTables = Array.from({ length: 10 }, (_, i) => ({
            id: crypto.randomUUID(),
            name: `Table ${i + 1}`,
            capacity: 4,
            is_active: true,
            sync_status: 'synced' as const
          }));
          await db.diningTables.bulkAdd(defaultTables);
        }
      } catch (e) {
        console.error('Failed to seed tables', e);
      } finally {
        setLoading(false);
      }
    };
    
    seed();
  }, []);

  return { tables, loading };
}
