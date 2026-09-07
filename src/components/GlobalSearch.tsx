import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Command, ShoppingBag, Receipt, LayoutDashboard, Settings, Coffee } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { Input } from './ui/input';

import { useCurrency } from '../contexts/CurrencyContext';
type SearchResult = {
  id: string;
  title: string;
  subtitle?: string;
  type: 'navigation' | 'product' | 'order';
  url: string;
  icon: React.ReactNode;
};

const NAVIGATION_ITEMS: SearchResult[] = [
  { id: 'nav-dashboard', title: 'Dashboard', subtitle: 'View sales and statistics', type: 'navigation', url: '/dashboard', icon: <LayoutDashboard size={18} /> },
  { id: 'nav-pos', title: 'Point of Sale (POS)', subtitle: 'Create new orders', type: 'navigation', url: '/', icon: <ShoppingBag size={18} /> },
  { id: 'nav-products', title: 'Products Admin', subtitle: 'Manage menu items', type: 'navigation', url: '/admin/products', icon: <Coffee size={18} /> },
  { id: 'nav-orders', title: 'Orders Admin', subtitle: 'View all transactions', type: 'navigation', url: '/admin/orders', icon: <Receipt size={18} /> },
  { id: 'nav-settings', title: 'Settings', subtitle: 'System preferences', type: 'navigation', url: '/admin/settings', icon: <Settings size={18} /> },
];

export function GlobalSearch() {
  const { currencySymbol } = useCurrency();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const rawProducts = useLiveQuery(() => db.products.toArray(), []) || [];
  const products = rawProducts.filter(p => !p.is_archived);
  const orders = useLiveQuery(() => db.orders.orderBy('created_at').reverse().limit(50).toArray(), []) || [];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) && inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const results: SearchResult[] = React.useMemo(() => {
    if (!query.trim()) return [];
    
    const searchLower = query.toLowerCase();
    
    const navResults = NAVIGATION_ITEMS.filter(n => n.title.toLowerCase().includes(searchLower) || n.subtitle?.toLowerCase().includes(searchLower));
    
    const productResults: SearchResult[] = products
      .filter(p => p.name.toLowerCase().includes(searchLower))
      .slice(0, 5)
      .map(p => ({
        id: `prod-${p.id}`,
        title: p.name,
        subtitle: `${currencySymbol}${Number(p.price).toFixed(2)}`,
        type: 'product',
        url: '/admin/products',
        icon: <Coffee size={18} />
      }));
      
    const orderResults: SearchResult[] = orders
      .filter(o => o.id.toLowerCase().includes(searchLower) || (o.customer_name && o.customer_name.toLowerCase().includes(searchLower)))
      .slice(0, 5)
      .map(o => ({
        id: `ord-${o.id}`,
        title: `Order #${o.id.substring(0,5).toUpperCase()}`,
        subtitle: o.customer_name || 'Guest',
        type: 'order',
        url: '/admin/orders',
        icon: <Receipt size={18} />
      }));

    return [...navResults, ...productResults, ...orderResults];
  }, [query, products, orders]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen && query) setIsOpen(true);
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleSelect = (item: SearchResult) => {
    setIsOpen(false);
    setQuery('');
    navigate(item.url);
  };

  return (
    <div className="relative flex items-center w-full">
      <Search className="absolute left-4 text-muted-foreground z-10" size={20} />
      <Input 
        ref={inputRef}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => query && setIsOpen(true)}
        onKeyDown={handleKeyDown}
        className="w-full pl-12 pr-16 h-12 rounded-full bg-card border-none shadow-sm text-base placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/20" 
        placeholder="Search for orders, products, or shortcuts..." 
      />
      <div className="absolute right-4 text-muted-foreground flex items-center gap-1 z-10 pointer-events-none">
        <kbd className="hidden sm:inline-flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-[10px] font-bold text-muted-foreground border border-border/50">
          <Command size={10} /> K
        </kbd>
      </div>
      
      {isOpen && results.length > 0 && (
        <div ref={dropdownRef} className="absolute top-full mt-2 left-0 w-full bg-card rounded-2xl shadow-xl border border-border overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
          <div className="max-h-[60vh] overflow-y-auto p-2 hide-scrollbar">
            {results.map((item, index) => (
              <div 
                key={item.id}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${selectedIndex === index ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'}`}
              >
                <div className={`p-2 rounded-lg ${selectedIndex === index ? 'bg-primary/20' : 'bg-muted text-muted-foreground'}`}>
                  {item.icon}
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm font-bold truncate">{item.title}</span>
                  {item.subtitle && <span className="text-xs text-muted-foreground truncate opacity-80">{item.subtitle}</span>}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-wider opacity-60 px-2 bg-background rounded-full py-0.5">
                  {item.type}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {isOpen && query && results.length === 0 && (
        <div ref={dropdownRef} className="absolute top-full mt-2 left-0 w-full bg-card rounded-2xl shadow-xl border border-border p-8 text-center z-50 animate-in fade-in slide-in-from-top-2">
          <Search className="mx-auto mb-3 text-muted-foreground opacity-50" size={32} />
          <p className="text-muted-foreground font-semibold">No results found for "{query}"</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Try searching for products, customers, or pages.</p>
        </div>
      )}
    </div>
  );
}
