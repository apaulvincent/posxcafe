import React, { useRef, useState } from 'react';
import { LogOut, User as UserIcon, Mail, Shield, Camera, Loader2, KeyRound } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '../components/ui/dialog';
import imageCompression from 'browser-image-compression';
import { supabase, getStoragePathFromUrl } from '../lib/supabase';
import { ImageCropperModal } from '../components/ImageCropperModal';

function ChangePasswordDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setNewPassword('');
        setConfirmPassword('');
        onClose();
      }, 2000);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>
            Enter a new password for your account.
          </DialogDescription>
        </DialogHeader>
        
        {success ? (
          <div className="p-4 bg-green-500/10 text-green-600 rounded-xl font-medium text-center">
            Password updated successfully!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-xl font-medium">
                {error}
              </div>
            )}
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-muted-foreground">New Password</label>
              <Input 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-muted-foreground">Confirm Password</label>
              <Input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="animate-spin mr-2" size={16} />}
                Update Password
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function Profile() {
  const { profile, updateProfile, signOut } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [currentFileExt, setCurrentFileExt] = useState<string>('jpg');
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

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
    <div className="flex-1 flex justify-center items-center p-8 animate-in fade-in duration-300">
      <Card className="w-full max-w-[400px] border-none shadow-lg rounded-3xl p-8 flex flex-col items-center">
        
        <div className="relative mb-6 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          {profile?.avatar_url ? (
            <img 
              src={profile.avatar_url} 
              alt="Avatar" 
              className="w-28 h-28 rounded-full object-cover border-4 border-primary shadow-md"
            />
          ) : (
            <div className="w-28 h-28 rounded-full bg-primary/10 text-primary border-4 border-primary flex items-center justify-center shadow-md text-3xl font-extrabold">
              {profile?.full_name ? getInitials(profile.full_name) : 'U'}
            </div>
          )}
          
          <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            {isUploading ? <Loader2 className="animate-spin text-white" size={24} /> : <Camera className="text-white" size={24} />}
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="image/*" 
            className="hidden" 
          />
        </div>

        <h2 className="text-2xl font-extrabold mb-2">{profile?.full_name || 'Staff User'}</h2>
        
        <div className="flex flex-col gap-4 w-full mt-6">
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-2xl">
            <UserIcon size={24} className="text-muted-foreground" />
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
          variant="outline" 
          className="w-full h-14 mt-10 rounded-2xl font-bold text-base gap-2 shadow-none"
          onClick={() => setPasswordDialogOpen(true)}
        >
          <KeyRound size={20} /> Change Password
        </Button>

        <Button 
          variant="destructive" 
          className="w-full h-14 mt-4 rounded-2xl font-bold text-base gap-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-colors shadow-none"
          onClick={signOut}
        >
          <LogOut size={20} /> Logout
        </Button>
      </Card>

      <ChangePasswordDialog 
        isOpen={passwordDialogOpen} 
        onClose={() => setPasswordDialogOpen(false)} 
      />

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
