import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useMFA() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMFA, setHasMFA] = useState(false);
  const [isAAL2, setIsAAL2] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);

  useEffect(() => {
    checkMFAStatus();
  }, []);

  async function checkMFAStatus() {
    setLoading(true);
    try {
      // Check current AAL
      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      setIsAAL2(aalData?.currentLevel === 'aal2');

      // Check if user has enrolled factors
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      
      const totpFactor = data?.totp?.find((f: any) => f.status === 'verified');
      if (totpFactor) {
        setHasMFA(true);
        setFactorId(totpFactor.id);
      } else {
        setHasMFA(false);
      }
    } catch (e: any) {
      console.error("MFA Check error:", e.message);
    } finally {
      setLoading(false);
    }
  }

  async function enrollMFA() {
    setLoading(true);
    setError(null);
    try {
      const friendlyName = 'Device ' + Math.floor(Math.random() * 10000);
      const { data, error } = await supabase.auth.mfa.enroll({ 
        factorType: 'totp', 
        friendlyName,
        issuer: 'Olive Grounds'
      });
      if (error) throw error;
      
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
      return data;
    } catch (e: any) {
      if (e.message?.includes('AAL2 required')) {
        await checkMFAStatus();
        return null;
      }
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function verifyEnrollment(code: string) {
    if (!factorId) return false;
    setLoading(true);
    setError(null);
    try {
      // Create a challenge
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error) throw challenge.error;

      // Verify the challenge
      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code
      });
      if (verify.error) throw verify.error;
      
      // Force refresh to immediately get AAL2 claims before navigating
      await supabase.auth.refreshSession();
      
      await checkMFAStatus();
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function verifyLoginChallenge(code: string) {
    if (!factorId) return false;
    setLoading(true);
    setError(null);
    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error) throw challenge.error;

      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code
      });
      
      if (verify.error) throw verify.error;
      
      // Force refresh to immediately get AAL2 claims before navigating
      await supabase.auth.refreshSession();
      
      await checkMFAStatus();
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setLoading(false);
    }
  }
  
  async function unenrollMFA() {
     if (!factorId) return;
     try {
       await supabase.auth.mfa.unenroll({ factorId });
       await checkMFAStatus();
     } catch (e) {
       console.error("Unenroll error", e);
     }
  }

  return {
    hasMFA,
    isAAL2,
    loading,
    error,
    qrCode,
    secret,
    enrollMFA,
    verifyEnrollment,
    verifyLoginChallenge,
    unenrollMFA,
    checkMFAStatus
  };
}
