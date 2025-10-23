import { useState, useMemo, useCallback } from "react";
import { DndContext, DragEndEvent, DragOverlay } from "@dnd-kit/core";
import { Employee, PerformanceLevel, PotentialLevel } from "@/types/employee";
import { DroppableQuadrant } from "@/components/DroppableQuadrant";
import { DraggableEmployee } from "@/components/DraggableEmployee";
import { EmployeeEditDialog } from "@/components/EmployeeEditDialog";
import { UndoSnackbar } from "@/components/UndoSnackbar";
import { QuadrantInfoPanel } from "@/components/QuadrantInfoPanel";
import { useOverrides } from "@/contexts/OverrideContext";
import { QUADRANT_KEYS, QUADRANT_NAMES, QUADRANT_DESCRIPTIONS } from "@/types/override";
import { useRealtimeCalibrations } from "@/hooks/useRealtimeCalibrations";
import { supabase } from "@/integrations/supabase/client";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

interface InteractiveNineBoxGridProps {
  employees: Employee[];
  tableroId?: string;
  onDataReload?: () => void;
}

const QUADRANT_LABELS: Record<string, { title: string; description: string; color: string }> = {
  "Alto-Alto": { 
    title: QUADRANT_NAMES["Alto-Alto"], 
    description: QUADRANT_DESCRIPTIONS["Alto-Alto"],
    color: "bg-high" 
  },
  "Alto-Medio": { 
    title: QUADRANT_NAMES["Alto-Medio"], 
    description: QUADRANT_DESCRIPTIONS["Alto-Medio"],
    color: "bg-high" 
  },
  "Alto-Bajo": { 
    title: QUADRANT_NAMES["Alto-Bajo"], 
    description: QUADRANT_DESCRIPTIONS["Alto-Bajo"],
    color: "bg-medium" 
  },
  "Medio-Alto": { 
    title: QUADRANT_NAMES["Medio-Alto"], 
    description: QUADRANT_DESCRIPTIONS["Medio-Alto"],
    color: "bg-medium" 
  },
  "Medio-Medio": { 
    title: QUADRANT_NAMES["Medio-Medio"], 
    description: QUADRANT_DESCRIPTIONS["Medio-Medio"],
    color: "bg-medium" 
  },
  "Medio-Bajo": { 
    title: QUADRANT_NAMES["Medio-Bajo"], 
    description: QUADRANT_DESCRIPTIONS["Medio-Bajo"],
    color: "bg-medium" 
  },
  "Bajo-Alto": { 
    title: QUADRANT_NAMES["Bajo-Alto"], 
    description: QUADRANT_DESCRIPTIONS["Bajo-Alto"],
    color: "bg-low" 
  },
  "Bajo-Medio": { 
    title: QUADRANT_NAMES["Bajo-Medio"], 
    description: QUADRANT_DESCRIPTIONS["Bajo-Medio"],
    color: "bg-low" 
  },
  "Bajo-Bajo": { 
    title: QUADRANT_NAMES["Bajo-Bajo"], 
    description: QUADRANT_DESCRIPTIONS["Bajo-Bajo"],
    color: "bg-low" 
  },
};

