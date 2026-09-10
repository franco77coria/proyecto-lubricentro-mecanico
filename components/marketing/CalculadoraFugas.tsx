"use client";

import { useState } from "react";
import { AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export function CalculadoraFugas() {
  const [autosPorDia, setAutosPorDia] = useState(12);
  const [litrosPerdidosSemana, setLitrosPerdidosSemana] = useState(6);
  const precioLitroPromedio = 16000;

  // Cálculo de pérdida:
  // Litros no cobrados: litrosPerdidosSemana * precioLitroPromedio * 4.3 semanas
  // Repuestos olvidados (filtros chicos, bombillas, mano de obra no anotada): autosPorDia * 25 días * $4.000 de fuga promedio no facturada
  const perdidaLitrosMensual = litrosPerdidosSemana * precioLitroPromedio * 4.3;
  const perdidaCargosOlvidadosMensual = autosPorDia * 24 * 3500;
  const perdidaTotalMensual = Math.round(perdidaLitrosMensual + perdidaCargosOlvidadosMensual);
  const perdidaTotalAnual = perdidaTotalMensual * 12;

  return (
    <section className="seccion">
      <div className="relative rounded-[1.5rem] sm:rounded-[2.5rem] bg-white/[0.03] p-1.5 sm:p-2 border border-white/10 shadow-[0_30px_70px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
        <div className="rounded-[calc(1.5rem-0.25rem)] sm:rounded-[calc(2.5rem-0.5rem)] bg-[#121216]/95 border border-white/[0.06] p-4 sm:p-12">
          <div className="max-w-2xl">
            <p className="t-eyebrow">Calculadora de Rentabilidad</p>
            <h2 className="t-titulo mt-4 text-balance text-white">
              ¿Cuánto dinero está goteando en tu fosa?
            </h2>
            <p className="mt-4 text-base sm:text-lg leading-relaxed text-white/70">
              Medio litro de más en cada cárter, un filtro que se sacó del estante sin anotar,
              un service cobrado de menos. Ajustá los números de tu taller y mirá lo que recuperás con Fierros.
            </p>
          </div>

          <div className="mt-8 sm:mt-10 grid gap-8 sm:gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            {/* Controles de Entrada */}
            <div className="space-y-4 sm:space-y-6">
              {/* Slider 1: Autos por día */}
              <div className="rounded-xl sm:rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 sm:p-5">
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="slider-autos" className="text-sm font-bold text-white">
                    Vehículos atendidos por día:
                  </label>
                  <span className="text-xl font-mono font-black text-accent">
                    {autosPorDia} <span className="text-xs text-white/50">autos/día</span>
                  </span>
                </div>
                <input
                  id="slider-autos"
                  type="range"
                  min="2"
                  max="40"
                  value={autosPorDia}
                  onChange={(e) => setAutosPorDia(Number(e.target.value))}
                  className="w-full accent-[#f97316] cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-white/40 mt-1 font-mono">
                  <span>2 autos</span>
                  <span>20 autos</span>
                  <span>40 autos</span>
                </div>
              </div>

              {/* Slider 2: Litros de aceite no registrados por semana */}
              <div className="rounded-xl sm:rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 sm:p-5">
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="slider-litros" className="text-sm font-bold text-white">
                    Litros o repuestos chicos olvidados por semana:
                  </label>
                  <span className="text-xl font-mono font-black text-amber-400">
                    {litrosPerdidosSemana} <span className="text-xs text-white/50">litros/sem</span>
                  </span>
                </div>
                <input
                  id="slider-litros"
                  type="range"
                  min="1"
                  max="25"
                  value={litrosPerdidosSemana}
                  onChange={(e) => setLitrosPerdidosSemana(Number(e.target.value))}
                  className="w-full accent-[#f59e0b] cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-white/40 mt-1 font-mono">
                  <span>1 litro</span>
                  <span>12 litros</span>
                  <span>25 litros</span>
                </div>
              </div>
            </div>

            {/* Tarjeta de Resultado: Impacto Financiero */}
            <div className="rounded-2xl bg-gradient-to-b from-orange-500/15 to-transparent border border-orange-500/30 p-6 sm:p-8 text-center flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 text-xs font-bold uppercase tracking-wider mb-4 border border-orange-500/30">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>Fuga estimada no registrada</span>
                </div>

                <p className="text-xs uppercase font-bold tracking-widest text-white/50">
                  Pérdida Anual Estimada
                </p>
                <p className="t-metrica mt-2 text-3xl sm:text-5xl font-black text-white font-mono tracking-tight">
                  ${perdidaTotalAnual.toLocaleString("es-AR")}
                </p>
                <p className="text-sm text-accent font-semibold mt-2">
                  ≈ ${perdidaTotalMensual.toLocaleString("es-AR")} por mes
                </p>
                <p className="text-xs text-white/60 mt-3 leading-relaxed">
                  Con el escáner de stock y el descuento por OT en Postgres, cada gota y cada filtro quedan cargados al vehículo antes de bajarlo del elevador.
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10">
                <Link
                  href="/login"
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-accent px-6 font-bold text-accent-foreground shadow-lg shadow-orange-500/20 hover:opacity-90 active:scale-[0.98] transition-all"
                >
                  <span>Cerrá las fugas de tu taller hoy</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
