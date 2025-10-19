 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/src/pages/Auth.tsx b/src/pages/Auth.tsx
index 5b4b4acfeeb20e8cd3f3999023263f5007994150..f2175d116ad4025aefa818cc2a25d969bf2e88ae 100644
--- a/src/pages/Auth.tsx
+++ b/src/pages/Auth.tsx
@@ -1,88 +1,69 @@
 import { useState, useEffect } from 'react';
 import { useNavigate } from 'react-router-dom';
 import { useAuth } from '@/contexts/AuthContext';
-import { supabase } from '@/integrations/supabase/client';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { useToast } from '@/hooks/use-toast';
 import { Loader2 } from 'lucide-react';
 
 const Auth = () => {
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [loading, setLoading] = useState(false);
   const { signIn, signUp, user } = useAuth();
   const navigate = useNavigate();
   const { toast } = useToast();
 
   useEffect(() => {
-    const redirectUser = async () => {
-      if (!user) return;
-
-      // Check user role
-      const { data } = await supabase
-        .from("user_roles")
-        .select("role")
-        .eq("user_id", user.id)
-        .maybeSingle();
-
-      // Si no hay data?.role, no navegues (mostrá aviso o espera asignación)
-      if (data?.role === 'hrbp') {
-        navigate('/hrbp');
-      } else if (data?.role === 'manager') {
-        navigate('/dashboard');
-      } else {
-        return; // o navigate('/sin-acceso')
-      }
-    };
-
-    redirectUser();
+    if (user) {
+      navigate('/hrbp');
+    }
   }, [user, navigate]);
 
   const handleSignIn = async (e: React.FormEvent) => {
     e.preventDefault();
     setLoading(true);
 
     const { error } = await signIn(email, password);
 
     if (error) {
       toast({
         title: 'Error al iniciar sesión',
         description: error.message,
         variant: 'destructive',
       });
       setLoading(false);
     } else {
       toast({
         title: 'Sesión iniciada',
         description: 'Bienvenido de vuelta',
       });
-      // Don't navigate here, let useEffect handle it based on role
+      // Don't navigate here, let useEffect handle the post-login redirect
     }
   };
 
   const handleSignUp = async (e: React.FormEvent) => {
     e.preventDefault();
     setLoading(true);
 
     const { error } = await signUp(email, password);
 
     if (error) {
       toast({
         title: 'Error al registrarse',
         description: error.message,
         variant: 'destructive',
       });
     } else {
       toast({
         title: 'Cuenta creada',
         description: 'Revisa tu correo para confirmar tu cuenta',
       });
     }
 
     setLoading(false);
   };
 
 
EOF
)