export const InteractiveNineBoxGrid = ({ employees, tableroId, onDataReload }: InteractiveNineBoxGridProps) => {
  const { addOverride, removeOverride, getOverride, viewMode, undoLastAction, canUndo } =
    useOverrides();
  const { toast } = useToast();
  const [activeEmployee, setActiveEmployee] = useState<Employee | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [showUndo, setShowUndo] = useState(false);
  const [undoMessage, setUndoMessage] = useState("");
  const [hoveredQuadrant, setHoveredQuadrant] = useState<{
    title: string;
    description: string;
    potential: string;
    performance: string;
  } | null>(null);

  // Setup realtime subscription for calibration updates
  const handleRealtimeUpdate = useCallback(() => {
    console.log('🔄 Realtime update received, reloading data...');
    console.log('📊 Tablero ID:', tableroId);
    if (onDataReload) {
      onDataReload();
    }
  }, [onDataReload]);

  useRealtimeCalibrations(tableroId, handleRealtimeUpdate);

  // Log initial state
  useEffect(() => {
    console.log('📊 Nine Box Grid montado');
    console.log('👤 Total empleados:', employees.length);
    console.log('🎯 Tablero actual:', tableroId);
  }, [tableroId, employees.length]);

  // Get employees with overrides applied in calibrated mode
  const displayEmployees = useMemo(() => {
    if (viewMode === "original") {
      return employees;
    }

    return employees.map((emp) => {
      const override = getOverride(emp.name);
      if (!override) return emp;

      const quadrantKey = QUADRANT_KEYS[override.override_cuadrante as keyof typeof QUADRANT_KEYS];
      const [performance, potential] = quadrantKey.split("-") as [PerformanceLevel, PotentialLevel];

      return {
        ...emp,
        performance: override.override_desempeno_categoria || performance,
        potential: override.override_potencial_categoria || potential,
      };
    });
  }, [employees, viewMode, getOverride]);

  const quadrants = useMemo(() => {
    const potentialLevels: PotentialLevel[] = ["Alto", "Medio", "Bajo"];
    const performanceLevels: PerformanceLevel[] = ["Bajo", "Medio", "Alto"];

    return potentialLevels.flatMap((potential) =>
      performanceLevels.map((performance) => {
        const key = `${potential}-${performance}`;
        const config = QUADRANT_LABELS[key];

        return {
          id: key,
          title: config.title,
          description: config.description,
          performance,
          potential,
          color: config.color,
          employees: displayEmployees.filter(
            (emp) => emp.performance === performance && emp.potential === potential
          ),
        };
      })
    );
  }, [displayEmployees]);

  const handleDragStart = (event: any) => {
    const employee = event.active.data.current;
    setActiveEmployee(employee);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    console.log('🎯 Drag end event triggered');
    setActiveEmployee(null);

    const { active, over } = event;
    if (!over) {
      console.log('⚠️ No drop target');
      return;
    }

    const employee = active.data.current as Employee;
    const targetQuadrantKey = over.id as string;
    const targetQuadrantName = QUADRANT_NAMES[targetQuadrantKey as keyof typeof QUADRANT_NAMES];

    console.log('📦 Employee:', employee.name);
    console.log('🎯 Target quadrant:', targetQuadrantName);

    const [targetPotential, targetPerformance] = targetQuadrantKey.split("-") as [
      PotentialLevel,
      PerformanceLevel
    ];

    const currentQuadrantKey = `${employee.potential}-${employee.performance}`;
    const currentQuadrantName = QUADRANT_NAMES[currentQuadrantKey as keyof typeof QUADRANT_NAMES];
    
    if (currentQuadrantKey === targetQuadrantKey) {
      console.log('✋ Same quadrant, no change');
      return;
    }

    // Map categories to scores (Bajo=2, Medio=3, Alto=4)
    const scoreCalibreDesempeno = targetPerformance === "Bajo" ? 2 : targetPerformance === "Medio" ? 3 : 4;
    const scoreCalibradoPotencial = targetPotential === "Bajo" ? 2 : targetPotential === "Medio" ? 3 : 4;

    console.log('📊 Scores - Performance:', scoreCalibreDesempeno, 'Potential:', scoreCalibradoPotencial);

    if (!tableroId) {
      console.error('❌ No tablero ID');
      toast({
        title: "Error",
        description: "No se encontró el ID del tablero",
        variant: "destructive",
      });
      return;
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ No user authenticated');
      toast({
        title: "Error",
        description: "Usuario no autenticado",
        variant: "destructive",
      });
      return;
    }

    console.log('👤 Calibrating as user:', user.email);

    // Get tablero to find empresa_id
    const { data: tablero, error: tableroError } = await supabase
      .from('tableros')
      .select('empresa_id')
      .eq('id', tableroId)
      .maybeSingle();

    if (tableroError || !tablero) {
      console.error('❌ Error fetching tablero:', tableroError);
      toast({
        title: "Error",
        description: "No se pudo obtener información del tablero",
        variant: "destructive",
      });
      return;
    }

    console.log('🏢 Empresa ID:', tablero.empresa_id);

    // Find evaluacion for this employee
    const { data: evaluacion, error: evalError } = await supabase
      .from('evaluaciones')
      .select('id')
      .eq('persona_nombre', employee.name)
      .eq('tablero_id', tableroId)
      .maybeSingle();

    if (evalError || !evaluacion) {
      console.error('❌ Error fetching evaluacion:', evalError);
      toast({
        title: "Error",
        description: "No se encontró la evaluación del empleado",
        variant: "destructive",
      });
      return;
    }

    console.log('📝 Evaluacion ID:', evaluacion.id);

    // Upsert to calibraciones table
    const calibrationData = {
      evaluacion_id: evaluacion.id,
      empresa_id: tablero.empresa_id,
      manager_id: user.id,
      cuadrante_original: currentQuadrantName,
      cuadrante_calibrado: targetQuadrantName,
      score_original_desempeno: employee.performanceScore,
      score_original_potencial: employee.potentialScore,
      score_calibrado_desempeno: scoreCalibreDesempeno,
      score_calibrado_potencial: scoreCalibradoPotencial,
    };

    console.log('💾 Saving calibration:', calibrationData);

    const { data: calibData, error } = await supabase
      .from('calibraciones')
      .upsert(calibrationData, { 
        onConflict: 'evaluacion_id',
        ignoreDuplicates: false 
      })
      .select();

    if (error) {
      console.error('❌ Error saving calibration:', error);
      toast({
        title: "Error al calibrar",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    console.log('✅ Calibration saved successfully:', calibData);

    // Also add to override context for local state
    const override = {
      employeeName: employee.name,
      override_potencial_categoria: targetPotential,
      override_desempeno_categoria: targetPerformance,
      override_cuadrante: targetQuadrantName,
      override_fecha: new Date().toISOString(),
      override_usuario: user.email || "Usuario actual",
    };

    addOverride(override);

    toast({
      title: "✅ Empleado calibrado",
      description: `${employee.name} → ${targetQuadrantName}`,
    });

    console.log('🔄 Triggering data reload...');
    // Trigger reload to show real-time data
    if (onDataReload) {
      onDataReload();
    }
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async (quadrantName: string, success: boolean) => {
    if (!editingEmployee) return;

    // Close dialog
    setEditDialogOpen(false);
    setEditingEmployee(null);
    
    if (success) {
      // Reload data directly from database
      if (onDataReload) {
        await onDataReload();
      }
      
      toast({
        title: "Calibración guardada",
        description: `${editingEmployee.name} actualizado correctamente en el grid`,
      });
    } else {
      toast({
        title: "Actualización fallida",
        description: "Recarga la página para ver los cambios",
        variant: "destructive",
      });
    }
  };

  const handleRevertEmployee = (employee: Employee) => {
    removeOverride(employee.name);

    setUndoMessage(`Revertido ${employee.name} a clasificación original`);
    setShowUndo(true);

    toast({
      title: "Override eliminado",
      description: `${employee.name} vuelve a su posición original`,
    });
  };

  const handleUndo = () => {
    undoLastAction();
    setShowUndo(false);
    toast({
      title: "Acción deshecha",
      description: "Se ha revertido el último cambio",
    });
  };

  return (
    <>
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="w-full">
          {/* Axis Labels */}
          <div className="flex justify-center mb-2">
            <div className="text-sm font-semibold text-foreground">
              Desempeño (Performance) →
            </div>
          </div>

          <div className="flex gap-2">
            {/* Y-Axis Label */}
            <div className="flex items-center justify-center w-8">
              <div className="transform -rotate-90 whitespace-nowrap text-sm font-semibold text-foreground">
                Potencial (Potential) ↑
              </div>
            </div>

            {/* Grid */}
            <div className="flex-1">
              <div className="grid grid-cols-3 gap-3">
                {quadrants.map((quadrant) => (
                  <div
                    key={quadrant.id}
                    onMouseEnter={() =>
                      setHoveredQuadrant({
                        title: quadrant.title,
                        description: quadrant.description,
                        potential: quadrant.potential,
                        performance: quadrant.performance,
                      })
                    }
                    onMouseLeave={() => setHoveredQuadrant(null)}
                  >
                    <DroppableQuadrant
                      id={quadrant.id}
                      title={quadrant.title}
                      description={quadrant.description}
                      color={quadrant.color}
                      count={quadrant.employees.length}
                    >
                    {quadrant.employees.map((employee) => (
                      <TooltipProvider key={employee.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <DraggableEmployee
                                employee={employee}
                                onEdit={handleEditEmployee}
                                onRevert={handleRevertEmployee}
                                hasOverride={getOverride(employee.name) !== undefined}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="space-y-1">
                              <p className="font-semibold">{employee.name}</p>
                              <p className="text-xs">Manager: {employee.manager}</p>
                              <p className="text-xs">
                                Desempeño: {employee.performance} (
                                {employee.performanceScore.toFixed(2)})
                              </p>
                              <p className="text-xs">
                                Potencial: {employee.potential} (
                                {employee.potentialScore.toFixed(2)})
                              </p>
                              {getOverride(employee.name) && (
                                <p className="text-xs text-warning font-medium">
                                  ⚠️ Ubicación modificada
                                </p>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                    </DroppableQuadrant>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quadrant Info Panel */}
          {hoveredQuadrant && (
            <div className="mt-6">
              <QuadrantInfoPanel
                title={hoveredQuadrant.title}
                description={hoveredQuadrant.description}
                potential={hoveredQuadrant.potential}
                performance={hoveredQuadrant.performance}
              />
            </div>
          )}

          {/* Performance Level Labels */}
          <div className="flex gap-2 mt-2 ml-10">
            <div className="flex-1 text-center text-xs font-medium text-muted-foreground">
              Bajo
            </div>
            <div className="flex-1 text-center text-xs font-medium text-muted-foreground">
              Medio
            </div>
            <div className="flex-1 text-center text-xs font-medium text-muted-foreground">
              Alto
            </div>
          </div>
        </div>

        <DragOverlay>
          {activeEmployee && (
            <div className="bg-card p-2 rounded shadow-lg border-2 border-primary">
              <div className="font-medium text-sm">{activeEmployee.name}</div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      <EmployeeEditDialog
        employee={editingEmployee}
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setEditingEmployee(null);
        }}
        onSave={handleSaveEdit}
        currentOverrideMotivo={
          editingEmployee ? getOverride(editingEmployee.name)?.override_motivo : undefined
        }
        tableroId={tableroId}
      />

      <UndoSnackbar
        show={showUndo && canUndo}
        message={undoMessage}
        onUndo={handleUndo}
        onDismiss={() => setShowUndo(false)}
      />
    </>
  );
};
