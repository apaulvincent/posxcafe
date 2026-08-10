import { useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { MoreHorizontal, RefreshCcw, Banknote, Clock, TrendingUp, Loader2, Star, AlertCircle } from 'lucide-react';
import { useStatistics } from '../hooks/useStatistics';
import { useOrders } from '../hooks/useOrders';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { db } from '../lib/db';
import { syncAll } from '../lib/sync';

const CATEGORY_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  'hsl(var(--destructive))',
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
];

export default function Dashboard() {
  const [chartPeriod, setChartPeriod] = useState<'day' | 'month' | 'year' | 'all' | 'custom'>('day');
  
  const { 
    salesData, 
    topProducts, 
    loading: statsLoading,
    totalRevenue,
    revenueDetails,
    todaySalesCount,
    revenueDiff,
    scoreMetrics,
    recentOrders,
    categories
  } = useStatistics(chartPeriod);
  
  const { totalOrdersToday, loading: ordersLoading, refetch } = useOrders();
  const [txFilter, setTxFilter] = useState('all');
  const [itemsSortBy, setItemsSortBy] = useState<'quantity' | 'revenue'>('quantity');

  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [isSyncing, setIsSyncing] = useState(false);

  const handleRefresh = async () => {
    setIsSyncing(true);
    await syncAll();
    refetch();
    setIsSyncing(false);
  };

  const handleCancelOrders = async (orderIds: string[]) => {
    if (!orderIds.length) return;
    try {
      for (const id of orderIds) {
         await db.orders.update(id, { status: 'cancelled', sync_status: 'pending' });
      }
      setSelectedOrders(new Set());
      syncAll();
    } catch (e) {
      console.error('Failed to cancel orders', e);
    }
  };

  const filteredOrders = recentOrders
    .filter(tx => txFilter === 'all' || tx.items.some(i => i.categorySlug === txFilter))
    .slice(0, 5);

  const toggleAllSelection = () => {
    if (selectedOrders.size > 0 && selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredOrders.map(o => o.id)));
    }
  };

  const toggleOrderSelection = (id: string) => {
    const next = new Set(selectedOrders);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedOrders(next);
  };

  const displayTopProducts = [...topProducts]
    .sort((a, b) => b[itemsSortBy] - a[itemsSortBy])
    .slice(0, 5);

  if (statsLoading || ordersLoading) {
    return <div className="flex justify-center w-full py-16"><Loader2 size={32} className="animate-spin text-primary" /></div>;
  }

  return (
    <div className="flex-1 overflow-y-auto pr-4 pb-8 space-y-6">
      
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <Card className="rounded-3xl border-none shadow-sm h-36 flex flex-col justify-between p-6">
          <div className="flex justify-between items-center text-sm font-bold">
            <span className="flex items-center gap-2"><Banknote size={18} className="text-primary" /> Total Revenue</span>
            <Dialog>
              <DialogTrigger render={<span className="text-muted-foreground text-xs hover:text-primary cursor-pointer transition-colors">Details</span>} />
              <DialogContent className="sm:max-w-[425px] rounded-3xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-xl"><Banknote className="text-primary" /> Revenue Details</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                  <div className="flex justify-between items-center pb-4 border-b border-border/50">
                    <span className="text-sm font-bold text-muted-foreground">Gross Sales</span>
                    <span className="font-extrabold text-lg">${revenueDetails.grossSales.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-border/50">
                    <span className="text-sm font-bold text-muted-foreground">Discounts Applied</span>
                    <span className="font-extrabold text-lg text-destructive">-${revenueDetails.discounts.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-border/50">
                    <span className="text-sm font-bold text-muted-foreground">Net Sales</span>
                    <span className="font-extrabold text-lg text-primary">${revenueDetails.netSales.toFixed(2)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="flex flex-col p-4 bg-muted/30 rounded-2xl">
                      <span className="text-xs font-bold text-muted-foreground mb-1">Avg Transaction</span>
                      <span className="font-extrabold text-lg">${revenueDetails.atv.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col p-4 bg-muted/30 rounded-2xl">
                      <span className="text-xs font-bold text-muted-foreground mb-1">Total Transactions</span>
                      <span className="font-extrabold text-lg">{revenueDetails.transactionCount}</span>
                    </div>
                  </div>
                  {revenueDetails.refunds > 0 && (
                    <div className="flex justify-between items-center p-4 bg-destructive/10 rounded-2xl mt-2">
                       <span className="text-sm font-bold text-destructive">Lost to Cancellations</span>
                       <span className="font-extrabold text-lg text-destructive">${revenueDetails.refunds.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex items-end gap-3 mt-4">
            <span className="text-4xl font-extrabold">${totalRevenue.toFixed(2)}</span>
          </div>
        </Card>

        <Card className="rounded-3xl border-none shadow-sm h-36 flex items-center p-6">
           <div className="flex flex-col w-full">
             <div className="flex items-center gap-2 text-sm font-bold mb-3">
                <Clock size={18} className="text-primary" /> On Progress
             </div>
             <div className="text-4xl font-extrabold flex items-baseline gap-2">
                {totalOrdersToday} <span className="text-sm font-semibold text-muted-foreground">Orders</span>
             </div>
           </div>
        </Card>

        <Card className="rounded-3xl border-none shadow-sm h-36 flex items-center p-6">
           <div className="flex flex-col w-full">
             <div className="flex justify-between items-center text-sm font-bold mb-3">
                <span className="flex items-center gap-2"><TrendingUp size={18} className="text-primary" /> Performance</span>
             </div>
             <div className="text-4xl font-extrabold flex items-baseline gap-2">
                {scoreMetrics.score >= 80 ? 'Good' : (scoreMetrics.score >= 50 ? 'Fair' : 'Poor')} 
                <span className="text-sm font-semibold text-muted-foreground ml-2">{scoreMetrics.score}/100</span>
             </div>
           </div>
        </Card>

        <Card className="rounded-3xl border-none shadow-sm h-36 flex items-center p-6">
           <div className="flex flex-col w-full">
             <div className="flex items-center gap-2 text-sm font-bold mb-3">
                <TrendingUp size={18} className="text-primary" /> Today Sales
             </div>
             <div className="text-4xl font-extrabold flex items-baseline gap-2">
                {todaySalesCount} 
                <span className={`text-sm font-bold flex items-center ${revenueDiff >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  {revenueDiff >= 0 ? '▲' : '▼'} ${Math.abs(revenueDiff).toFixed(2)}
                </span>
             </div>
           </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px]">
        {/* Main Chart */}
        <Card className="lg:col-span-2 rounded-3xl border-none shadow-sm flex flex-col p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-bold flex items-center gap-2 text-lg"><TrendingUp size={24} className="text-primary" /> Sales Statistic</h3>
              <div className={`text-sm font-bold mt-2 ${revenueDiff >= 0 ? 'text-primary' : 'text-destructive'}`}>
                {revenueDiff >= 0 ? '▲' : '▼'} ${Math.abs(revenueDiff).toFixed(2)}
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden md:flex gap-4 text-xs font-bold text-muted-foreground flex-wrap">
                {categories.map((cat, i) => (
                   <span key={cat.id} className="flex items-center gap-1.5">
                     <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}></span> 
                     {cat.name}
                   </span>
                ))}
              </div>
              
              <Tabs value={chartPeriod} onValueChange={(v) => setChartPeriod(v as any)} className="hidden sm:block">
                <TabsList className="h-9 bg-muted/50 rounded-full">
                  <TabsTrigger value="day" className="rounded-full text-xs font-bold data-[state=active]:shadow-sm">Day</TabsTrigger>
                  <TabsTrigger value="month" className="rounded-full text-xs font-bold">Month</TabsTrigger>
                  <TabsTrigger value="year" className="rounded-full text-xs font-bold">Year</TabsTrigger>
                  <TabsTrigger value="all" className="rounded-full text-xs font-bold">All</TabsTrigger>
                  <TabsTrigger value="custom" className="rounded-full text-xs font-bold">Custom</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <div className="flex items-center gap-3 text-muted-foreground">
                <RefreshCcw size={18} className={`cursor-pointer hover:text-foreground ${isSyncing ? 'animate-spin' : ''}`} onClick={handleRefresh} />
                <DropdownMenu>
                  <DropdownMenuTrigger render={
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground rounded-full hover:bg-muted/50">
                      <MoreHorizontal size={22} className="cursor-pointer hover:text-foreground" />
                    </Button>
                  } />
                  <DropdownMenuContent align="end" className="w-48 rounded-xl">
                    <DropdownMenuItem disabled title="( Coming soon )" className="font-bold text-xs text-muted-foreground">Export Data (CSV)</DropdownMenuItem>
                    <DropdownMenuItem disabled title="( Coming soon )" className="font-bold text-xs text-muted-foreground">Change Chart Type</DropdownMenuItem>
                    <DropdownMenuItem disabled title="( Coming soon )" className="font-bold text-xs text-muted-foreground">Compare Period</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled title="( Coming soon )" className="font-bold text-xs text-muted-foreground">View Detailed Report</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
          <div className="flex-1 min-h-0 -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 600}} dy={10} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                  labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '8px' }}
                />
                {categories.map((cat, i) => (
                  <Line 
                    key={cat.id}
                    type="monotone" 
                    dataKey={cat.slug} 
                    stroke={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} 
                    strokeWidth={3} 
                    dot={i === 0 ? {r: 5, fill: CATEGORY_COLORS[i % CATEGORY_COLORS.length], strokeWidth: 3, stroke: '#fff'} : false} 
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Score Panel */}
        <Card className="rounded-3xl border-none shadow-sm flex flex-col p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold flex items-center gap-2 text-lg"><Star size={20} className="text-primary fill-primary" /> Score</h3>
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground rounded-full hover:bg-muted/50">
                  <MoreHorizontal size={20} className="cursor-pointer hover:text-foreground" />
                </Button>
              } />
              <DropdownMenuContent align="end" className="w-48 rounded-xl">
                <DropdownMenuItem disabled title="( Coming soon )" className="font-bold text-xs text-muted-foreground">View Full Feedback</DropdownMenuItem>
                <DropdownMenuItem disabled title="( Coming soon )" className="font-bold text-xs text-muted-foreground">Set Target Goal</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled title="( Coming soon )" className="font-bold text-xs text-muted-foreground">Export Scorecard</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="flex items-center justify-center gap-6 py-4 mb-6">
             <div className="w-40 h-24 border-[6px] border-dashed border-[#b6cc38] rounded-t-full border-b-0 relative flex flex-col items-center justify-end pb-2">
                <span className="text-5xl font-black">{scoreMetrics.score}</span>
             </div>
             <div className="flex flex-col">
                <span className="text-sm font-bold text-muted-foreground">{scoreMetrics.complains} order</span>
                <span className="font-extrabold text-lg">Complains</span>
             </div>
          </div>

          <div className="flex flex-col gap-3 mt-auto">
            <div className="flex items-center justify-between p-3 border border-border/50 rounded-2xl hover:border-border transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center font-bold">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <div className="font-bold text-sm">Cancelled Orders</div>
                  <div className="text-xs font-semibold text-muted-foreground">{scoreMetrics.complains} items returned</div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 border border-border/50 rounded-2xl hover:border-border transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#b6cc38]/20 text-[#7a8a25] flex items-center justify-center font-bold">
                  <Star size={18} className="fill-current" />
                </div>
                <div>
                  <div className="font-bold text-sm">Completion Rate</div>
                  <div className="text-xs font-semibold text-muted-foreground">{scoreMetrics.score}% success</div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <Card className="rounded-3xl border-none shadow-sm flex flex-col p-6 min-h-[350px]">
          <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-lg">Items Performance</h3>
             <DropdownMenu>
               <DropdownMenuTrigger render={
                 <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground rounded-full hover:bg-muted/50">
                   <MoreHorizontal size={20} />
                 </Button>
               } />
               <DropdownMenuContent align="end" className="w-52 rounded-xl">
                 <DropdownMenuItem onClick={() => setItemsSortBy('quantity')} className="font-bold text-xs cursor-pointer flex justify-between">
                   Sort by Quantity {itemsSortBy === 'quantity' && <span className="text-primary">✓</span>}
                 </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => setItemsSortBy('revenue')} className="font-bold text-xs cursor-pointer flex justify-between">
                   Sort by Revenue {itemsSortBy === 'revenue' && <span className="text-primary">✓</span>}
                 </DropdownMenuItem>
                 <DropdownMenuSeparator />
                 <DropdownMenuItem disabled title="( Coming soon )" className="font-bold text-xs text-muted-foreground">
                   Export CSV
                 </DropdownMenuItem>
               </DropdownMenuContent>
             </DropdownMenu>
          </div>
          <div className="flex-1 min-h-0 flex flex-col justify-center">
            {displayTopProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-muted-foreground opacity-50 h-full">
                <span className="font-bold text-sm">No items sold yet.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={displayTopProducts} layout="vertical" margin={{ top: 15, right: 0, left: 10, bottom: 0 }}>
                  <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  width={1}
                  tick={(props: any) => {
                    const { y, payload } = props;
                    return (
                      <text x={10} y={y - 10} fill="hsl(var(--foreground))" fontSize={12} fontWeight={600} textAnchor="start">
                        {payload.value}
                      </text>
                    );
                  }}
                />
                <Tooltip 
                  cursor={{fill: 'hsl(var(--muted)/0.5)'}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                />
                <Bar dataKey={itemsSortBy} fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Recent Transactions Table */}
        <Card className="lg:col-span-2 rounded-3xl border-none shadow-sm flex flex-col p-6 min-h-[350px]">
          <div className="flex justify-between items-center mb-6">
             <div className="flex items-center gap-4">
               <h3 className="font-bold text-lg">Recent Transaction</h3>
               {selectedOrders.size > 0 && (
                 <div className="flex items-center gap-2">
                   <span className="text-sm font-bold bg-muted px-2 py-1 rounded-full">{selectedOrders.size} selected</span>
                   <Button variant="destructive" size="sm" className="h-8 rounded-full font-bold text-xs" onClick={() => handleCancelOrders(Array.from(selectedOrders))}>
                     Cancel Selected
                   </Button>
                 </div>
               )}
             </div>
             <div className="flex items-center gap-4">
               <RefreshCcw size={18} className={`text-muted-foreground cursor-pointer hover:text-foreground ${isSyncing ? 'animate-spin' : ''}`} onClick={handleRefresh} />
               <Tabs value={txFilter} onValueChange={setTxFilter} className="hidden sm:block">
                  <TabsList className="h-9 bg-muted/50 rounded-full overflow-x-auto max-w-[400px] flex-nowrap hide-scrollbar">
                    <TabsTrigger value="all" className="rounded-full text-xs font-bold data-[state=active]:shadow-sm">All</TabsTrigger>
                    {categories.map(cat => (
                      <TabsTrigger key={cat.id} value={cat.slug.toLowerCase()} className="rounded-full text-xs font-bold data-[state=active]:shadow-sm">
                        {cat.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
             </div>
          </div>
          
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="text-xs font-bold text-muted-foreground border-b border-border">
                  <th className="pb-3 w-10 px-2">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-muted-foreground/30 text-primary focus:ring-primary accent-primary cursor-pointer"
                      checked={selectedOrders.size > 0 && selectedOrders.size === filteredOrders.length}
                      ref={input => {
                        if (input) {
                          input.indeterminate = selectedOrders.size > 0 && selectedOrders.size < filteredOrders.length;
                        }
                      }}
                      onChange={toggleAllSelection}
                    />
                  </th>
                  <th className="pb-3 px-2">Customer Name</th>
                  <th className="pb-3 px-2">Products</th>
                  <th className="pb-3 px-2">Items</th>
                  <th className="pb-3 px-2 text-right">Value</th>
                  <th className="pb-3 px-2 text-center">Status</th>
                  <th className="pb-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(tx => (
                  <tr key={tx.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors group">
                    <td className="py-3 px-2">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-muted-foreground/30 text-primary focus:ring-primary accent-primary cursor-pointer"
                        checked={selectedOrders.has(tx.id)}
                        onChange={() => toggleOrderSelection(tx.id)}
                      />
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          {(tx.customer_name || 'Guest').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-bold text-sm">{tx.customer_name || 'Guest'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-sm text-muted-foreground font-semibold">
                      {Array.from(new Set(tx.items.map(i => {
                        const cat = categories.find(c => c.slug.toLowerCase() === i.categorySlug);
                        return cat ? cat.name : (i.categorySlug.charAt(0).toUpperCase() + i.categorySlug.slice(1));
                      }))).join(', ')}
                    </td>
                    <td className="py-3 px-2 text-sm text-muted-foreground font-semibold">
                      {tx.items.reduce((acc, i) => acc + i.quantity, 0)} items
                    </td>
                    <td className="py-3 px-2 text-sm font-extrabold text-right">${Number(tx.total).toFixed(2)}</td>
                    <td className="py-3 px-2 text-center">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        tx.status === 'completed' ? 'bg-primary/10 text-primary' : 
                        tx.status === 'cancelled' ? 'bg-destructive/10 text-destructive' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      {tx.status !== 'cancelled' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger render={
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground rounded-full hover:bg-muted/50">
                              <MoreHorizontal size={18} />
                            </Button>
                          } />
                          <DropdownMenuContent align="end" className="w-32 rounded-xl">
                            <DropdownMenuItem onClick={() => handleCancelOrders([tx.id])} className="font-bold text-xs cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
                              Cancel Order
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-sm font-bold text-muted-foreground">No recent transactions</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

    </div>
  );
}
