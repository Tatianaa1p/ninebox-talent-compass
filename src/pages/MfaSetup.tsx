import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const MfaSetup = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [factorId, setFactorId] = useState<string>('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/auth');
      return;
    }
    let cancelled = false;
    (async () => {
      // Si ya está en aal2, no hace falta setup
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (cancelled) return;
      if (aal?.currentLevel === 'aal2') {
        navigate('/dashboard');
        return;
      }

      // Limpiar factores no verificados previos para evitar duplicados
      const { data: factors } = await supabase.auth.mfa.listFactors();
      if (factors?.totp) {
        for (const f of factors.totp) {
          if (f.status !== 'verified') {
            await supabase.auth.mfa.unenroll({ factorId: f.id });
          }
        }
        const verified = factors.totp.find((f) => f.status === 'verified');
        if (verified) {
          navigate('/mfa-verify');
          return;
        }
      }

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: `Seidor Talent App ${Date.now()}`,
      });
      if (cancelled) return;
      if (error || !data) {
        toast({ title: 'Error', description: error?.message ?? 'No se pudo iniciar la configuración', variant: 'destructive' });
        setLoading(false);
        return;
      }
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, navigate, toast]);

  const verifyAndEnable = async (otp: string) => {
    if (!factorId || otp.length !== 6) return;
    setVerifying(true);
    const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({ factorId });
    if (chErr || !challenge) {
      toast({ title: 'Error', description: chErr?.message ?? 'No se pudo crear el desafío', variant: 'destructive' });
      setVerifying(false);
      return;
    }
    const { error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code: otp,
    });
    if (error) {
      toast({ title: 'Código incorrecto', description: error.message, variant: 'destructive' });
      setCode('');
      setVerifying(false);
      return;
    }
    toast({ title: 'MFA activado', description: 'Tu cuenta ahora está protegida con doble factor.' });
    navigate('/dashboard');
  };

  const handleCodeChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 6);
    setCode(clean);
    if (clean.length === 6 && !verifying) {
      verifyAndEnable(clean);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <img src="/seidor-logo.png" alt="Seidor" className="h-8 w-auto object-contain mb-6" />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Configurá tu autenticador de dos factores</CardTitle>
          <CardDescription>
            Tu organización requiere verificación en dos pasos para acceder.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Descargá Google Authenticator o Authy en tu celular.</li>
            <li>Escaneá este código QR con la app.</li>
            <li>Ingresá el código de 6 dígitos que aparece en la app.</li>
          </ol>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="flex justify-center bg-white rounded-lg p-4 border">
                {qrCode && <img src={qrCode} alt="QR MFA" className="h-48 w-48" />}
              </div>

              <button
                type="button"
                onClick={() => setShowSecret((s) => !s)}
                className="text-sm text-primary underline w-full text-center"
              >
                {showSecret ? 'Ocultar código manual' : 'No puedo escanear el QR'}
              </button>
              {showSecret && (
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Ingresá esta clave en tu app:</p>
                  <code className="text-sm font-mono break-all bg-muted px-2 py-1 rounded">{secret}</code>
                </div>
              )}

              <div className="space-y-2">
                <Input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  placeholder="000000"
                  className="text-center text-2xl tracking-[0.5em] font-mono h-14"
                  autoFocus
                />
                <Button
                  className="w-full"
                  disabled={code.length !== 6 || verifying}
                  onClick={() => verifyAndEnable(code)}
                >
                  {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verificar y activar'}
                </Button>
              </div>
            </>
          )}

          <Button variant="link" className="w-full text-xs" onClick={async () => { await signOut(); navigate('/auth'); }}>
            Cancelar y cerrar sesión
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default MfaSetup;
