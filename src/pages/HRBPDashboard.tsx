 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/src/pages/HRBPDashboard.tsx b/src/pages/HRBPDashboard.tsx
index aac07ff92b074d74fc2a16bd6f8a9a272ae751e7..da00879a8d355c050261535cd75013b4d1490896 100644
--- a/src/pages/HRBPDashboard.tsx
+++ b/src/pages/HRBPDashboard.tsx
@@ -20,104 +20,94 @@ interface Empresa {
 }
 
 interface Equipo {
   id: string;
   nombre: string;
   empresa_id: string;
 }
 
 interface Tablero {
   id: string;
   nombre: string;
   equipo_id: string;
   empresa_id: string;
 }
 
 interface Evaluacion {
   id: string;
   persona_nombre: string;
   potencial_score: number;
   desempeno_score: number;
   equipo_id: string;
   tablero_id: string;
 }
 
 const HRBPDashboard = () => {
-  const { user, signOut } = useAuth();
+  const { user, signOut, loading: authLoading } = useAuth();
   const navigate = useNavigate();
   
   const [empresas, setEmpresas] = useState<Empresa[]>([]);
   const [equipos, setEquipos] = useState<Equipo[]>([]);
   const [selectedEmpresa, setSelectedEmpresa] = useState<string>("");
   const [selectedEquipo, setSelectedEquipo] = useState<string>("");
   const [tablero, setTablero] = useState<Tablero | null>(null);
   const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
   const [isEvaluationDialogOpen, setIsEvaluationDialogOpen] = useState(false);
   const [isCreateEmpresaDialogOpen, setIsCreateEmpresaDialogOpen] = useState(false);
   const [isCreateEquipoDialogOpen, setIsCreateEquipoDialogOpen] = useState(false);
-  const [loading, setLoading] = useState(true);
+  const [isDataLoading, setIsDataLoading] = useState(true);
 
-  // Verificar rol HRBP
-  useEffect(() => {
-    const checkRole = async () => {
-      if (!user) return;
-      
-      const { data, error } = await supabase
-        .from("user_roles")
-        .select("role")
-        .eq("user_id", user.id)
-        .eq("role", "hrbp")
-        .maybeSingle();
-
-      if (error || !data) {
-        toast.error("No tienes permisos de HRBP");
-        navigate("/");
-      }
-    };
-
-    checkRole();
-  }, [user, navigate]);
+  // No role validation to allow unrestricted access during testing
 
   // Cargar empresas
   useEffect(() => {
+    if (authLoading) return;
+
     const fetchEmpresas = async () => {
+      setIsDataLoading(true);
       const { data, error } = await supabase
         .from("empresas")
         .select("*")
         .order("nombre");
 
       if (error) {
         toast.error("Error al cargar empresas");
+        setIsDataLoading(false);
         return;
       }
 
       setEmpresas(data || []);
-      setLoading(false);
+      setIsDataLoading(false);
     };
 
-    fetchEmpresas();
-  }, []);
+    if (user) {
+      fetchEmpresas();
+    } else {
+      setEmpresas([]);
+      setIsDataLoading(false);
+    }
+  }, [user, authLoading]);
 
   // Cargar equipos cuando cambia la empresa
   useEffect(() => {
     if (!selectedEmpresa) {
       setEquipos([]);
       return;
     }
 
     const fetchEquipos = async () => {
       const { data, error } = await supabase
         .from("equipos")
         .select("*")
         .eq("empresa_id", selectedEmpresa)
         .order("nombre");
 
       if (error) {
         toast.error("Error al cargar equipos");
         return;
       }
 
       setEquipos(data || []);
     };
 
     fetchEquipos();
   }, [selectedEmpresa]);
@@ -229,51 +219,51 @@ const HRBPDashboard = () => {
   };
 
   const getPerformanceLevel = (score: number): 'Bajo' | 'Medio' | 'Alto' => {
     if (score >= 4.0) return 'Alto';
     if (score >= 2.5) return 'Medio';
     return 'Bajo';
   };
 
   const employees: Employee[] = useMemo(() => {
     return evaluaciones.map(ev => ({
       id: ev.id,
       name: ev.persona_nombre,
       manager: "HRBP",
       potential: getPotentialLevel(ev.potencial_score),
       performance: getPerformanceLevel(ev.desempeno_score),
       potentialScore: ev.potencial_score,
       performanceScore: ev.desempeno_score,
     }));
   }, [evaluaciones]);
 
   const handleLogout = async () => {
     await signOut();
     navigate("/auth");
   };
 
-  if (loading) {
+  if (isDataLoading) {
     return (
       <div className="flex items-center justify-center min-h-screen">
         <p>Cargando...</p>
       </div>
     );
   }
 
   return (
     <OverrideProvider>
       <div className="min-h-screen bg-background p-6">
         <div className="max-w-7xl mx-auto space-y-6">
         {/* Header */}
         <div className="flex justify-between items-center">
           <div>
             <h1 className="text-3xl font-bold">Dashboard HRBP</h1>
             <p className="text-muted-foreground">{user?.email}</p>
           </div>
           <div className="flex gap-2">
             <Button variant="outline" onClick={() => setIsCreateEmpresaDialogOpen(true)}>
               <Building2 className="w-4 h-4 mr-2" />
               Nueva Empresa
             </Button>
             <Button variant="outline" onClick={() => setIsCreateEquipoDialogOpen(true)} disabled={!selectedEmpresa}>
               <Users className="w-4 h-4 mr-2" />
               Nuevo Equipo
 
EOF
)