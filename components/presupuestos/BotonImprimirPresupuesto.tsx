"use client";

import { Printer } from "lucide-react";
import { cn } from "@/lib/utils";

export function BotonImprimirPresupuesto({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={cn(
        "flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:brightness-110 active:scale-95 transition-all",
        className,
      )}
    >
      <Printer className="h-4 w-4" aria-hidden />
      <span>Imprimir Presupuesto</span>
    </button>
  );
}
