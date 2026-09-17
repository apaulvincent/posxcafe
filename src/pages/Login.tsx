import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { useMFA } from '../hooks/useMFA';
import { Loader2, Lock, Mail } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const { hasMFA, isAAL2, loading: mfaLoading, qrCode, enrollMFA, verifyEnrollment, verifyLoginChallenge, error: mfaError, checkMFAStatus } = useMFA();

  // Determine state
  const needsLogin = !session;
  const needsMFAEnrollment = session && !hasMFA;
  const needsMFAChallenge = session && hasMFA && !isAAL2;
  const isAuthenticatedAndVerified = session && (isAAL2 || !hasMFA);

  const hasAttemptedEnroll = React.useRef(false);

  // Redirect if fully authenticated
  React.useEffect(() => {
    if (authLoading || mfaLoading) return;
    
    if (isAuthenticatedAndVerified && hasMFA && isAAL2) {
      navigate('/');
    } else if (session && !hasMFA && !hasAttemptedEnroll.current) {
      // Force user to enroll if they haven't
      if (!qrCode && !mfaLoading) {
        hasAttemptedEnroll.current = true;
        enrollMFA();
      }
    }
  }, [isAuthenticatedAndVerified, hasMFA, isAAL2, session, navigate, qrCode, mfaLoading, enrollMFA]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLocalError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      // We must re-check MFA status now that we have a session!
      await checkMFAStatus();
    } catch (err: any) {
      setLocalError(err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handlePinLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 6) return;
    setIsLoggingIn(true);
    setLocalError(null);
    try {
      const { data: emailData, error: rpcError } = await supabase.rpc('get_email_by_pin', { p_pin: pin });
      if (rpcError || !emailData) {
        throw new Error('Invalid PIN or cashier not found.');
      }
      const { error } = await supabase.auth.signInWithPassword({ email: emailData, password: pin });
      if (error) throw error;
      await checkMFAStatus();
    } catch (err: any) {
      setLocalError(err.message);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleVerifyChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await verifyLoginChallenge(mfaCode);
    if (success) {
      navigate('/');
    }
  };

  const handleVerifyEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await verifyEnrollment(mfaCode);
    if (success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg border-none">
        <CardHeader className="text-center space-y-2 pb-6">
          <CardTitle className="text-2xl font-extrabold text-primary tracking-tight">
            OLIVE GROUNDS COFFEE
          </CardTitle>
          <CardDescription>Staff Portal</CardDescription>
        </CardHeader>
        <CardContent>
          {(localError || mfaError) && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-lg mb-6 text-sm font-medium text-center">
              {localError || mfaError}
            </div>
          )}

          {(authLoading || mfaLoading) ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : (
            <>
              {needsLogin && (
                <Tabs defaultValue="cashier" className="w-full">
                  <TabsList className="flex w-full mb-8 h-12 bg-muted/50 rounded-xl p-1">
                    <TabsTrigger value="cashier" className="flex-1 h-full rounded-lg text-base">Cashier</TabsTrigger>
                    <TabsTrigger value="admin" className="flex-1 h-full rounded-lg text-base">Manager</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="cashier" className="animate-in fade-in duration-300">
                    <form onSubmit={handlePinLogin} className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-muted-foreground block text-center">Enter your 6-Digit PIN</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                          <Input 
                            type="password" 
                            maxLength={6}
                            value={pin} 
                            onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                            className="pl-10 h-14 text-center tracking-[0.5rem] text-xl" 
                            required 
                            autoFocus
                          />
                        </div>
                      </div>

                      <Button type="submit" disabled={isLoggingIn} className="w-full h-12 text-base font-bold mt-2">
                        {isLoggingIn ? <Loader2 className="animate-spin mr-2" /> : 'Log In'}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="admin" className="animate-in fade-in duration-300">
                    <form onSubmit={handleLogin} className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-muted-foreground">Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                          <Input 
                            type="email" 
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                            className="pl-10 h-12" 
                            required 
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-muted-foreground">Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                          <Input 
                            type="password" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            className="pl-10 h-12" 
                            required 
                          />
                        </div>
                      </div>

                      <Button type="submit" disabled={isLoggingIn} className="w-full h-12 text-base font-bold mt-2">
                        {isLoggingIn ? <Loader2 className="animate-spin mr-2" /> : 'Log In'}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              )}

              {needsMFAEnrollment && (
                <form onSubmit={handleVerifyEnrollment} className="space-y-6 flex flex-col items-center">
                  <div className="text-center space-y-1">
                    <h3 className="font-bold text-lg">Setup 2FA</h3>
                    <p className="text-sm text-muted-foreground max-w-[280px]">Scan this QR code with your Authenticator app (like Google Authenticator or Authy).</p>
                  </div>
                  
                  {qrCode ? (
                    <div className="p-4 bg-muted rounded-xl flex justify-center items-center">
                       <img src={qrCode} alt="QR Code for 2FA" className="w-48 h-48 rounded-md" />
                    </div>
                  ) : (
                    <Loader2 className="animate-spin text-primary my-8" size={32} />
                  )}

                  <div className="space-y-2 w-full">
                    <label className="text-sm font-semibold text-muted-foreground block text-center">Enter the 6-digit code</label>
                    <Input 
                      type="text" 
                      maxLength={6}
                      value={mfaCode} 
                      onChange={e => setMfaCode(e.target.value)} 
                      className="text-center tracking-[0.5rem] text-xl h-14" 
                      required 
                    />
                  </div>

                  <Button type="submit" disabled={mfaLoading} className="w-full h-12 text-base font-bold">
                    {mfaLoading ? <Loader2 className="animate-spin mr-2" /> : 'Verify & Continue'}
                  </Button>
                </form>
              )}

              {needsMFAChallenge && (
                <form onSubmit={handleVerifyChallenge} className="space-y-6 flex flex-col items-center">
                  <div className="text-center space-y-2">
                    <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Lock className="text-primary h-8 w-8" />
                    </div>
                    <h3 className="font-bold text-lg">Two-Factor Authentication</h3>
                    <p className="text-sm text-muted-foreground max-w-[280px]">Enter the 6-digit code from your Authenticator app.</p>
                  </div>

                  <div className="space-y-2 w-full">
                    <Input 
                      type="text" 
                      maxLength={6}
                      value={mfaCode} 
                      onChange={e => setMfaCode(e.target.value)} 
                      className="text-center tracking-[0.5rem] text-2xl h-16 font-bold" 
                      required 
                      autoFocus
                    />
                  </div>

                  <Button type="submit" disabled={mfaLoading} className="w-full h-12 text-base font-bold">
                    {mfaLoading ? <Loader2 className="animate-spin mr-2" /> : 'Verify'}
                  </Button>
                </form>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
