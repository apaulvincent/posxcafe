import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, Calculator, ClipboardList, Coffee, Layers, LayoutDashboard, Loader2, Package, Tag, Grid, Users as UsersIcon, Settings as SettingsIcon } from 'lucide-react';
import React, { useEffect } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { GlobalSearch } from './components/GlobalSearch';
import { Badge } from './components/ui/badge';
import { useAuth } from './hooks/useAuth';
import { useMFA } from './hooks/useMFA';
import { useOrders } from './hooks/useOrders';
import { useSettings, applyThemeColors } from './hooks/useSettings';
import { syncAll } from './lib/sync';
import Categories from './pages/admin/Categories';
import Orders from './pages/admin/Orders';
import Products from './pages/admin/Products';
import CurrencySelector from './pages/admin/CurrencySelector';
import Discounts from './pages/admin/Discounts';
import Tables from './pages/admin/Tables';
import Users from './pages/admin/Users';
import Settings from './pages/admin/Settings';
import { CurrencyProvider } from './contexts/CurrencyContext';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import POS from './pages/POS';
import Profile from './pages/Profile';
import TrackOrder from './pages/TrackOrder';


import { useNotifications } from './hooks/useNotifications';

const Topbar = ({ profile }: { profile: any }) => {
  const { totalOrdersToday, pendingOrdersCount } = useOrders();
  const { notifications, unreadCount, markAsRead, clearOldNotifications } = useNotifications();
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

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

  const d = new Date();
  const dateStr = `${d.toLocaleDateString('en-GB', { weekday: 'long' })}, ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}`;
  return (
    <header className="flex items-center justify-between w-full h-20">
      <div className="flex items-center gap-8">
        <div className="font-extrabold text-primary leading-none text-3xl tracking-tight">
          OLIVE's<br/>
          CAFE
        </div>
        <div className="text-sm font-medium text-primary">
          {dateStr}
        </div>
      </div>
      
      <div className="flex-1 max-w-2xl px-8 flex justify-center">
        <GlobalSearch />
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
          <div className="flex items-center gap-2 bg-card h-[52px] px-6 rounded-full shadow-sm hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer font-bold text-sm">
            Report <LayoutDashboard size={18} />
          </div>
        </Link>

        <DropdownMenu onOpenChange={(open) => { if (open) markAsRead(); }}>
          <DropdownMenuTrigger render={
            <button className="flex items-center justify-center w-[52px] h-[52px] bg-card rounded-full shadow-sm hover:ring-2 hover:ring-primary/20 transition-all relative">
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-3.5 right-3.5 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-card"></span>
              )}
            </button>
          } />
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
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="User" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                {getInitials(profile?.full_name || 'Staff')}
              </div>
            )}
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
               <Link to="/admin/discounts" className={`w-14 h-14 rounded-full flex items-center justify-center shadow-sm transition-all ${location.pathname === '/admin/discounts' ? 'bg-primary text-primary-foreground' : 'bg-card text-primary hover:bg-primary/10'}`}>
                 <Tag size={24} />
               </Link>
               <Link to="/admin/tables" className={`w-14 h-14 rounded-full flex items-center justify-center shadow-sm transition-all ${location.pathname === '/admin/tables' ? 'bg-primary text-primary-foreground' : 'bg-card text-primary hover:bg-primary/10'}`}>
                 <Grid size={24} />
               </Link>
               <Link to="/admin/categories" className={`w-14 h-14 rounded-full flex items-center justify-center shadow-sm transition-all ${location.pathname === '/admin/categories' ? 'bg-primary text-primary-foreground' : 'bg-card text-primary hover:bg-primary/10'}`}>
                 <Layers size={24} />
               </Link>
               <Link to="/admin/currency-selector" className={`w-14 h-14 rounded-full flex items-center justify-center shadow-sm transition-all ${location.pathname === '/admin/currency-selector' ? 'bg-primary text-primary-foreground' : 'bg-card text-primary hover:bg-primary/10'}`}>
                 <Calculator size={24} />
               </Link>
               <Link to="/admin/users" className={`w-14 h-14 rounded-full flex items-center justify-center shadow-sm transition-all ${location.pathname === '/admin/users' ? 'bg-primary text-primary-foreground' : 'bg-card text-primary hover:bg-primary/10'}`}>
                 <UsersIcon size={24} />
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
            <Route path="/admin/discounts" element={<AuthGuard><Discounts /></AuthGuard>} />
            <Route path="/admin/tables" element={<AuthGuard><Tables /></AuthGuard>} />
            <Route path="/admin/categories" element={<AuthGuard><Categories /></AuthGuard>} />
            <Route path="/admin/orders" element={<AuthGuard><Orders /></AuthGuard>} />
            <Route path="/admin/currency-selector" element={<AuthGuard><CurrencySelector /></AuthGuard>} />
            <Route path="/admin/users" element={<AuthGuard><Users /></AuthGuard>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <CurrencyProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </CurrencyProvider>
  )
}

export default App;
