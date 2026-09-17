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

  // New Account / Edit State
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('cashier');
  const [newPin, setNewPin] = useState('');
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

  const handleEditClick = (u: any) => {
    setEditingUserId(u.id);
    setNewName(u.full_name || '');
    setNewEmail(u.email || '');
    setNewRole(u.role || 'cashier');
    setNewPin(u.pin || '');
    setNewPassword('');
    setCreateMsg({ text: '', type: '' });
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setNewName('');
    setNewEmail('');
    setNewRole('cashier');
    setNewPin('');
    setNewPassword('');
    setCreateMsg({ text: '', type: '' });
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    
    if (!editingUserId) {
      if (!newEmail) return;
      const passwordToUse = newRole === 'cashier' ? newPin : newPassword;
      if (!passwordToUse || passwordToUse.length < 6) {
        setCreateMsg({ text: 'Password or PIN must be at least 6 characters', type: 'error' });
        return;
      }
    }

    setCreating(true);
    setCreateMsg({ text: '', type: '' });

    try {
      if (editingUserId) {
        // Edit Mode
        // 1. Update the profile first
        const passwordToUse = newRole === 'cashier' ? newPin : newPassword;
        const updates: any = {
          full_name: newName,
          role: newRole
        };
        // Update PIN if they provided a new one
        if (newRole === 'cashier' && newPin) {
          updates.pin = newPin;
        }

        const { error: profileError } = await supabase.from('profiles').update(updates).eq('id', editingUserId);
        if (profileError) throw profileError;

        // 2. Call secure RPC to update email/password
        const { error: rpcError } = await supabase.rpc('admin_update_user_credentials', {
          p_user_id: editingUserId,
          p_email: newEmail,
          p_password: passwordToUse || null
        });

        if (rpcError) throw rpcError;

        setCreateMsg({ text: 'Staff details updated successfully!', type: 'success' });
        
        setTimeout(() => {
          fetchUsers();
          handleCancelEdit();
        }, 1500);

      } else {
        // Create Mode
        const passwordToUse = newRole === 'cashier' ? newPin : newPassword;
        const { data, error } = await tempClient.auth.signUp({
          email: newEmail,
          password: passwordToUse,
          options: {
            data: {
              full_name: newName,
              role: newRole,
              pin: newRole === 'cashier' ? newPin : null
            }
          }
        });

        if (error) throw error;
        
        if (data?.user?.id && newRole === 'cashier' && newPin) {
          await supabase.from('profiles').update({ pin: newPin }).eq('id', data.user.id);
        }

        setCreateMsg({ text: 'User created successfully!', type: 'success' });
        handleCancelEdit();
        setTimeout(() => fetchUsers(), 1500);
      }
    } catch (err: any) {
      setCreateMsg({ text: err.message || 'Failed to save user', type: 'error' });
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
              <UserPlus className="text-primary" size={24} /> {editingUserId ? 'Edit Staff' : 'Add New Staff'}
            </CardTitle>
            <CardDescription>{editingUserId ? 'Update staff name and role' : 'Create manager or cashier accounts'}</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSaveUser} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Full Name</label>
                <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Jane Doe" required />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Email</label>
                <Input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="jane@cafe.com" required />
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

              {newRole === 'cashier' ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">
                    6-Digit PIN (Used as Password) {editingUserId && <span className="text-muted-foreground font-normal ml-2">(Leave blank to keep current)</span>}
                  </label>
                  <Input type="text" value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder={editingUserId ? "••••••" : "123456"} minLength={editingUserId ? 0 : 6} maxLength={6} required={!editingUserId} />
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">
                    Password {editingUserId && <span className="text-muted-foreground font-normal ml-2">(Leave blank to keep current)</span>}
                  </label>
                  <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" required={!editingUserId} minLength={editingUserId ? 0 : 6} />
                </div>
              )}
              
              {createMsg.text && (
                <div className={`p-3 rounded-lg text-sm font-semibold ${createMsg.type === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-green-500/10 text-green-600'}`}>
                  {createMsg.text}
                </div>
              )}

              <div className="flex gap-4 pt-2">
                <Button type="submit" disabled={creating} className="flex-1 h-12 rounded-xl font-bold">
                  {creating ? <Loader2 className="animate-spin" /> : editingUserId ? 'Update Account' : 'Create Account'}
                </Button>
                {editingUserId && (
                  <Button type="button" variant="outline" onClick={handleCancelEdit} disabled={creating} className="h-12 rounded-xl font-bold px-6">
                    Cancel
                  </Button>
                )}
              </div>
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
                      <div className="flex items-center gap-3">
                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${u.role === 'admin' ? 'bg-primary/20 text-primary' : u.role === 'manager' ? 'bg-blue-500/20 text-blue-600' : 'bg-muted text-muted-foreground'}`}>
                          {u.role}
                        </div>
                        {u.role !== 'admin' && (
                          <Button variant="ghost" size="sm" onClick={() => handleEditClick(u)} className="h-7 px-3 text-xs font-semibold">
                            Edit
                          </Button>
                        )}
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
