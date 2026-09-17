import React, { useRef, useState } from 'react';
import { LogOut, User as UserIcon, Camera, Loader2, KeyRound } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

import imageCompression from 'browser-image-compression';
import { supabase, getStoragePathFromUrl } from '../lib/supabase';
import { ImageCropperModal } from '../components/ImageCropperModal';



export default function Profile() {
  const { profile, updateProfile, signOut } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [currentFileExt, setCurrentFileExt] = useState<string>('jpg');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);
  const [passMsg, setPassMsg] = useState({ text: '', type: '' });

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setPassMsg({ text: 'Passwords do not match', type: 'error' });
      return;
    }
    
    if (!newPassword || newPassword.length < 6) {
      setPassMsg({ text: 'Password must be at least 6 characters', type: 'error' });
      return;
    }
    
    setChangingPass(true);
    setPassMsg({ text: '', type: '' });

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      setPassMsg({ text: 'Password updated successfully!', type: 'success' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPassMsg({ text: err.message || 'Failed to update password', type: 'error' });
    } finally {
      setChangingPass(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    const ext = file.name.split('.').pop() || 'jpg';
    setCurrentFileExt(ext);

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setCropImageSrc(reader.result?.toString() || null);
      setCropperOpen(true);
    });
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCropComplete = async (croppedFile: File) => {
    if (!profile) return;
    setIsUploading(true);
    try {
      const fileName = `${profile.id}-${Date.now()}.${currentFileExt}`;
      const filePath = `profiles/${fileName}`;

      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 500,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(croppedFile, options);

      const { error } = await supabase.storage.from('images').upload(filePath, compressedFile);
      
      if (error) {
        console.error("Upload error:", error);
      } else {
        // Delete old avatar if it exists in our storage
        if (profile.avatar_url) {
          const oldPath = getStoragePathFromUrl(profile.avatar_url);
          if (oldPath) {
            supabase.storage.from('images').remove([oldPath]).catch(console.error);
          }
        }

        const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(filePath);
        await updateProfile({ avatar_url: publicUrl });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto pr-4 pb-8 space-y-6 animate-in fade-in duration-300 w-full">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight">My Profile</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-8">
        {/* Left Column: Avatar & Summary */}
        <Card className="col-span-1 border-none shadow-sm rounded-3xl p-8 flex flex-col items-center bg-card h-fit">
          <div className="relative mb-6 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            {profile?.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt="Avatar" 
                className="w-32 h-32 rounded-full object-cover border-4 border-primary shadow-md"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-primary/10 text-primary border-4 border-primary flex items-center justify-center shadow-md text-4xl font-extrabold">
                {profile?.full_name ? getInitials(profile.full_name) : 'U'}
              </div>
            )}
            
            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              {isUploading ? <Loader2 className="animate-spin text-white" size={28} /> : <Camera className="text-white" size={28} />}
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept="image/*" 
              className="hidden" 
            />
          </div>

          <h2 className="text-2xl font-extrabold mb-1">{profile?.full_name || 'Staff User'}</h2>
          <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-8">{profile?.role || 'Cashier'}</div>

          <Button 
            variant="destructive" 
            className="w-full h-12 rounded-xl font-bold gap-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-colors shadow-none"
            onClick={signOut}
          >
            <LogOut size={18} /> Logout
          </Button>
        </Card>

        {/* Right Column: Detailed Info & Password */}
        <div className="flex flex-col gap-8">
          
          <Card className="w-full border-none shadow-sm rounded-3xl overflow-hidden bg-card">
            <div className="bg-muted/30 border-b border-border/50 p-6">
              <h3 className="text-xl font-bold flex items-center gap-2"><UserIcon className="text-primary" size={24} /> Profile Information</h3>
            </div>
            <div className="p-6 flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Full Name</span>
                  <div className="font-semibold text-lg">{profile?.full_name || 'Staff User'}</div>
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Address</span>
                  <div className="font-semibold text-lg">{profile?.email || 'N/A'}</div>
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Role</span>
                  <div className="font-semibold text-lg capitalize">{profile?.role || 'Cashier'}</div>
                </div>
              </div>
            </div>
          </Card>

          {profile?.role !== 'cashier' && (
            <Card className="w-full border-none shadow-sm rounded-3xl overflow-hidden bg-card">
              <div className="bg-muted/30 border-b border-border/50 p-6">
                <div className="flex items-center gap-2 mb-1">
                  <KeyRound className="text-primary" size={24} />
                  <h3 className="text-xl font-bold">Change My Password</h3>
                </div>
                <p className="text-sm text-muted-foreground">Update your own account password</p>
              </div>
              <div className="p-6 max-w-md">
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">New Password</label>
                    <Input 
                      type="password" 
                      value={newPassword} 
                      onChange={e => setNewPassword(e.target.value)} 
                      placeholder="••••••••" 
                      required 
                      minLength={6} 
                      className="h-12 bg-muted/50 border-none rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Confirm Password</label>
                    <Input 
                      type="password" 
                      value={confirmPassword} 
                      onChange={e => setConfirmPassword(e.target.value)} 
                      placeholder="••••••••" 
                      required 
                      minLength={6} 
                      className="h-12 bg-muted/50 border-none rounded-xl"
                    />
                  </div>
                  
                  {passMsg.text && (
                    <div className={`p-3 rounded-xl text-sm font-semibold ${passMsg.type === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-green-500/10 text-green-600'}`}>
                      {passMsg.text}
                    </div>
                  )}

                  <Button type="submit" disabled={changingPass} variant="secondary" className="w-full h-12 rounded-xl font-bold bg-muted/80 hover:bg-muted text-foreground">
                    {changingPass ? <Loader2 className="animate-spin" /> : 'Update Password'}
                  </Button>
                </form>
              </div>
            </Card>
          )}
        </div>
      </div>

      {cropImageSrc && (
        <ImageCropperModal
          isOpen={cropperOpen}
          onClose={() => setCropperOpen(false)}
          imageSrc={cropImageSrc}
          onCropComplete={handleCropComplete}
          aspectRatio={1}
        />
      )}
    </div>
  );
}
