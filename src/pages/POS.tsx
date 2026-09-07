import { ArrowRight, ChevronDown, DollarSign, Eraser, FileEdit, List, Loader2, Minus, Percent, Plus, Printer, Settings2, Tag } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Input } from '../components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useCategories } from '../hooks/useCategories';
import { useDiscounts } from '../hooks/useDiscounts';
import { useTables } from '../hooks/useTables';
import type { Product } from '../hooks/useProducts';
import { useProducts } from '../hooks/useProducts';
import { db } from '../lib/db';

import { useCurrency } from '../contexts/CurrencyContext';
export default function POS() {
  const { currencySymbol } = useCurrency();
  const [activeCategory, setActiveCategory] = useState<string>('coffee');
  const { categories, loading: loadingCats } = useCategories();
  const { discounts } = useDiscounts();
  const { tables } = useTables();
  const activeTables = tables.filter(t => t.is_active).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
  const activeDiscounts = discounts.filter(d => d.is_active);
  const { products, loading: loadingProds } = useProducts();
  
  type CartItem = Product & { qty: number };
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState('Dine In');
  const [tableNumber, setTableNumber] = useState('Table 1');
  const [isPlacing, setIsPlacing] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [receiptNumber, setReceiptNumber] = useState<string>('Loading...');
  const [orderNotes, setOrderNotes] = useState('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'percent' | 'amount'>('percent');
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [isDiscountActive, setIsDiscountActive] = useState(false);
  const [discountView, setDiscountView] = useState<'percent' | 'amount'>('percent');

  const clearCart = () => {
    setCart([]);
    setCustomerName('');
    setOrderNotes('');
    setDiscountAmount(0);
    setDiscountType('percent');
    setDiscountView('percent');
    setIsDiscountActive(false);
  };

  const printLastReceipt = async () => {
    try {
      const lastOrder = await db.orders.orderBy('created_at').last();
      if (lastOrder) {
        const items = await db.orderItems.where('order_id').equals(lastOrder.id).toArray();
        const { printReceipt } = await import('../lib/printer');
        await printReceipt(lastOrder, items);
      } else {
        console.log("No previous orders found");
      }
    } catch (e) {
      console.error("Error printing last receipt:", e);
    }
  };
  
  const generateNewReceiptNumber = async () => {
    try {
      const today = new Date();
      const dateStr = today.getFullYear() + 
                      String(today.getMonth() + 1).padStart(2, '0') + 
                      String(today.getDate()).padStart(2, '0');
      
      const terminalId = localStorage.getItem('terminal_id') || 'T1';
      const prefix = `${terminalId}-${dateStr}-`;
      
      const startOfDay = new Date(today.setHours(0,0,0,0)).toISOString();
      const todayOrders = await db.orders.where('created_at').aboveOrEqual(startOfDay).toArray();
      
      let maxSeq = 0;
      for (const order of todayOrders) {
        if (order.receipt_number && order.receipt_number.startsWith(prefix)) {
          const parts = order.receipt_number.split('-');
          if (parts.length === 3) {
            const seq = parseInt(parts[2], 10);
            if (!isNaN(seq) && seq > maxSeq) {
              maxSeq = seq;
            }
          }
        }
      }
      
      const nextSeq = String(maxSeq + 1).padStart(5, '0');
      setReceiptNumber(`${prefix}${nextSeq}`);
    } catch (e) {
      console.error('Error generating receipt number', e);
      setReceiptNumber(`T1-${Date.now().toString().slice(-6)}`); 
    }
  };

  useEffect(() => {
    generateNewReceiptNumber();
  }, []);
  const loading = loadingCats || loadingProds;

  useEffect(() => {
    if (categories.length > 0 && activeCategory === 'coffee') {
      setActiveCategory(categories[0].slug);
    }
  }, [categories]);

  const subtotal = cart.reduce((acc, item) => acc + (Number(item.price) * item.qty), 0);
  const tax = subtotal * 0.1;
  const discountValue = isDiscountActive 
    ? (discountType === 'percent' ? subtotal * (discountAmount / 100) : discountAmount)
    : 0;
  const total = Math.max(0, subtotal + tax - discountValue);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(p => p.id === product.id);
      if (existing) {
        return prev.map(p => p.id === product.id ? { ...p, qty: p.qty + 1 } : p);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.map(p => p.id === id ? { ...p, qty: p.qty - 1 } : p).filter(p => p.qty > 0));
  };

  const placeOrder = async () => {
    if (cart.length === 0) return;
    setIsPlacing(true);
    try {
      const orderId = crypto.randomUUID();
      const newOrder = {
        id: orderId,
        customer_name: customerName.trim() || 'Guest',
        table_number: orderType === 'Dine In' ? tableNumber : orderType,
        order_type: orderType,
        subtotal,
        tax,
        total,
        status: 'pending',
        created_at: new Date().toISOString(),
        receipt_number: receiptNumber,
        sync_status: 'pending' as const,
        discount: discountValue,
        discount_type: discountType,
        notes: orderNotes
      };

      await db.orders.add(newOrder);

      const items = cart.map(c => ({
        order_id: orderId,
        product_id: c.id,
        quantity: c.qty,
        unit_price: Number(c.price),
        notes: ''
      }));
      await db.orderItems.bulkAdd(items);

      // Deduct Inventory
      for (const item of items) {
        const product = await db.products.get(item.product_id);
        if (product && product.track_inventory && product.inventory_count !== undefined) {
          const newCount = Math.max(0, product.inventory_count - item.quantity);
          const isAvailable = newCount > 0 ? product.is_available : false;
          await db.products.update(product.id, { 
            inventory_count: newCount, 
            is_available: isAvailable,
            sync_status: 'pending' 
          });
        }
      }

      clearCart();
      await generateNewReceiptNumber();
      
      // Trigger background sync
      if (navigator.onLine) {
        import('../lib/sync').then(({ syncUp }) => syncUp());
      }
      
      // Auto Print Receipt
      import('../lib/printer').then(({ printReceipt }) => {
        printReceipt(newOrder, items).then(result => {
          if (result.simulated) {
            console.log('Simulated print successful');
          }
        });
      });
    } catch(e) {
      console.error(e);
    } finally {
      setIsPlacing(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const cat = categories.find(c => c.slug === activeCategory);
    return p.category_id === cat?.id && p.is_available !== false;
  });
  
  return (
    <div className="flex w-full h-full gap-6 animate-in fade-in duration-300">
      
      {/* Left Main Content */}
      <div className="flex-1 flex flex-col gap-6 min-w-0">
        
        {/* Categories */}
        <div className="flex gap-4">
          {loading ? (
             <div className="flex justify-center w-full py-8">
               <Loader2 size={32} className="animate-spin text-primary" />
             </div>
          ) : categories.map(cat => {
            const catProductsCount = products.filter(p => p.category_id === cat.id && p.is_available !== false).length;
            const isOutOfStock = catProductsCount === 0;
            const statusText = isOutOfStock ? 'Need to re-stock' : 'Available';
            const isAlert = isOutOfStock;
            const isActive = activeCategory === cat.slug;
            
            // Dynamic styling based on category
            let colorClasses = "bg-card text-foreground hover:bg-muted";
            if (isActive) {
              if (cat.slug === 'tea') colorClasses = "bg-accent text-accent-foreground shadow-md";
              else colorClasses = "bg-primary text-primary-foreground shadow-md";
            }
            
            return (
              <button 
                key={cat.id}
                onClick={() => setActiveCategory(cat.slug)}
                className={`flex-1 rounded-3xl p-6 relative overflow-hidden transition-all duration-200 border-2 ${isActive ? 'border-transparent' : 'border-transparent hover:border-primary/20'} ${colorClasses}`}
              >
                <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-10 
                  ${isAlert ? (isActive ? 'bg-destructive text-destructive-foreground shadow-sm' : 'bg-destructive/10 text-destructive') : 'bg-background/90 text-primary'}
                `}>
                  {statusText}
                </div>
                <h2 className="text-3xl font-extrabold mb-1 text-left tracking-tight">{cat.name}</h2>
                <p className="text-sm font-medium opacity-90 text-left">{catProductsCount} items</p>
                <div className="absolute -right-5 -bottom-5 w-32 h-32 rounded-full bg-black/10 mix-blend-overlay"></div>
              </button>
            );
          })}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto pr-2 pb-4">
          {filteredProducts.length === 0 && !loadingCats && !loadingProds ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground pb-20">
              <p className="font-extrabold mb-4 text-2xl">No products available</p>
              <Link to="/admin/products" className="text-primary hover:bg-primary hover:text-primary-foreground transition-colors font-bold text-lg border-2 border-primary bg-primary/5 px-8 py-3 rounded-full shadow-sm hover:shadow-md">
                Add a product
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
              {filteredProducts.map(product => (
                <div key={product.id} className="bg-card rounded-2xl p-4 flex flex-col shadow-sm border border-border hover:shadow-md hover:border-primary/30 transition-all group">
                  <div className="h-36 flex items-center justify-center mb-4 p-2 bg-muted/20 rounded-xl">
                    <img src={product.image_url} alt={product.name} className="max-w-full max-h-full object-contain drop-shadow-xl group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <div className="flex justify-between items-end mt-auto">
                    <div className="overflow-hidden">
                      <h3 className="font-bold text-foreground text-base mb-1 truncate">{product.name}</h3>
                      <p className="text-sm font-bold text-muted-foreground">{currencySymbol}{Number(product.price).toFixed(2)}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="rounded-full w-10 h-10 border-primary text-primary hover:bg-primary hover:text-primary-foreground shrink-0 ml-2"
                      onClick={() => addToCart(product)}
                    >
                      <Plus size={20} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar - Cart */}
      <Card className="w-[420px] rounded-3xl flex flex-col shrink-0 shadow-lg border-none overflow-hidden">
        <CardContent className="p-6 flex flex-col h-full gap-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold">Purchase Receipt</h2>
              <p className="text-sm text-muted-foreground font-semibold">#{receiptNumber}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" className="rounded-full w-10 h-10 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={clearCart} title="Clear Cart">
                <Eraser size={20} />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger render={
                  <Button variant="outline" size="icon" className="rounded-full w-10 h-10">
                    <List size={20} />
                  </Button>
                } />
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => setIsDiscountModalOpen(true)} className="gap-2 py-3 cursor-pointer">
                    <Tag size={16} /> Add Discount
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsNoteModalOpen(true)} className="gap-2 py-3 cursor-pointer">
                    <FileEdit size={16} /> Add Order Note
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={printLastReceipt} className="gap-2 py-3 cursor-pointer">
                    <Printer size={16} /> Print Last Receipt
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <Tabs defaultValue="dine-in" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-12 rounded-full bg-muted p-1">
              <TabsTrigger value="dine-in" className={`rounded-full text-xs font-bold transition-all ${orderType === 'Dine In' ? 'bg-primary text-primary-foreground hover:text-primary-foreground shadow-md' : 'hover:bg-muted/80'}`} onClick={() => setOrderType('Dine In')}>Dine In</TabsTrigger>
              <TabsTrigger value="take-away" className={`rounded-full text-xs font-bold transition-all ${orderType === 'Take Away' ? 'bg-primary text-primary-foreground hover:text-primary-foreground shadow-md' : 'hover:bg-muted/80'}`} onClick={() => setOrderType('Take Away')}>Take Away</TabsTrigger>
              <TabsTrigger value="online" className={`rounded-full text-xs font-bold transition-all ${orderType === 'Order Online' ? 'bg-primary text-primary-foreground hover:text-primary-foreground shadow-md' : 'hover:bg-muted/80'}`} onClick={() => setOrderType('Order Online')}>Order Online</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-4">
            <div className="flex-1 space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Customer name</label>
              <Input 
                placeholder="Walk-in Guest"
                value={customerName} 
                onChange={(e) => setCustomerName(e.target.value)}
                className="h-11 rounded-xl font-semibold bg-muted/50 border-transparent focus:bg-background focus:border-primary/50" 
              />
            </div>
            {orderType === 'Dine In' && (
              <div className="flex-1 space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Table</label>
                <div className="relative">
                  <select 
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className="h-11 w-full appearance-none rounded-xl font-semibold bg-muted/50 border-transparent px-3 pr-10 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {activeTables.map(t => (
                      <option key={t.id} value={t.name}>{t.name} {t.capacity ? `(${t.capacity} pax)` : ''}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            )}
          </div>

          {orderNotes && (
            <div className="flex items-center gap-2 bg-amber-500/10 text-amber-700 dark:text-amber-500 p-3 rounded-xl border border-amber-500/20 cursor-pointer" onClick={() => setIsNoteModalOpen(true)}>
              <FileEdit size={16} className="shrink-0" />
              <span className="text-sm font-semibold truncate">{orderNotes}</span>
            </div>
          )}

          <div className="flex flex-col flex-1 min-h-0">
            <h3 className="font-extrabold text-base mb-3 shrink-0">Order list</h3>
            <div className="flex-1 overflow-y-auto flex flex-col gap-4 pr-2">
              {cart.map(item => (
                <div key={item.id} className="flex gap-4 items-center group">
                  <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center p-2 shrink-0 group-hover:bg-muted/50 transition-colors">
                     <img src={item.image_url} alt={item.name} className="max-w-full max-h-full object-contain mix-blend-multiply" />
                  </div>
                  <div className="flex-1 flex flex-col justify-center min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="truncate pr-2">
                        <h4 className="font-bold text-sm truncate">{item.name}</h4>
                        <p className="text-xs font-semibold text-muted-foreground">{currencySymbol}{Number(item.price).toFixed(2)} x {item.qty}</p>
                      </div>
                      <span className="font-bold text-sm shrink-0">{currencySymbol}{(Number(item.price) * item.qty).toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center mt-2">
                      <Badge variant="secondary" className="rounded-md px-2 py-0.5 text-[10px] font-bold text-muted-foreground gap-1">
                        <Settings2 size={10} /> Edit
                      </Badge>
                      <div className="flex items-center gap-3 bg-muted rounded-full px-2 py-1">
                        <button className="text-muted-foreground hover:text-foreground p-0.5" onClick={() => removeFromCart(item.id)}><Minus size={14} /></button>
                        <span className="font-bold text-xs w-4 text-center">{item.qty}</span>
                        <button className="text-muted-foreground hover:text-foreground p-0.5" onClick={() => addToCart(item)}><Plus size={14} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {cart.length === 0 && (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground shrink-0">
                   <p className="font-semibold text-sm">Cart is empty</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-auto border-t-2 border-dashed border-border pt-4 shrink-0">
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-muted-foreground">Subtotal</span>
                <span className="font-bold">{currencySymbol}{subtotal.toFixed(2)}</span>
              </div>
              {isDiscountActive && discountValue > 0 && (
                <div className="flex justify-between items-center text-sm text-destructive">
                  <span className="font-semibold flex items-center gap-2">
                    Discount Applied
                    <div className="flex items-center gap-0.5 bg-muted rounded p-0.5 text-muted-foreground">
                      <button className={`p-1 rounded ${discountView === 'percent' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`} onClick={() => setDiscountView('percent')}><Percent size={12} /></button>
                      <button className={`p-1 rounded ${discountView === 'amount' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`} onClick={() => setDiscountView('amount')}><DollarSign size={12} /></button>
                    </div>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">
                      {discountView === 'percent' ? `-${discountType === 'percent' ? discountAmount : Math.round((discountAmount / subtotal) * 100)}%` : `-${currencySymbol}${discountValue.toFixed(2)}`}
                    </span>
                    <Button variant="ghost" size="icon" className="w-6 h-6 text-destructive hover:bg-destructive/10" onClick={() => { setIsDiscountActive(false); setDiscountAmount(0); }}>
                      <Eraser size={14} />
                    </Button>
                  </div>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-muted-foreground">Tax (10%)</span>
                <span className="font-bold">{currencySymbol}{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-end mt-2 pt-2 border-t border-border">
                <span className="font-extrabold text-lg">Total</span>
                <span className="font-extrabold text-2xl text-primary">{currencySymbol}{total.toFixed(2)}</span>
              </div>
            </div>

            <Button 
              className="w-full h-16 rounded-2xl text-lg font-bold shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all relative overflow-hidden group disabled:opacity-60 disabled:hover:shadow-none"
              onClick={placeOrder} 
              disabled={isPlacing || cart.length === 0}
            >
              <div className="absolute left-2 w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                {isPlacing ? <Loader2 size={24} className="animate-spin text-white" /> : <ArrowRight size={24} className="text-white group-hover:translate-x-1 transition-transform" />}
              </div>
              <span className="pl-12">{isPlacing ? 'Placing Order...' : 'Place Order'}</span>
              <div className="absolute right-6 opacity-60 flex gap-0 group-hover:opacity-100 transition-opacity">
                <ChevronDown size={20} className="-rotate-90 text-white" />
                <ChevronDown size={20} className="-rotate-90 -ml-2 text-white" />
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isNoteModalOpen} onOpenChange={setIsNoteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Order Note</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input 
              placeholder="e.g. Allergy to nuts, less ice..."
              value={orderNotes} 
              onChange={(e) => setOrderNotes(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button onClick={() => setIsNoteModalOpen(false)} className="rounded-full font-bold px-8">Save Note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDiscountModalOpen} onOpenChange={setIsDiscountModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Discount</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
            {activeDiscounts.length === 0 ? (
              <p className="text-center text-muted-foreground font-semibold py-4">No active discounts available.</p>
            ) : (
              activeDiscounts.map(d => (
                <Button 
                  key={d.id}
                  variant="outline" 
                  className="h-14 justify-start text-lg font-semibold"
                  onClick={() => {
                    setDiscountType(d.type);
                    setDiscountAmount(d.value);
                    setDiscountView(d.type);
                    setIsDiscountActive(true);
                    setIsDiscountModalOpen(false);
                  }}
                >
                  {d.name} ({d.type === 'percent' ? d.value + '%' : currencySymbol + d.value.toFixed(2)})
                </Button>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDiscountModalOpen(false)} className="rounded-full font-bold px-8">Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
