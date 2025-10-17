import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { EmployeeOverride, OverrideHistory, ViewMode } from "@/types/override";

interface OverrideContextType {
  overrides: Map<string, EmployeeOverride>;
  history: OverrideHistory[];
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  addOverride: (override: EmployeeOverride) => void;
  removeOverride: (employeeName: string) => void;
  clearAllOverrides: () => void;
  getOverride: (employeeName: string) => EmployeeOverride | undefined;
  undoLastAction: () => void;
  canUndo: boolean;
}

const OverrideContext = createContext<OverrideContextType | undefined>(undefined);

const STORAGE_KEY = "nine-box-overrides";
const HISTORY_KEY = "nine-box-history";
const VIEW_MODE_KEY = "nine-box-view-mode";

interface OverrideProviderProps {
  children: ReactNode;
}

export const OverrideProvider = ({ children }: OverrideProviderProps) => {
  const [overrides, setOverrides] = useState<Map<string, EmployeeOverride>>(new Map());
  const [history, setHistory] = useState<OverrideHistory[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("calibrada");
  const [lastAction, setLastAction] = useState<{
    type: "add" | "remove" | "clear";
    data: any;
    timestamp: number;
  } | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedOverrides = localStorage.getItem(STORAGE_KEY);
      if (savedOverrides) {
        const parsed = JSON.parse(savedOverrides);
        setOverrides(new Map(Object.entries(parsed)));
      }

      const savedHistory = localStorage.getItem(HISTORY_KEY);
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }

      const savedViewMode = localStorage.getItem(VIEW_MODE_KEY);
      if (savedViewMode === "original" || savedViewMode === "calibrada") {
        setViewMode(savedViewMode);
      }
    } catch (error) {
      console.error("Error loading overrides from localStorage:", error);
    }
  }, []);

  // Save to localStorage whenever overrides change
  useEffect(() => {
    try {
      const obj = Object.fromEntries(overrides);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    } catch (error) {
      console.error("Error saving overrides to localStorage:", error);
    }
  }, [overrides]);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error("Error saving history to localStorage:", error);
    }
  }, [history]);

  // Save view mode to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(VIEW_MODE_KEY, viewMode);
    } catch (error) {
      console.error("Error saving view mode to localStorage:", error);
    }
  }, [viewMode]);

  const addOverride = (override: EmployeeOverride) => {
    setOverrides((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(override.employeeName);
      newMap.set(override.employeeName, override);

      // Add to history
      setHistory((prevHistory) => [
        ...prevHistory,
        {
          employeeName: override.employeeName,
          timestamp: override.override_fecha,
          action: existing ? "edit" : "move",
          from: existing?.override_cuadrante,
          to: override.override_cuadrante,
          motivo: override.override_motivo,
        },
      ]);

      // Store for undo
      setLastAction({
        type: "add",
        data: { override, previous: existing },
        timestamp: Date.now(),
      });

      return newMap;
    });
  };

  const removeOverride = (employeeName: string) => {
    setOverrides((prev) => {
      const newMap = new Map(prev);
      const removed = newMap.get(employeeName);
      newMap.delete(employeeName);

      if (removed) {
        setHistory((prevHistory) => [
          ...prevHistory,
          {
            employeeName,
            timestamp: new Date().toISOString(),
            action: "revert",
            from: removed.override_cuadrante,
          },
        ]);

        setLastAction({
          type: "remove",
          data: removed,
          timestamp: Date.now(),
        });
      }

      return newMap;
    });
  };

  const clearAllOverrides = () => {
    const current = new Map(overrides);
    setOverrides(new Map());
    setHistory([]);
    setLastAction({
      type: "clear",
      data: current,
      timestamp: Date.now(),
    });
  };

  const getOverride = (employeeName: string) => {
    return overrides.get(employeeName);
  };

  const undoLastAction = () => {
    if (!lastAction || Date.now() - lastAction.timestamp > 5000) {
      return;
    }

    if (lastAction.type === "add") {
      const { override, previous } = lastAction.data;
      if (previous) {
        setOverrides((prev) => {
          const newMap = new Map(prev);
          newMap.set(override.employeeName, previous);
          return newMap;
        });
      } else {
        setOverrides((prev) => {
          const newMap = new Map(prev);
          newMap.delete(override.employeeName);
          return newMap;
        });
      }
    } else if (lastAction.type === "remove") {
      const removed = lastAction.data;
      setOverrides((prev) => {
        const newMap = new Map(prev);
        newMap.set(removed.employeeName, removed);
        return newMap;
      });
    } else if (lastAction.type === "clear") {
      setOverrides(lastAction.data);
    }

    setLastAction(null);
  };

  const canUndo = lastAction !== null && Date.now() - lastAction.timestamp <= 5000;

  return (
    <OverrideContext.Provider
      value={{
        overrides,
        history,
        viewMode,
        setViewMode,
        addOverride,
        removeOverride,
        clearAllOverrides,
        getOverride,
        undoLastAction,
        canUndo,
      }}
    >
      {children}
    </OverrideContext.Provider>
  );
};

export const useOverrides = () => {
  const context = useContext(OverrideContext);
  if (!context) {
    throw new Error("useOverrides must be used within an OverrideProvider");
  }
  return context;
};
