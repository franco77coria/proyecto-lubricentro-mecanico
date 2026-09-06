"use client";

import { useActionState, useRef, useState } from "react";
import { Check, ImagePlus, Trash2, TriangleAlert, UploadCloud } from "lucide-react";

import { actualizarTaller, type ResultadoConfig } from "@/lib/actions/config";

export interface Taller {
  nombre: string;
  cuit: string | null;
  direccion: string | null;
  telefono: string | null;
  logo_url?: string | null;
}

/**
 * Datos que salen en el encabezado del PDF que se le entrega al cliente.
 * Por eso se aclara en la pantalla: si no, quedan vacíos y el comprobante
 * sale sin forma de contactar al taller ni su logo corporativo.
 */
export function DatosTaller({ taller, editable }: { taller: Taller; editable: boolean }) {
  const [estado, accion, pendiente] = useActionState<ResultadoConfig, FormData>(
    actualizarTaller,
    {},
  );
  const [logoUrl, setLogoUrl] = useState<string>(taller.logo_url ?? "");
  const inputFileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validación de formato
    if (!["image/png", "image/jpeg", "image/webp", "image/svg+xml"].includes(file.type)) {
      alert("Por favor elegí una imagen en formato PNG, JPG, WebP o SVG.");
      return;
    }

    // Convertir a Data URI comprimido/directo para máxima compatibilidad offline/impresión
    const reader = new FileReader();
    reader.onload = () => {
      const dataUri = reader.result as string;
      setLogoUrl(dataUri);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function eliminarLogo() {
    setLogoUrl("");
  }

  return (
    <section className="tarjeta space-y-4 p-4">
      <div>
        <h2 className="t-seccion">Datos del taller y Logo</h2>
        <p className="mt-1 text-caption text-muted-foreground">
          Aparecen en el encabezado del presupuesto, orden de trabajo y ticket térmico del cliente.
        </p>
      </div>

      <form action={accion} className="space-y-4">
        {/* Sección de Logo */}
        <div className="space-y-2">
          <span className="text-caption font-medium text-muted-foreground block">
            Logo del Taller (PNG, JPG, WebP o SVG)
          </span>

          <input type="hidden" name="logo_url" value={logoUrl} />
          <input
            ref={inputFileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={handleFileChange}
            disabled={!editable}
          />

          <div className="flex flex-wrap items-center gap-4">
            {logoUrl ? (
              <div className="relative flex items-center justify-center rounded-2xl border border-border bg-muted/40 p-3 shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoUrl}
                  alt="Vista previa del logo"
                  className="max-h-16 max-w-[160px] object-contain rounded-lg"
                />
                {editable && (
                  <button
                    type="button"
                    onClick={eliminarLogo}
                    title="Quitar logo"
                    className="absolute -top-2 -right-2 grid h-7 w-7 place-items-center rounded-full bg-destructive text-white shadow-md hover:brightness-110 active:scale-95 transition-transform"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex h-16 w-36 items-center justify-center rounded-2xl border-2 border-dashed border-border/80 bg-muted/20 text-muted-foreground text-xs font-semibold">
                Sin logo
              </div>
            )}

            {editable && (
              <button
                type="button"
                onClick={() => inputFileRef.current?.click()}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border/80 bg-card px-4 text-xs font-bold text-foreground hover:border-accent hover:text-accent shadow-sm transition-all active:scale-95"
              >
                {logoUrl ? (
                  <>
                    <UploadCloud className="h-4 w-4 text-accent" />
                    <span>Cambiar imagen</span>
                  </>
                ) : (
                  <>
                    <ImagePlus className="h-4 w-4 text-accent" />
                    <span>Subir logo oficial</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <Campo etiqueta="Nombre / Razón Social" name="nombre" defaultValue={taller.nombre} required disabled={!editable} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo etiqueta="CUIT" name="cuit" defaultValue={taller.cuit ?? ""} disabled={!editable} placeholder="Ej. 30-71234567-8" />
          <Campo
            etiqueta="Teléfono / WhatsApp"
            name="telefono"
            type="tel"
            inputMode="tel"
            defaultValue={taller.telefono ?? ""}
            disabled={!editable}
            placeholder="Ej. 11 4455-6677"
          />
        </div>
        <Campo
          etiqueta="Dirección comercial"
          name="direccion"
          defaultValue={taller.direccion ?? ""}
          disabled={!editable}
          placeholder="Ej. Av. San Martín 1240, CABA"
        />

        {estado.error && (
          <p role="alert" className="flex items-start gap-2 text-caption text-destructive">
            <TriangleAlert className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
            {estado.error}
          </p>
        )}
        {estado.ok && (
          <p className="flex items-center gap-2 text-caption text-estado-ok">
            <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Datos y logo guardados correctamente
          </p>
        )}

        {editable && (
          <button
            type="submit"
            disabled={pendiente}
            className="min-h-12 w-full sm:w-auto rounded-xl bg-accent px-6 text-sm font-bold text-accent-foreground shadow-md transition-transform active:scale-[0.98] hover:brightness-110 disabled:opacity-60"
          >
            {pendiente ? "Guardando…" : "Guardar cambios"}
          </button>
        )}
      </form>
    </section>
  );
}

function Campo({
  etiqueta,
  name,
  ...props
}: { etiqueta: string; name: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block space-y-1.5">
      <span className="text-caption font-semibold text-muted-foreground">{etiqueta}</span>
      <input
        name={name}
        className="min-h-11 w-full rounded-xl border border-border bg-card px-3.5 text-base text-foreground outline-none transition-shadow focus:border-accent focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_18%,transparent)] disabled:bg-muted disabled:text-muted-foreground"
        {...props}
      />
    </label>
  );
}
