import { useState, useEffect } from 'react';
import { db, type LocalOrder, type LocalOrderItem } from '../lib/db';
import { useLiveQuery } from 'dexie-react-hooks';

export type SalesStat = { time: string } & Record<string, string | number>;
export type TopProductStat = { name: string; quantity: number; revenue: number; };
export type OrderWithItems = LocalOrder & { items: (LocalOrderItem & { categorySlug: string })[] };

export type RevenueDetails = {
  grossSales: number;
  netSales: number;
  atv: number;
  transactionCount: number;
  discounts: number;
  refunds: number;
};

export function useStatistics(chartPeriod: 'day' | 'month' | 'year' | 'all' | 'custom' = 'day') {
  const orders = useLiveQuery(() => db.orders.toArray());
  const orderItems = useLiveQuery(() => db.orderItems.toArray());
  const products = useLiveQuery(() => db.products.toArray());
  const categories = useLiveQuery(() => db.categories.toArray());

  const [loading, setLoading] = useState(true);

  // Derived state
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [todaySalesCount, setTodaySalesCount] = useState(0);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [revenueDiff, setRevenueDiff] = useState(0);
  const [revenueDetails, setRevenueDetails] = useState<RevenueDetails>({
    grossSales: 0, netSales: 0, atv: 0, transactionCount: 0, discounts: 0, refunds: 0
  });
  
  const [salesData, setSalesData] = useState<SalesStat[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductStat[]>([]);
  const [recentOrders, setRecentOrders] = useState<OrderWithItems[]>([]);
  
  const [scoreMetrics, setScoreMetrics] = useState({ score: 0, complains: 0 });

  useEffect(() => {
    if (orders === undefined || orderItems === undefined || products === undefined || categories === undefined) {
       return; // Still loading from IndexedDB
    }
    
    if (!orders.length && !orderItems.length && !products.length && !categories.length) {
       setLoading(false);
       return;
    }
    
    // 1. Basic Stats
    const totalRev = orders.reduce((acc, o) => acc + o.total, 0);
    setTotalRevenue(totalRev);

    const completedOrdersArr = orders.filter(o => o.status === 'completed' || o.status === 'ready');
    const cancelledOrdersArr = orders.filter(o => o.status === 'cancelled');

    const txCount = completedOrdersArr.length;
    const netSales = completedOrdersArr.reduce((acc, o) => acc + o.total, 0);
    const atv = txCount > 0 ? netSales / txCount : 0;
    
    const discounts = completedOrdersArr.reduce((acc, o) => {
       if (o.discount) {
           if (o.discount_type === 'percent') return acc + ((o.subtotal || 0) * (o.discount / 100));
           return acc + o.discount;
       }
       return acc;
    }, 0);

    const refunds = cancelledOrdersArr.reduce((acc, o) => acc + o.total, 0);

    setRevenueDetails({
       grossSales: netSales + discounts,
       netSales,
       atv,
       transactionCount: txCount,
       discounts,
       refunds
    });

    const today = new Date();
    today.setHours(0,0,0,0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todayOrders = orders.filter(o => new Date(o.created_at) >= today);
    const yesterdayOrders = orders.filter(o => {
      const d = new Date(o.created_at);
      return d >= yesterday && d < today;
    });

    const todayRev = todayOrders.reduce((acc, o) => acc + o.total, 0);
    const yesterdayRev = yesterdayOrders.reduce((acc, o) => acc + o.total, 0);
    
    setTodaySalesCount(todayOrders.length);
    setTodayRevenue(todayRev);
    setRevenueDiff(todayRev - yesterdayRev);

    // 2. Score Metrics (Completion Rate)
    const score = orders.length > 0 ? Math.round((completedOrdersArr.length / orders.length) * 100) : 0;
    setScoreMetrics({ score, complains: cancelledOrdersArr.length });

    // 3. Process Items with Category Mappings
    const productCategoryMap = new Map<string, string>(); // product_id -> category_slug
    products.forEach(p => {
      const cat = categories.find(c => c.id === p.category_id);
      if (cat) productCategoryMap.set(p.id, cat.slug.toLowerCase());
    });

    // 4. Top Products
    const productStats = new Map<string, { qty: number; rev: number }>();
    orderItems.forEach(item => {
       const curr = productStats.get(item.product_id) || { qty: 0, rev: 0 };
       curr.qty += item.quantity;
       curr.rev += (item.quantity * item.unit_price);
       productStats.set(item.product_id, curr);
    });

    const allItems = Array.from(productStats.entries())
      .map(([id, stats]) => ({
        name: products.find(p => p.id === id)?.name || 'Unknown',
        quantity: stats.qty,
        revenue: stats.rev
      }));
    setTopProducts(allItems);

    // 5. Sales Data (Grouped by period)
    const initDayObj = () => {
      const obj: Record<string, number> = {};
      categories.forEach(c => obj[c.slug] = 0);
      return obj;
    };
    
    const salesMap = new Map<string, Record<string, number>>();
    
    if (chartPeriod === 'day' || chartPeriod === 'custom') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        salesMap.set(d.toLocaleDateString('en-US', { weekday: 'short' }), initDayObj());
      }
    } else if (chartPeriod === 'month') {
      for (let i = 3; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - (i * 7));
        salesMap.set(`Week ${4 - i}`, initDayObj());
      }
    } else if (chartPeriod === 'year') {
      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        salesMap.set(d.toLocaleDateString('en-US', { month: 'short' }), initDayObj());
      }
    } else if (chartPeriod === 'all') {
      const currentYear = new Date().getFullYear();
      for (let i = 2; i >= 0; i--) {
        salesMap.set(`${currentYear - i}`, initDayObj());
      }
    }

    orders.forEach(order => {
      const orderDate = new Date(order.created_at);
      let key = '';
      
      if (chartPeriod === 'day' || chartPeriod === 'custom') {
        key = orderDate.toLocaleDateString('en-US', { weekday: 'short' });
      } else if (chartPeriod === 'month') {
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 3600 * 24));
        if (diffDays < 28 && diffDays >= 0) {
           const weekIndex = Math.floor(diffDays / 7);
           key = `Week ${4 - weekIndex}`;
        }
      } else if (chartPeriod === 'year') {
        key = orderDate.toLocaleDateString('en-US', { month: 'short' });
      } else if (chartPeriod === 'all') {
        key = `${orderDate.getFullYear()}`;
      }
      
      if (key && salesMap.has(key)) {
        const dayStats = salesMap.get(key)!;
        const itemsForOrder = orderItems.filter(i => i.order_id === order.id);
        
        itemsForOrder.forEach(item => {
           const slug = productCategoryMap.get(item.product_id);
           const val = item.quantity * item.unit_price;
           if (slug) {
              if (dayStats[slug] !== undefined) dayStats[slug] += val;
              else dayStats[slug] = val;
           }
        });
      }
    });

    const chartData = Array.from(salesMap.entries()).map(([time, stats]) => ({
      time, ...stats
    }));
    setSalesData(chartData);

    // 6. Recent Orders with items for filtering
    const sortedOrders = [...orders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const recent = sortedOrders.map(o => ({
      ...o,
      items: orderItems.filter(i => i.order_id === o.id).map(i => ({
        ...i,
        categorySlug: productCategoryMap.get(i.product_id) || 'other'
      }))
    }));
    setRecentOrders(recent);

    setLoading(false);
  }, [orders, orderItems, products, categories, chartPeriod]);

  return { 
    loading, 
    totalRevenue, 
    revenueDetails,
    todaySalesCount, 
    todayRevenue, 
    revenueDiff, 
    scoreMetrics, 
    topProducts, 
    salesData,
    recentOrders,
    categories: categories || []
  };
}
