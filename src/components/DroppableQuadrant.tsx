import { useDroppable } from "@dnd-kit/core";
import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface DroppableQuadrantProps {
  id: string;
  title: string;
  description?: string;
  color: string;
  count: number;
  children: ReactNode;
}

export const DroppableQuadrant = ({
  id,
  title,
  description,
  color,
  count,
  children,
}: DroppableQuadrantProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <Card
      ref={setNodeRef}
      className={`${color} p-4 min-h-[180px] border-2 transition-all ${
        isOver ? "ring-2 ring-primary shadow-lg scale-[1.02]" : ""
      }`}
    >
      <div className="flex flex-col h-full">
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <h3
              className={`font-bold text-sm ${
                color === "bg-high"
                  ? "text-high-foreground"
                  : color === "bg-medium"
                  ? "text-medium-foreground"
                  : "text-low-foreground"
              }`}
            >
              {title}
            </h3>
            {description && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm">{description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <Badge variant="secondary" className="text-xs">
            {count} persona{count !== 1 ? "s" : ""}
          </Badge>
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto max-h-60">
          {children}
        </div>
      </div>
    </Card>
  );
};
