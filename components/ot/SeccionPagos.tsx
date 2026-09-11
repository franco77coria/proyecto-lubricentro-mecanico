"use client";

import { Banknote, CreditCard, Landmark, Plus, Smartphone, WalletCards } from "lucide-react";
import { useState, useTransition } from "react";

import { METODOS_PAGO, type MetodoPago } from "@/lib/schemas/pago";
import { registrarPagoOT } from "@/lib/actions/caja";
import { useFormato } from "@/lib/i18n/I18nContext";
import { DesplegableModerno, type OpcionDesplegable } from "@/components/ui/DesplegableModerno";

const ETIQUETA_METODO: Record<MetodoPago, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tarjeta_credito: "Tarjeta crédito",
  tarjeta_debito: "Tarjeta débito",
  mercado_pago: "Mercado Pago",
  otro: "Otro",
};

const ICONO_METODO: Record<MetodoPago, typeof Banknote> = {
  efectivo: Banknote,
  transferencia: Landmark,
  tarjeta_credito: CreditCard,
  tarjeta_debito: CreditCard,
  mercado_pago: Smartphone,
  otro: WalletCards,
};

const OPCIONES_METODO: OpcionDesplegable[] = METODOS_PAGO.map((m) => ({
  valor: m,
  etiqueta: ETIQUETA_METODO[m],
  icono: ICONO_METODO[m],
}));

interface Pago {
  id: string;
  metodo: string;
  monto: number;
  fecha: string;
}

export function SeccionPagos({
  otId,
  totalOT,
  pagosIniciales,
}: {
  otId: string;
  totalOT: number;
  pagosIniciales: Pago[];
}) {
  const { money } = useFormato();
  const [pagos, setPagos] = useState(pagosIniciales);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [metodo, setMetodo] = useState<MetodoPago>("efectivo");
  const [monto, setMonto] = useState("");

  const totalCobrado = pagos.reduce((acc, p) => acc + (Number(p.monto) || 0), 0);
  const saldoPendiente = Math.max(0, Math.round((totalOT - totalCobrado) * 100) / 100);

  const handleCobrar = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const numMonto = Number(monto);
    if (isNaN(numMonto) || numMonto <= 0) {
      setErrorMsg("Monto inválido.");
      return;
    }

    startTransition(async () => {
      const res = await registrarPagoOT({
        otId,
        metodo,
        monto: numMonto,
      });

      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setPagos((prev) => [
          ...prev,
          {
            id: Math.random().toString(),
            metodo,
            monto: numMonto,
            fecha: new Date().toISOString(),
          },
        ]);
        setMonto("");
        setMostrarForm(false);
      }
    });
  };

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-accent" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Registro de Pagos</h3>
        </div>
        <div className="text-right">
          <span className="text-caption text-muted-foreground">Saldo Pendiente: </span>
          <span className={`text-sm font-extrabold ${saldoPendiente > 0 ? "text-red-600" : "text-emerald-600"}`}>
            {money(saldoPendiente)}
          </span>
        </div>
      </div>

      {/* Lista de Pagos */}
      {pagos.length > 0 ? (
        <div className="space-y-1.5">
          {pagos.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-xs font-medium">
              <span className="capitalize text-foreground">{p.metodo.replace("_", " ")}</span>
              <span className="font-bold text-emerald-600 tabular">
                +{money(Number(p.monto))}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic text-center py-2">Sin cobros registrados aún.</p>
      )}

      {/* Formulario / Botón nuevo pago */}
      {!mostrarForm ? (
        <button
          type="button"
          onClick={() => setMostrarForm(true)}
          className="flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-muted/30 text-xs font-semibold text-accent hover:bg-accent/5 transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Registrar Cobro</span>
        </button>
      ) : (
        <form onSubmit={handleCobrar} className="space-y-3 pt-2 border-t border-border">
          {errorMsg && <p className="text-xs font-bold text-red-600">{errorMsg}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-caption font-semibold text-muted-foreground block mb-1">
                Método de Cobro
              </label>
              <DesplegableModerno
                valor={metodo}
                onChange={(v) => setMetodo(v as MetodoPago)}
                opciones={OPCIONES_METODO}
                className="w-full"
                botonClassName="min-h-10 rounded-xl bg-muted/70 border-border/80 text-xs font-bold"
              />
            </div>

            <div>
              <label className="text-caption text-muted-foreground">Monto ($)</label>
              <input
                type="number"
                step="1"
                placeholder={saldoPendiente > 0 ? String(saldoPendiente) : "0"}
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="mt-1 min-h-10 w-full rounded-lg border border-border bg-muted px-3 text-xs font-medium text-foreground focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setMostrarForm(false)}
              className="min-h-9 rounded-lg px-3 text-xs font-semibold text-muted-foreground hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="min-h-9 rounded-lg bg-emerald-600 px-4 text-xs font-bold text-white shadow transition-transform active:scale-95 disabled:opacity-50"
            >
              {isPending ? "Guardando..." : "Confirmar Cobro"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
