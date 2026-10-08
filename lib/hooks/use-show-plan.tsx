"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { toast } from '@/lib/hooks/use-toast';

interface ShowPlanItem {
  id: number;
  title: string;
  type: 'arrangement' | 'show';
}

interface ShowPlanContextType {
  plan: ShowPlanItem[];
  removeFromPlan: (id: number) => void;
  clearPlan: () => void;
  itemCount: number;
}

const ShowPlanContext = createContext<ShowPlanContextType | undefined>(undefined);

export function ShowPlanProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useState<ShowPlanItem[]>([]);

  const removeFromPlan = (id: number) => {
    setPlan(prevPlan => prevPlan.filter(item => item.id !== id));
    toast({
      title: "Removed from Plan",
      description: "The item has been removed from your show plan.",
    });
  };

  const clearPlan = () => {
    setPlan([]);
  };

  return (
    <ShowPlanContext.Provider value={{ plan, removeFromPlan, clearPlan, itemCount: plan.length }}>
      {children}
    </ShowPlanContext.Provider>
  );
}

export function useShowPlan() {
  const context = useContext(ShowPlanContext);
  if (context === undefined) {
    throw new Error('useShowPlan must be used within a ShowPlanProvider');
  }
  return context;
}
