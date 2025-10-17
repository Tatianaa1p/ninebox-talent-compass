import { useDroppable } from "@dnd-kit/core";
import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DroppableQuadrantProps {
  id: string;
  title: string;
  color: string;
  count: number;
  children: ReactNode;
}

export const DroppableQuadrant = ({
  id,
  title,
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
          <h3
            className={`font-bold text-sm mb-1 ${
              color === "bg-high"
                ? "text-high-foreground"
                : color === "bg-medium"
                ? "text-medium-foreground"
                : "text-low-foreground"
            }`}
          >
            {title}
          </h3>
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
