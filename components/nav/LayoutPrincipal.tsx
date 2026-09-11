"use client";

import { useSidebar } from "./SidebarContext";
import { BotonHamburguesa } from "./BotonHamburguesa";

export function LayoutPrincipal({
  children,
  bannerTrial,
  isla,
}: {
  children: React.ReactNode;
  bannerTrial?: React.ReactNode;
  isla: React.ReactNode;
}) {
  const { sidebarVisible, toggleSidebar } = useSidebar();

  return (
    <>
      {/* Botón flotante para reabrir el sidebar cuando está oculto en pantallas grandes */}
      {!sidebarVisible && (
        <div className="fixed top-3.5 left-3.5 z-40 hidden lg:flex animate-in fade-in-50 zoom-in-95 duration-200">
          <BotonHamburguesa
            activo={false}
            onClick={toggleSidebar}
            ariaLabel="Mostrar menú lateral"
            className="h-9 w-9 bg-card/95 backdrop-blur-xl border border-border/80 shadow-md hover:border-accent/50 text-foreground"
          />
        </div>
      )}

      {/* Contenedor del contenido principal con transición suave de ancho */}
      <div
        className={`flex min-h-dvh flex-col transition-all duration-300 ease-in-out ${
          sidebarVisible ? "lg:pl-[var(--sidebar-ancho)]" : "lg:pl-0"
        }`}
      >
        {bannerTrial}
        {isla}
        {children}
      </div>
    </>
  );
}
