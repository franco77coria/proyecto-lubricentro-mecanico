"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface SidebarContextType {
  sidebarVisible: boolean;
  setSidebarVisible: (visible: boolean) => void;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  // Por defecto en pantallas grandes arranca visible
  const [sidebarVisible, setSidebarVisibleState] = useState(true);
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setMontado(true);
    try {
      const guardado = localStorage.getItem("sidebar_visible");
      if (guardado !== null) {
        setSidebarVisibleState(guardado === "true");
      }
    } catch {
      // Ignorar en caso de restricciones de almacenamiento local
    }
  }, []);

  const setSidebarVisible = (visible: boolean) => {
    setSidebarVisibleState(visible);
    try {
      localStorage.setItem("sidebar_visible", String(visible));
    } catch {
      // Ignorar
    }
  };

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  return (
    <SidebarContext.Provider
      value={{
        sidebarVisible: montado ? sidebarVisible : true,
        setSidebarVisible,
        toggleSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    return {
      sidebarVisible: true,
      setSidebarVisible: () => {},
      toggleSidebar: () => {},
    };
  }
  return context;
}
