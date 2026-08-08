import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export type SalesStat = { id: string; time_label: string; coffee_val: number; tea_val: number; snack_val: number; };
export type PerformanceStat = { id: string; subject: string; score: number; full_mark: number; };

export function useStatistics() {
  const [salesData, setSalesData] = useState<SalesStat[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [salesRes, perfRes] = await Promise.all([
          supabase.from('statistics_sales').select('*').order('created_at', { ascending: true }),
          supabase.from('statistics_performance').select('*').order('created_at', { ascending: true })
        ]);
        
        if (salesRes.data) setSalesData(salesRes.data);
        if (perfRes.data) setPerformanceData(perfRes.data);
      } catch (e) {
        console.error("Error fetching stats", e);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return { salesData, performanceData, loading };
}
