import { useState } from 'react';
import { Search, Check, Printer } from 'lucide-react';
import { useOrders } from '../../hooks/useOrders';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { db } from '../../lib/db';

export default function Orders() {
  const { orders, loading, refetch } = useOrders();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.receipt_number && o.receipt_number.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const updateOrderStatus = async (id: string, newStatus: string) => {
    try {
      const order = orders.find(o => o.id === id);
      await db.orders.update(id, { 
        status: newStatus,
        sync_status: 'pending' 
      });
      
      if (newStatus === 'ready' && order) {
        const { createNotification } = await import('../../hooks/useNotifications');
        await createNotification({
          id: crypto.randomUUID(),
          type: 'order',
          title: 'Order Ready',
          message: `Receipt #${order.receipt_number || order.id.split('-')[0]} is ready.`,
          is_read: false,
          created_at: new Date().toISOString()
        });
      }
      
      refetch();
      if (navigator.onLine) {
        import('../../lib/sync').then(({ syncUp }) => syncUp());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePrint = async (order: any) => {
    try {
      // For a real app, we'd fetch order items from DB first
      const items = await db.orderItems.where('order_id').equals(order.id).toArray();
      // Join with products
      const itemsWithProducts = await Promise.all(items.map(async item => {
        const product = await db.products.get(item.product_id);
        return { ...item, products: product };
      }));
      
      const { printReceipt } = await import('../../lib/printer');
      await printReceipt(order, itemsWithProducts);
    } catch (e) {
      console.error('Print failed', e);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto pr-4 pb-8 space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Orders</h1>
          <p className="text-muted-foreground mt-1">Manage and track customer orders</p>
        </div>
      </div>

      <Card className="rounded-3xl border-none shadow-sm flex flex-col p-6 min-h-[500px]">
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input 
              placeholder="Search orders..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 rounded-xl bg-muted/50 border-transparent"
            />
          </div>
        </div>

        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="text-xs font-bold text-muted-foreground border-b border-border">
                <th className="pb-3 px-2">Receipt No.</th>
                <th className="pb-3 px-2">Customer</th>
                <th className="pb-3 px-2">Type</th>
                <th className="pb-3 px-2">Total</th>
                <th className="pb-3 px-2">Status</th>
                <th className="pb-3 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">Loading orders...</td>
                </tr>
              ) : filteredOrders.map(order => (
                <tr key={order.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors group">
                  <td className="py-4 px-2 text-sm text-muted-foreground font-mono">{order.receipt_number || order.id.split('-')[0]}</td>
                  <td className="py-4 px-2 font-bold text-sm">{order.customer_name}</td>
                  <td className="py-4 px-2 text-sm text-muted-foreground font-semibold">{order.order_type}</td>
                  <td className="py-4 px-2 font-extrabold text-sm">${Number(order.total).toFixed(2)}</td>
                  <td className="py-4 px-2">
                    {order.status === 'completed' && <Badge variant="secondary" className="bg-primary/10 text-primary">Completed</Badge>}
                    {order.status === 'ready' && <Badge variant="secondary" className="bg-blue-500/10 text-blue-600">Ready</Badge>}
                    {order.status === 'preparing' && <Badge variant="secondary" className="bg-purple-500/10 text-purple-600">Preparing</Badge>}
                    {order.status === 'pending' && <Badge variant="secondary" className="bg-amber-500/10 text-amber-600">Pending</Badge>}
                    {!['completed', 'ready', 'preparing', 'pending'].includes(order.status) && <Badge variant="secondary">{order.status}</Badge>}
                  </td>
                  <td className="py-4 px-2 text-right">
                    <div className="flex justify-end gap-2">
                      {order.status === 'pending' && (
                        <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs font-bold gap-1 text-purple-600 border-purple-500/20 hover:bg-purple-500/10" onClick={() => updateOrderStatus(order.id, 'preparing')}>
                           Prepare
                        </Button>
                      )}
                      {order.status === 'preparing' && (
                        <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs font-bold gap-1 text-blue-600 border-blue-500/20 hover:bg-blue-500/10" onClick={() => updateOrderStatus(order.id, 'ready')}>
                           Mark Ready
                        </Button>
                      )}
                      {order.status === 'ready' && (
                        <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs font-bold gap-1 text-primary border-primary/20 hover:bg-primary/10" onClick={() => updateOrderStatus(order.id, 'completed')}>
                          <Check size={14} /> Complete
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handlePrint(order)}>
                        <Printer size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground font-semibold">No orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
