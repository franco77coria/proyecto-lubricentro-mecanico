"use client";

import { useState, useRef } from "react";
import {
  Check,
  TriangleAlert,
  Camera,
  Loader2,
  Copy,
  CheckCheck,
  X,
  ShieldCheck,
} from "lucide-react";

import { ayudaPatente, detectarFormato, nombreFormato, normalizarPatente } from "@/lib/patente";
import { escanearCedulaVerdeAction } from "@/lib/actions/cedula-verde";
import type { CedulaVerdeOCRData } from "@/lib/ia/cedula-verde";

export function PatenteInput({
  defaultValue = "",
  value: valueProp,
  onChange,
  onCambio,
  formatoEspecial: especialProp,
  onFormatoEspecialChange,
  onCedulaDetectada,
}: {
  defaultValue?: string;
  value?: string;
  onChange?: (patente: string) => void;
  onCambio?: (patente: string) => void;
  formatoEspecial?: boolean;
  onFormatoEspecialChange?: (especial: boolean) => void;
  onCedulaDetectada?: (datos: CedulaVerdeOCRData) => void;
}) {
  const [internalValor, setInternalValor] = useState(normalizarPatente(defaultValue));
  const [internalEspecial, setInternalEspecial] = useState(false);
  const [escaneando, setEscaneando] = useState(false);
  const [datosCedula, setDatosCedula] = useState<CedulaVerdeOCRData | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);
  const inputFotoRef = useRef<HTMLInputElement>(null);

  const valor = valueProp !== undefined ? valueProp : internalValor;
  const especial = especialProp !== undefined ? especialProp : internalEspecial;

  const formato = detectarFormato(valor);
  const ayuda = especial ? null : ayudaPatente(valor);

  const handleTextChange = (val: string) => {
    const limpio = normalizarPatente(val).slice(0, 10);
    if (valueProp === undefined) {
      setInternalValor(limpio);
    }
    onChange?.(limpio);
    onCambio?.(limpio);
  };

  const handleEspecialChange = (esp: boolean) => {
    if (especialProp === undefined) {
      setInternalEspecial(esp);
    }
    onFormatoEspecialChange?.(esp);
  };

  const copiarAlPortapapeles = (texto: string, clave: string) => {
    if (!texto) return;
    navigator.clipboard.writeText(texto);
    setCopiado(clave);
    setTimeout(() => setCopiado(null), 2000);
  };

  async function procesarFotoCedula(file: File) {
    setEscaneando(true);
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const dataUri = await base64Promise;

      const res = await escanearCedulaVerdeAction(dataUri);
      if (res.datos) {
        setDatosCedula(res.datos);
        if (res.datos.patente) {
          handleTextChange(res.datos.patente);
        }
        onCedulaDetectada?.(res.datos);
      }
    } catch (err) {
      console.warn("[PatenteInput/OCR]", err);
    } finally {
      setEscaneando(false);
    }
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-caption font-medium text-muted-foreground">Patente</span>
        <button
          type="button"
          onClick={() => inputFotoRef.current?.click()}
          disabled={escaneando}
          className="inline-flex items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/10 px-2.5 py-1 text-[11px] font-bold text-accent transition-all hover:bg-accent/20 active:scale-95 disabled:opacity-50 shadow-sm"
        >
          {escaneando ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Leyendo cédula con IA...</span>
            </>
          ) : (
            <>
              <Camera className="h-3.5 w-3.5" />
              <span>Escanear Cédula Verde</span>
            </>
          )}
        </button>
      </div>

      <input
        ref={inputFotoRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) procesarFotoCedula(f);
          e.target.value = "";
        }}
      />

      <label className="block space-y-1.5">
        <input
          name="patente"
          required
          value={valor}
          onChange={(e) => handleTextChange(e.target.value)}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          inputMode="text"
          placeholder="AB123CD"
          aria-describedby="ayuda-patente"
          aria-invalid={ayuda ? true : undefined}
          className={`text-display min-h-14 w-full rounded-[var(--radius-sm)] border bg-card px-3 text-2xl tracking-[0.08em] text-foreground outline-none transition-shadow placeholder:text-muted-foreground/50 focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_18%,transparent)] ${
            ayuda ? "border-destructive" : "border-border focus:border-accent"
          }`}
        />
      </label>

      {/* Ficha Visual Completa de Cédula Verde / Azul Detectada */}
      {datosCedula && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-3.5 space-y-2.5 shadow-sm animate-in fade-in slide-in-from-top-1 transition-all">
          <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Cédula Identificada con IA (Gemini 3.0 Flash)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setDatosCedula(null)}
              className="text-muted-foreground hover:text-foreground p-0.5 rounded"
              title="Cerrar ficha"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {/* Vehículo: Marca y Modelo */}
            {(datosCedula.marca || datosCedula.modelo) && (
              <div className="bg-card/90 rounded-xl p-2.5 border border-border/60 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Vehículo (Marca y Modelo)
                </span>
                <span className="font-bold text-foreground text-[13px] block">
                  {datosCedula.marca ? `${datosCedula.marca} ` : ""}
                  {datosCedula.modelo || ""}
                </span>
                {(datosCedula.tipo || datosCedula.uso) && (
                  <span className="text-[10px] text-muted-foreground font-medium block mt-0.5">
                    {datosCedula.tipo} {datosCedula.uso ? `• ${datosCedula.uso}` : ""}
                  </span>
                )}
              </div>
            )}

            {/* Dominio y Vencimiento */}
            <div className="bg-card/90 rounded-xl p-2.5 border border-border/60 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                Dominio / Chapa Patente
              </span>
              <span className="font-mono font-black text-foreground text-sm tracking-wider block">
                {datosCedula.patente}
              </span>
              {(datosCedula.vencimiento || datosCedula.codigoDoc) && (
                <span className="text-[10px] text-muted-foreground font-medium block mt-0.5">
                  {datosCedula.vencimiento ? `Vence: ${datosCedula.vencimiento}` : ""}
                  {datosCedula.codigoDoc ? ` • Doc: ${datosCedula.codigoDoc}` : ""}
                </span>
              )}
            </div>

            {/* Chasis / VIN */}
            {datosCedula.vin && (
              <div className="bg-card/90 rounded-xl p-2.5 border border-border/60 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Chasis / VIN (17 caracteres)
                  </span>
                  <span className="font-mono font-bold text-foreground text-[11px] select-all break-all block">
                    {datosCedula.vin}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => copiarAlPortapapeles(datosCedula.vin!, "vin")}
                  className="ml-2 inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-border/60 bg-muted/60 hover:bg-muted text-[10px] font-semibold transition-all shrink-0"
                  title="Copiar número de chasis"
                >
                  {copiado === "vin" ? (
                    <>
                      <CheckCheck className="h-3 w-3 text-emerald-500" />
                      <span className="text-emerald-500">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 text-muted-foreground" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Motorización / Cilindrada */}
            {datosCedula.motorizacion && (
              <div className="bg-card/90 rounded-xl p-2.5 border border-accent/30 bg-accent/5 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-accent block">
                  Motorización / Cilindrada
                </span>
                <span className="font-bold text-foreground font-mono text-sm block">
                  {datosCedula.motorizacion}
                </span>
              </div>
            )}

            {/* Número de Motor */}
            {datosCedula.motor && (
              <div className="bg-card/90 rounded-xl p-2.5 border border-border/60 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Número de Motor
                  </span>
                  <span className="font-mono font-bold text-foreground text-[11px] select-all break-all block">
                    {datosCedula.motor}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => copiarAlPortapapeles(datosCedula.motor!, "motor")}
                  className="ml-2 inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-border/60 bg-muted/60 hover:bg-muted text-[10px] font-semibold transition-all shrink-0"
                  title="Copiar número de motor"
                >
                  {copiado === "motor" ? (
                    <>
                      <CheckCheck className="h-3 w-3 text-emerald-500" />
                      <span className="text-emerald-500">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 text-muted-foreground" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Combustible */}
            {datosCedula.combustible && (
              <div className="bg-card/90 rounded-xl p-2.5 border border-border/60 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Combustible
                </span>
                <span className="font-bold text-foreground capitalize text-xs">
                  {datosCedula.combustible}
                </span>
              </div>
            )}

            {/* Titular */}
            {datosCedula.titularNombre && (
              <div className="bg-card/90 rounded-xl p-2.5 border border-border/60 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Titular Registrado
                </span>
                <span className="font-bold text-foreground text-xs">
                  {datosCedula.titularNombre}{" "}
                  {datosCedula.titularDocumento ? `(${datosCedula.titularDocumento})` : ""}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <p id="ayuda-patente" className="flex min-h-5 items-start gap-1.5 text-caption">
        {formato && !especial ? (
          <>
            <Check className="mt-px h-3.5 w-3.5 shrink-0 text-estado-ok" aria-hidden />
            <span className="text-muted-foreground">{nombreFormato(formato)}</span>
          </>
        ) : ayuda ? (
          <>
            <TriangleAlert className="mt-px h-3.5 w-3.5 shrink-0 text-destructive" aria-hidden />
            <span className="text-destructive">{ayuda}</span>
          </>
        ) : null}
      </p>

      {(ayuda || especial) && (
        <label className="flex items-center gap-2.5 rounded-[var(--radius-sm)] bg-muted px-3 py-2.5">
          <input
            type="checkbox"
            name="formatoEspecial"
            checked={especial}
            onChange={(e) => handleEspecialChange(e.target.checked)}
            className="h-5 w-5 accent-[var(--accent)]"
          />
          <span className="text-caption text-foreground">
            Es un importado, un clásico o tiene chapa especial
          </span>
        </label>
      )}
    </div>
  );
}
