import { LogOut, User, Mail, Shield } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';

export default function Profile() {
  const { profile, signOut } = useAuth();

  return (
    <div className="flex-1 flex justify-center items-center p-8 animate-in fade-in duration-300">
      <Card className="w-full max-w-[400px] border-none shadow-lg rounded-3xl p-8 flex flex-col items-center">
        <img 
          src={profile?.avatar_url || "https://i.pravatar.cc/150?u=a042581f4e29026704d"} 
          alt="Avatar" 
          className="w-28 h-28 rounded-full mb-6 object-cover border-4 border-primary shadow-md"
        />
        <h2 className="text-2xl font-extrabold mb-2">{profile?.full_name || 'Staff User'}</h2>
        
        <div className="flex flex-col gap-4 w-full mt-6">
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-2xl">
            <User size={24} className="text-muted-foreground" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Name</span>
              <span className="font-bold text-foreground">{profile?.full_name || 'Staff User'}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-2xl">
            <Mail size={24} className="text-muted-foreground" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email</span>
              <span className="font-bold text-foreground">{profile?.email || 'N/A'}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-2xl border border-primary/10">
            <Shield size={24} className="text-primary" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Role</span>
              <span className="font-bold text-primary capitalize">{profile?.role || 'Cashier'}</span>
            </div>
          </div>
        </div>

        <Button 
          variant="destructive" 
          className="w-full h-14 mt-10 rounded-2xl font-bold text-base gap-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-colors shadow-none"
          onClick={signOut}
        >
          <LogOut size={20} /> Logout
        </Button>
      </Card>
    </div>
  );
}
