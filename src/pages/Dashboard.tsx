import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { MoreHorizontal, RefreshCcw, Banknote, Clock, TrendingUp, Loader2, Star, AlertCircle } from 'lucide-react';
import { useStatistics } from '../hooks/useStatistics';
import { useOrders } from '../hooks/useOrders';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';

export default function Dashboard() {
  const { salesData, performanceData, loading: statsLoading } = useStatistics();
  const { orders, totalOrdersToday, loading: ordersLoading, refetch } = useOrders();

  if (statsLoading || ordersLoading) {
    return <div className="flex justify-center w-full py-16"><Loader2 size={32} className="animate-spin text-primary" /></div>;
  }

  // Format data for Recharts Radar
  const radarData = performanceData.map(p => ({
    subject: p.subject,
    A: p.score,
    fullMark: p.full_mark
  }));

  return (
    <div className="flex-1 overflow-y-auto pr-4 pb-8 space-y-6 animate-in fade-in duration-300">
      
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <Card className="rounded-3xl border-none shadow-sm h-36 flex flex-col justify-between p-6">
          <div className="flex justify-between items-center text-sm font-bold">
            <span className="flex items-center gap-2"><Banknote size={18} className="text-primary" /> Total Revenue</span>
            <span className="text-muted-foreground text-xs hover:text-primary cursor-pointer transition-colors">Details</span>
          </div>
          <div className="flex items-end gap-3 mt-4">
            <span className="text-4xl font-extrabold">$2,357.00</span>
            <span className="text-primary text-sm font-bold mb-1 flex items-center">▲ 2%</span>
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
                Good <span className="text-sm font-semibold text-muted-foreground">2/24</span>
             </div>
           </div>
        </Card>

        <Card className="rounded-3xl border-none shadow-sm h-36 flex items-center p-6">
           <div className="flex flex-col w-full">
             <div className="flex items-center gap-2 text-sm font-bold mb-3">
                <TrendingUp size={18} className="text-primary" /> Today Sales
             </div>
             <div className="text-4xl font-extrabold flex items-baseline gap-2">
                234 <span className="text-primary text-sm font-bold flex items-center">▲ 2%</span>
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
              <div className="text-sm font-bold text-muted-foreground mt-2">▲ $120.00</div>
            </div>
            <div className="flex items-center gap-6">
              <div className="hidden md:flex gap-4 text-xs font-bold text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-accent"></span> Tea</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary"></span> Coffee</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-destructive"></span> Snack</span>
              </div>
              
              <Tabs defaultValue="day" className="hidden sm:block">
                <TabsList className="h-9 bg-muted/50 rounded-full">
                  <TabsTrigger value="day" className="rounded-full text-xs font-bold data-[state=active]:shadow-sm">Day</TabsTrigger>
                  <TabsTrigger value="month" className="rounded-full text-xs font-bold">Month</TabsTrigger>
                  <TabsTrigger value="year" className="rounded-full text-xs font-bold">Year</TabsTrigger>
                  <TabsTrigger value="all" className="rounded-full text-xs font-bold">All</TabsTrigger>
                  <TabsTrigger value="custom" className="rounded-full text-xs font-bold">Custom</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <div className="flex items-center gap-3 text-muted-foreground">
                <RefreshCcw size={18} className="cursor-pointer hover:text-foreground" onClick={refetch} />
                <MoreHorizontal size={22} className="cursor-pointer hover:text-foreground" />
              </div>
            </div>
          </div>
          <div className="flex-1 min-h-0 -ml-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 600}} dy={10} />
                <YAxis hide domain={['dataMin - 1000', 'dataMax + 1000']} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                  labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '8px' }}
                />
                <Line type="monotone" dataKey="tea" stroke="hsl(var(--accent))" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="coffee" stroke="hsl(var(--primary))" strokeWidth={3} dot={{r: 5, fill: 'hsl(var(--primary))', strokeWidth: 3, stroke: '#fff'}} />
                <Line type="monotone" dataKey="snack" stroke="hsl(var(--destructive))" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Score Panel */}
        <Card className="rounded-3xl border-none shadow-sm flex flex-col p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold flex items-center gap-2 text-lg"><Star size={20} className="text-primary fill-primary" /> Score</h3>
            <MoreHorizontal size={20} className="text-muted-foreground cursor-pointer" />
          </div>
          
          <div className="flex items-center justify-center gap-6 py-4 mb-6">
             <div className="w-40 h-24 border-[6px] border-dashed border-[#b6cc38] rounded-t-full border-b-0 relative flex flex-col items-center justify-end pb-2">
                <span className="text-5xl font-black">98</span>
             </div>
             <div className="flex flex-col">
                <span className="text-sm font-bold text-muted-foreground">2/98 order</span>
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
                  <div className="font-bold text-sm">Wrong Menu</div>
                  <div className="text-xs font-semibold text-muted-foreground">Andrew Tate</div>
                </div>
              </div>
              <Button variant="secondary" size="sm" className="h-8 rounded-lg text-xs font-bold gap-2 opacity-80 group-hover:opacity-100">
                Solve <span className="text-destructive font-black">|||</span>
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-3 border border-border/50 rounded-2xl hover:border-border transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#b6cc38]/20 text-[#7a8a25] flex items-center justify-center font-bold">
                  <Star size={18} className="fill-current" />
                </div>
                <div>
                  <div className="font-bold text-sm">Bad Rating</div>
                  <div className="text-xs font-semibold text-muted-foreground">Don Ozwald</div>
                </div>
              </div>
              <Button variant="secondary" size="sm" className="h-8 rounded-lg text-xs font-bold gap-2 opacity-80 group-hover:opacity-100">
                Solve <span className="text-destructive font-black">|||</span>
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Radar Chart */}
        <Card className="rounded-3xl border-none shadow-sm flex flex-col p-6 min-h-[350px]">
          <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-lg">Items Performance</h3>
             <MoreHorizontal size={20} className="text-muted-foreground cursor-pointer" />
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="subject" tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 600}} />
                <PolarRadiusAxis angle={30} domain={[0, 150]} hide />
                <Radar name="Performance" dataKey="A" stroke="hsl(var(--primary))" strokeWidth={2} fill="#b6cc38" fillOpacity={0.25} dot={{r: 4, fill: 'hsl(var(--primary))', strokeWidth: 2}} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Recent Transactions Table */}
        <Card className="lg:col-span-2 rounded-3xl border-none shadow-sm flex flex-col p-6 min-h-[350px]">
          <div className="flex justify-between items-center mb-6">
             <h3 className="font-bold text-lg">Recent Transaction</h3>
             <div className="flex items-center gap-4">
               <RefreshCcw size={18} className="text-muted-foreground cursor-pointer hover:text-foreground" onClick={refetch} />
               <Tabs defaultValue="all" className="hidden sm:block">
                  <TabsList className="h-9 bg-muted/50 rounded-full">
                    <TabsTrigger value="all" className="rounded-full text-xs font-bold data-[state=active]:shadow-sm">All</TabsTrigger>
                    <TabsTrigger value="tea" className="rounded-full text-xs font-bold">Tea</TabsTrigger>
                    <TabsTrigger value="coffee" className="rounded-full text-xs font-bold">Coffee</TabsTrigger>
                    <TabsTrigger value="snack" className="rounded-full text-xs font-bold">Snack</TabsTrigger>
                  </TabsList>
                </Tabs>
             </div>
          </div>
          
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="text-xs font-bold text-muted-foreground border-b border-border">
                  <th className="pb-3 w-10"></th>
                  <th className="pb-3 px-2">Customer Name</th>
                  <th className="pb-3 px-2">Email</th>
                  <th className="pb-3 px-2">Phone</th>
                  <th className="pb-3 px-2">Items</th>
                  <th className="pb-3 px-2 text-right">Value</th>
                  <th className="pb-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map(tx => (
                  <tr key={tx.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors group">
                    <td className="py-3">
                      <div className="w-4 h-4 border-2 border-muted-foreground/30 rounded mx-auto cursor-pointer group-hover:border-primary/50 transition-colors"></div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-3">
                        <img src={`https://i.pravatar.cc/150?u=${tx.id}`} alt={tx.customer_name} className="w-8 h-8 rounded-full bg-muted object-cover" />
                        <span className="font-bold text-sm">{tx.customer_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-sm text-muted-foreground font-semibold">N/A</td>
                    <td className="py-3 px-2 text-sm text-muted-foreground font-semibold">N/A</td>
                    <td className="py-3 px-2 text-sm text-muted-foreground font-semibold">{tx.order_type}</td>
                    <td className="py-3 px-2 text-sm font-extrabold text-right">${Number(tx.total).toFixed(2)}</td>
                    <td className="py-3 text-center">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                        <MoreHorizontal size={18} />
                      </Button>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
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
