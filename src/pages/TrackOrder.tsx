import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Coffee, CheckCircle2, Clock, Package, ChevronLeft, MapPin, List } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import type { LocalOrder, LocalOrderItem } from '../lib/db';

import { useSettings } from '../hooks/useSettings';

import { useCurrency } from '../contexts/CurrencyContext';
export default function TrackOrder() {
  const { settings } = useSettings();
  const { currencySymbol } = useCurrency();
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<LocalOrder | null>(null);
  const [items, setItems] = useState<LocalOrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchOrder = async () => {
      // Since this is public, we would normally fetch directly from Supabase DB
      // For this implementation, we'll fetch from Supabase
      const { data: orderData } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();
        
      if (orderData) {
        setOrder(orderData);
        
        const { data: itemsData } = await supabase
          .from('order_items')
          .select('*, products(name, image_url)')
          .eq('order_id', id);
          
        if (itemsData) {
          setItems(itemsData);
        }
      }
      setLoading(false);
    };

    fetchOrder();

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`public:orders:id=eq.${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` }, (payload) => {
        setOrder(payload.new as LocalOrder);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col h-screen w-full items-center justify-center bg-background p-6 text-center">
        <Coffee className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
        <h1 className="text-2xl font-bold mb-2">Order Not Found</h1>
        <p className="text-muted-foreground mb-6">We couldn't find an order with this tracking ID.</p>
        <Link to="/">
          <Button className="rounded-full">Return Home</Button>
        </Link>
      </div>
    );
  }

  const steps = [
    { id: 'pending', label: 'Order Placed', icon: Clock },
    { id: 'preparing', label: 'Preparing', icon: Coffee },
    { id: 'ready', label: 'Ready for Pickup', icon: Package },
    { id: 'completed', label: 'Completed', icon: CheckCircle2 }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === order.status);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col max-w-md mx-auto relative overflow-hidden">
      {/* Header */}
      <header className="p-6 pb-4 flex items-center justify-between z-10">
        <Link to="/">
          <Button variant="ghost" size="icon" className="rounded-full bg-card hover:bg-card/80 shadow-sm border border-border">
            <ChevronLeft size={20} />
          </Button>
        </Link>
        <div className="font-extrabold text-primary leading-none text-right text-2xl tracking-tighter">
          {settings.brandName || 'POSX'}
        </div>
      </header>

      <main className="flex-1 px-6 pb-12 flex flex-col gap-6 z-10">
        <div className="text-center mt-2 mb-2">
          <Badge variant="outline" className="mb-3 border-primary/20 bg-primary/5 text-primary">
            Order #{order.id.split('-')[0].toUpperCase()}
          </Badge>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Track Your Order</h1>
          <p className="text-muted-foreground font-medium">Estimated wait time: 5-10 mins</p>
        </div>

        {/* Status Tracker */}
        <Card className="rounded-3xl border-none shadow-md overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent"></div>
          <div className="p-6 flex flex-col gap-6">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isPast = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              
              let colorClass = "text-muted-foreground bg-muted/50 border-transparent";
              let lineClass = "bg-muted";
              
              if (isPast) {
                colorClass = "text-primary bg-primary/10 border-primary/20";
                lineClass = "bg-primary/30";
              } else if (isCurrent) {
                if (step.id === 'ready') colorClass = "text-white bg-accent border-accent shadow-md shadow-accent/20 animate-pulse";
                else colorClass = "text-white bg-primary border-primary shadow-md shadow-primary/20";
                lineClass = "bg-muted";
              }

              return (
                <div key={step.id} className="relative flex items-center gap-4">
                  {index < steps.length - 1 && (
                    <div className={`absolute left-6 top-10 w-0.5 h-8 -ml-px ${lineClass}`}></div>
                  )}
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 shrink-0 z-10 transition-all duration-300 ${colorClass}`}>
                    <Icon size={20} strokeWidth={isCurrent ? 2.5 : 2} />
                  </div>
                  <div>
                    <h3 className={`font-bold ${isCurrent ? 'text-lg' : 'text-base opacity-80'}`}>{step.label}</h3>
                    {isCurrent && (
                      <p className="text-sm font-semibold text-muted-foreground mt-0.5">
                        {step.id === 'ready' ? 'Come grab your order!' : 'We are working on it.'}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Order Details */}
        <div className="mt-2">
          <h3 className="font-extrabold text-lg mb-4 flex items-center gap-2">
            <List size={20} className="text-primary" /> Order Details
          </h3>
          <Card className="rounded-3xl border-none shadow-sm overflow-hidden p-1 bg-card/50">
            <div className="bg-card rounded-2xl p-5">
              <div className="flex flex-col gap-4 mb-6">
                {items.length > 0 ? items.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center p-1.5">
                        {item.products?.image_url ? (
                          <img src={item.products.image_url} alt={item.products.name} className="w-full h-full object-contain mix-blend-multiply" />
                        ) : <Coffee size={16} className="text-muted-foreground opacity-50" />}
                      </div>
                      <div>
                        <span className="font-bold text-sm block">{item.products?.name || 'Product'}</span>
                        <span className="text-xs font-semibold text-muted-foreground">Qty: {item.quantity}</span>
                      </div>
                    </div>
                    <span className="font-bold text-sm">{currencySymbol}{(item.unit_price * item.quantity).toFixed(2)}</span>
                  </div>
                )) : (
                  <div className="text-sm font-semibold text-muted-foreground">Local fallback items not displayed.</div>
                )}
              </div>
              
              <div className="border-t border-dashed border-border pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-muted-foreground">Subtotal</span>
                  <span className="font-bold">{currencySymbol}{order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-muted-foreground">Tax</span>
                  <span className="font-bold">{currencySymbol}{order.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-end mt-2 pt-2 border-t border-border">
                  <span className="font-extrabold">Total</span>
                  <span className="font-extrabold text-xl text-primary">{currencySymbol}{order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
        
        {/* Collection Info */}
        <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
             <MapPin size={18} />
          </div>
          <div>
            <h4 className="font-bold text-sm">Collection Point</h4>
            <p className="text-xs font-semibold text-muted-foreground mt-0.5">Please head to the pickup counter when your order is ready.</p>
          </div>
        </div>
      </main>

      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-accent/5 rounded-full blur-3xl -z-10"></div>
    </div>
  );
}
