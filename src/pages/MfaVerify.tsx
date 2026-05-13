import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const MfaVerify = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();

  const [factorId, setFactorId] = useState<string>('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/auth');
      return;
    }
    let cancelled = false;
    (async () => {
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (cancelled) return;
      if (aal?.currentLevel === 'aal2') {
        navigate('/dashboard');
        return;
      }
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const verified = factors?.totp?.find((f) => f.status === 'verified');
      if (!verified) {
        navigate('/mfa-setup');
        return;
      }
      setFactorId(verified.id);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, navigate]);

  const verifyMfa = async (otp: string) => {
    if (!factorId || otp.length !== 6) return;
    setVerifying(true);
    setError('');
    const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({ factorId });
    if (chErr || !challenge) {
      setError(chErr?.message ?? 'No se pudo crear el desafío');
      setVerifying(false);
      return;
    }
    const { error: vErr } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code: otp,
    });
    if (vErr) {
      setError('Código incorrecto. Intentá de nuevo.');
      setCode('');
      setVerifying(false);
      return;
    }
    navigate('/dashboard');
  };

  const handleCodeChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 6);
    setCode(clean);
    setError('');
    if (clean.length === 6 && !verifying) {
      verifyMfa(clean);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <img src="/seidor-logo.png" alt="Seidor" className="h-8 w-auto object-contain mb-6" />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Verificación en dos pasos</CardTitle>
          <CardDescription>
            Ingresá el código de 6 dígitos de tu app autenticadora.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <Input
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                placeholder="000000"
                className="text-center text-3xl tracking-[0.5em] font-mono h-16"
                autoFocus
              />
              {error && <p className="text-sm text-destructive text-center">{error}</p>}
              <Button
                className="w-full"
                disabled={code.length !== 6 || verifying}
                onClick={() => verifyMfa(code)}
              >
                {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verificar'}
              </Button>
              <a
                href="mailto:soporte@seidor.com"
                className="block text-center text-sm text-muted-foreground hover:text-primary underline"
              >
                ¿Problemas para acceder?
              </a>
              <Button variant="link" className="w-full text-xs" onClick={async () => { await signOut(); navigate('/auth'); }}>
                Cerrar sesión
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MfaVerify;
