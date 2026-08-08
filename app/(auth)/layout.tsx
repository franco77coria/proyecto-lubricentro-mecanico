import { redirect } from "next/navigation";

import { PanelMarca } from "@/components/auth/PanelMarca";
import { obtenerSesion } from "@/lib/supabase/server";

/**
 * Pantallas sin sesión.
 *
 * En escritorio va partido: el panel de marca ocupa el espacio que antes
 * quedaba vacío al costado del formulario, y el formulario se queda con una
 * columna de ancho cómodo en lugar de estirarse.
 * En celular el panel no se monta y queda solo el formulario.
 *
 * Si la sesión ya está completa no tiene sentido mostrar el login.
 */
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const sesion = await obtenerSesion();
  if (sesion?.estado === "completo") redirect("/tablero");

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr] xl:grid-cols-[1.15fr_1fr]">
      <PanelMarca />

      <div className="relative flex flex-col overflow-hidden px-5 safe-x pt-[calc(var(--safe-top)+1.5rem)] pb-[calc(var(--safe-bottom)+1.5rem)]">
        {/* En celular no hay panel de marca, así que el color de la marca entra
            por acá: un tinte muy suave arriba para que no sea una hoja blanca. */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 lg:hidden"
          style={{
            background:
              "radial-gradient(120% 90% at 50% 0%, rgb(194 65 12 / 0.13) 0%, transparent 70%)",
          }}
        />
        {children}
      </div>
    </div>
  );
}
