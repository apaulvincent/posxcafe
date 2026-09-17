import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useAuth } from '../../hooks/useAuth';
import { Loader2, KeyRound, UserPlus, Users as UsersIcon } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const tempClient = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  { auth: { persistSession: false, autoRefreshToken: false } }
);

export default function Users() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Account State
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('cashier');
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState({ text: '', type: '' });

  // Change Password State
  const [newPass, setNewPass] = useState('');
  const [changingPass, setChangingPass] = useState(false);
  const [passMsg, setPassMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        setUsers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword || !newName) return;
    setCreating(true);
    setCreateMsg({ text: '', type: '' });

    try {
      const { error } = await tempClient.auth.signUp({
        email: newEmail,
        password: newPassword,
        options: {
          data: {
            full_name: newName,
            role: newRole
          }
        }
      });

      if (error) throw error;
      setCreateMsg({ text: 'User created successfully!', type: 'success' });
      setNewEmail('');
      setNewPassword('');
      setNewName('');
      setTimeout(() => fetchUsers(), 1500);
    } catch (err: any) {
      setCreateMsg({ text: err.message || 'Failed to create user', type: 'error' });
    } finally {
      setCreating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPass) return;
    setChangingPass(true);
    setPassMsg({ text: '', type: '' });

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPass
      });

      if (error) throw error;
      setPassMsg({ text: 'Password updated successfully!', type: 'success' });
      setNewPass('');
    } catch (err: any) {
      setPassMsg({ text: err.message || 'Failed to update password', type: 'error' });
    } finally {
      setChangingPass(false);
    }
  };

  if (profile?.role !== 'admin' && profile?.role !== 'manager') {
    return <div className="p-8">Access Denied</div>;
  }

  return (
    <div className="flex-1 flex flex-col p-8 gap-8 animate-in fade-in duration-300 overflow-y-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Staff & Accounts</h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Create Account Section */}
        <Card className="border-none shadow-sm bg-card rounded-3xl overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border/50 pb-6">
            <CardTitle className="flex items-center gap-2 text-xl">
              <UserPlus className="text-primary" size={24} /> Add New Staff
            </CardTitle>
            <CardDescription>Create manager or cashier accounts</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Full Name</label>
                <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Jane Doe" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Email</label>
                <Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="jane@cafe.com" required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Password</label>
                <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Role</label>
                <Select value={newRole} onValueChange={(val) => setNewRole(val || '')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cashier">Cashier</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {createMsg.text && (
                <div className={`p-3 rounded-lg text-sm font-semibold ${createMsg.type === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-green-500/10 text-green-600'}`}>
                  {createMsg.text}
                </div>
              )}

              <Button type="submit" disabled={creating} className="w-full h-12 rounded-xl font-bold">
                {creating ? <Loader2 className="animate-spin" /> : 'Create Account'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-8">
          {/* Change My Password */}
          <Card className="border-none shadow-sm bg-card rounded-3xl overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/50 pb-6">
              <CardTitle className="flex items-center gap-2 text-xl">
                <KeyRound className="text-primary" size={24} /> Change My Password
              </CardTitle>
              <CardDescription>Update your own account password</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">New Password</label>
                  <Input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="••••••••" required minLength={6} />
                </div>
                
                {passMsg.text && (
                  <div className={`p-3 rounded-lg text-sm font-semibold ${passMsg.type === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-green-500/10 text-green-600'}`}>
                    {passMsg.text}
                  </div>
                )}

                <Button type="submit" disabled={changingPass} variant="secondary" className="w-full h-12 rounded-xl font-bold">
                  {changingPass ? <Loader2 className="animate-spin" /> : 'Update Password'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* List Users */}
          <Card className="border-none shadow-sm bg-card rounded-3xl overflow-hidden flex-1">
            <CardHeader className="bg-muted/30 border-b border-border/50 pb-6">
              <CardTitle className="flex items-center gap-2 text-xl">
                <UsersIcon className="text-primary" size={24} /> Existing Accounts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>
              ) : (
                <div className="divide-y divide-border/50 max-h-[300px] overflow-y-auto">
                  {users.map(u => (
                    <div key={u.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground">{u.full_name}</span>
                        <span className="text-sm text-muted-foreground">{u.email}</span>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${u.role === 'admin' ? 'bg-primary/20 text-primary' : u.role === 'manager' ? 'bg-blue-500/20 text-blue-600' : 'bg-muted text-muted-foreground'}`}>
                        {u.role}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
