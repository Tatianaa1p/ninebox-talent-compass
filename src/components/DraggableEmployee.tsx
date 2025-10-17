import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Employee } from "@/types/employee";
import { Badge } from "@/components/ui/badge";
import { GripVertical } from "lucide-react";

interface DraggableEmployeeProps {
  employee: Employee;
  onEdit: (employee: Employee) => void;
  onRevert: (employee: Employee) => void;
  hasOverride: boolean;
}

export const DraggableEmployee = ({
  employee,
  onEdit,
  onRevert,
  hasOverride,
}: DraggableEmployeeProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: employee.id,
    data: employee,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group"
    >
      <div className="text-xs p-2 bg-card rounded border border-border hover:bg-accent transition-colors">
        <div className="flex items-start gap-2">
          <button
            {...listeners}
            {...attributes}
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors mt-0.5"
          >
            <GripVertical className="h-3 w-3" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-1">
              <div className="font-medium truncate">{employee.name}</div>
              {hasOverride && (
                <Badge variant="outline" className="text-[8px] px-1 py-0 h-4">
                  Editado
                </Badge>
              )}
            </div>
            <div className="text-muted-foreground truncate text-[10px]">
              {employee.manager}
            </div>
          </div>
        </div>
        
        {/* Quick actions on hover */}
        <div className="hidden group-hover:flex gap-1 mt-2 pt-2 border-t border-border">
          <button
            onClick={() => onEdit(employee)}
            className="text-[10px] px-2 py-1 bg-secondary hover:bg-secondary/80 rounded transition-colors flex-1"
          >
            Editar
          </button>
          {hasOverride && (
            <button
              onClick={() => onRevert(employee)}
              className="text-[10px] px-2 py-1 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded transition-colors flex-1"
            >
              Revertir
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
