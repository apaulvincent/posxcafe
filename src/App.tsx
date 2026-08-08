import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, Coffee, Search, Bell, Loader2, Package, Layers, ClipboardList } from 'lucide-react';
import { useAuth } from './hooks/useAuth';
import { useMFA } from './hooks/useMFA';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Products from './pages/admin/Products';
import Categories from './pages/admin/Categories';
import Orders from './pages/admin/Orders';
import TrackOrder from './pages/TrackOrder';
import { useOrders } from './hooks/useOrders';
import { syncAll } from './lib/sync';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Badge } from './components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";

import { useNotifications } from './hooks/useNotifications';

const Topbar = ({ profile }: { profile: any }) => {
  const { totalOrdersToday, pendingOrdersCount } = useOrders();
  const { notifications, unreadCount, markAsRead, clearOldNotifications } = useNotifications();
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  React.useEffect(() => {
    clearOldNotifications();
  }, []);

  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncAll();
    };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    if (navigator.onLine) syncAll();
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const dateStr = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <header className="flex items-center justify-between w-full h-20">
      <div className="flex items-center gap-8">
        <div className="font-extrabold text-primary leading-none text-xl tracking-tight">
          OLIVE<br/>
          GROUNDS<br/>
          COFFEE
        </div>
        <div className="text-sm font-medium text-primary">
          {dateStr}
        </div>
      </div>
      
      <div className="flex-1 max-w-2xl px-8">
        <div className="relative flex items-center">
          <Search className="absolute left-4 text-muted-foreground" size={20} />
          <Input 
            className="w-full pl-12 h-12 rounded-full bg-card border-none shadow-sm text-base placeholder:text-muted-foreground" 
            placeholder="Search" 
          />
          <div className="absolute right-4 text-sm font-medium text-primary">⌘K</div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4 text-sm font-semibold text-primary">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-primary' : 'bg-destructive'}`}></span>
            {isOnline ? 'Online' : 'Offline'}
          </div>
          <span className="flex items-center gap-2 border-l border-border pl-4">
            Total Orders: {totalOrdersToday}
          </span>
          <span className="flex items-center gap-2 border-l border-border pl-4 text-amber-600 dark:text-amber-500">
            Pending: {pendingOrdersCount}
          </span>
        </div>
        
        <Link to="/dashboard">
          <Button variant="outline" className="rounded-full h-12 px-6 shadow-sm gap-2 font-semibold">
            Report <LayoutDashboard size={18} />
          </Button>
        </Link>

        <DropdownMenu onOpenChange={(open) => { if (open) markAsRead(); }}>
          <DropdownMenuTrigger render={
            <Button variant="outline" size="icon" className="rounded-full w-12 h-12 shadow-sm relative" />
          }>
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-destructive rounded-full"></span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-4 max-h-[80vh] overflow-y-auto">
            <DropdownMenuGroup>
              <div className="flex justify-between items-center mb-2">
                <DropdownMenuLabel className="font-bold text-base px-0 py-0">Notifications</DropdownMenuLabel>
                {unreadCount > 0 && <Badge variant="secondary" className="text-xs">{unreadCount} New</Badge>}
              </div>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm font-semibold">No notifications</div>
              ) : (
                notifications.map(notif => (
                  <DropdownMenuItem key={notif.id} className="py-3 flex flex-col items-start gap-1 cursor-default focus:bg-primary/10 focus:text-foreground">
                    <span className={`font-bold ${notif.type === 'stock' ? 'text-accent' : 'text-primary'}`}>{notif.title}</span>
                    <span className="text-muted-foreground text-sm whitespace-pre-wrap">{notif.message}</span>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <Link to="/profile">
          <div className="flex items-center gap-3 bg-card p-1.5 pr-4 rounded-full shadow-sm hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer">
            <img src={profile?.avatar_url || "https://i.pravatar.cc/150?u=a042581f4e29026704d"} alt="User" className="w-10 h-10 rounded-full object-cover" />
            <div className="flex flex-col">
              <span className="text-sm font-bold leading-tight">{profile?.full_name || 'Staff'}</span>
              <span className="text-xs text-muted-foreground capitalize">{profile?.role || 'cashier'}</span>
            </div>
          </div>
        </Link>
      </div>
    </header>
  );
};

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, loading: authLoading } = useAuth();
  const { isAAL2, hasMFA, loading: mfaLoading } = useMFA();

  if (authLoading || mfaLoading) {
    return <div className="flex h-screen w-screen items-center justify-center"><Loader2 className="animate-spin text-primary" size={48} /></div>;
  }

  if (!session || (!isAAL2 && hasMFA) || (!hasMFA && session)) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppLayout() {
  const location = useLocation();
  const { profile } = useAuth();
  
  if (location.pathname === '/login') {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    );
  }

  if (location.pathname.startsWith('/track/')) {
    return (
      <Routes>
        <Route path="/track/:id" element={<TrackOrder />} />
      </Routes>
    );
  }

  return (
    <div className="flex flex-col h-screen p-6 gap-6 overflow-hidden bg-background">
      <Topbar profile={profile} />
      
      <div className="flex flex-1 gap-6 min-h-0">
        <div className="flex flex-col gap-4 w-16 shrink-0">
           <Link to="/" className={`w-14 h-14 rounded-full flex items-center justify-center shadow-sm transition-all ${location.pathname === '/' ? 'bg-primary text-primary-foreground' : 'bg-card text-primary hover:bg-primary/10'}`}>
             <Coffee size={24} />
           </Link>
           <Link to="/dashboard" className={`w-14 h-14 rounded-full flex items-center justify-center shadow-sm transition-all ${location.pathname === '/dashboard' ? 'bg-primary text-primary-foreground' : 'bg-card text-primary hover:bg-primary/10'}`}>
             <LayoutDashboard size={24} />
           </Link>
           {(profile as any)?.role === 'manager' || profile?.role === 'admin' ? (
             <>
               <div className="w-10 h-px bg-border mx-auto my-2"></div>
               <Link to="/admin/orders" className={`w-14 h-14 rounded-full flex items-center justify-center shadow-sm transition-all ${location.pathname === '/admin/orders' ? 'bg-primary text-primary-foreground' : 'bg-card text-primary hover:bg-primary/10'}`}>
                 <ClipboardList size={24} />
               </Link>
               <Link to="/admin/products" className={`w-14 h-14 rounded-full flex items-center justify-center shadow-sm transition-all ${location.pathname === '/admin/products' ? 'bg-primary text-primary-foreground' : 'bg-card text-primary hover:bg-primary/10'}`}>
                 <Package size={24} />
               </Link>
               <Link to="/admin/categories" className={`w-14 h-14 rounded-full flex items-center justify-center shadow-sm transition-all ${location.pathname === '/admin/categories' ? 'bg-primary text-primary-foreground' : 'bg-card text-primary hover:bg-primary/10'}`}>
                 <Layers size={24} />
               </Link>
             </>
           ) : null}
        </div>

        <div className="flex-1 min-w-0 overflow-hidden flex">
          <Routes>
            <Route path="/" element={<AuthGuard><POS /></AuthGuard>} />
            <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
            <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
            <Route path="/admin/products" element={<AuthGuard><Products /></AuthGuard>} />
            <Route path="/admin/categories" element={<AuthGuard><Categories /></AuthGuard>} />
            <Route path="/admin/orders" element={<AuthGuard><Orders /></AuthGuard>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}

export default App;
