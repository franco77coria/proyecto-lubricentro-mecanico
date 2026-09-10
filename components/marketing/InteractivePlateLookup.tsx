"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Droplets, CheckCircle, Car } from "lucide-react";
import { PlacaPatente } from "@/components/ui/PlacaPatente";

interface FichaVehiculo {
  marca: string;
  modelo: string;
  anio: string;
  motor: string;
  carterLitros: number;
  viscosidad: string;
  norma: string;
  intervaloService: string;
  puntosClave: string[];
  ultimoService: string;
  kmUltimoService: string;
}

const BASE_DEMO: Record<string, FichaVehiculo> = {
  AE789CD: {
    marca: "Toyota",
    modelo: "Hilux 2.8 D-4D 4x4",
    anio: "2021",
    motor: "1GD-FTV Diesel Intercooler",
    carterLitros: 7.5,
    viscosidad: "SAE 5W-30",
    norma: "Toyota OEM / ACEA C2 / API SN",
    intervaloService: "Cada 10.000 km o 1 año",
    puntosClave: ["Aceite de motor (7.5L)", "Filtros de aceite, aire y gasoil", "Engrase de crucetas y tren delantero"],
    ultimoService: "Hace 4 meses",
    kmUltimoService: "38.500 km",
  },
  AF342XP: {
    marca: "Volkswagen",
    modelo: "Amarok 3.0 V6 Highline",
    anio: "2023",
    motor: "3.0 TDI V6 258 CV",
    carterLitros: 8.0,
    viscosidad: "SAE 5W-30 100% Sintético",
    norma: "Norma VW 507.00 / 504.00 LongLife",
    intervaloService: "Cada 10.000 km",
    puntosClave: ["Aceite sintético 507.00 (8.0L)", "Filtro de aceite y de polen", "Nivel de líquido de frenos"],
    ultimoService: "Hace 6 meses",
    kmUltimoService: "51.200 km",
  },
  RTF421: {
    marca: "Ford",
    modelo: "Ranger 3.2 TDCi Limited",
    anio: "2017",
    motor: "Duratorq TDCi 200 CV",
    carterLitros: 9.8,
    viscosidad: "SAE 5W-30 o 10W-40",
    norma: "Norma Ford WSS-M2C913-D",
    intervaloService: "Cada 10.000 km",
    puntosClave: ["Aceite motor (9.8L)", "Filtro de aire y habitáculo", "Revisión de correas y refrigerante"],
    ultimoService: "Hace 2 meses",
    kmUltimoService: "132.000 km",
  },
  AC112LK: {
    marca: "Fiat",
    modelo: "Cronos 1.3 Drive GSE",
    anio: "2022",
    motor: "Firefly 1.3 8V 99 CV",
    carterLitros: 3.5,
    viscosidad: "SAE 0W-20 o 5W-30",
    norma: "Fiat 9.55535-GS1",
    intervaloService: "Cada 10.000 km",
    puntosClave: ["Aceite sintético 0W-20 (3.5L)", "Filtros de aceite y aire", "Chequeo de bujías y frenos"],
    ultimoService: "Hace 8 meses",
    kmUltimoService: "29.000 km",
  },
};

export function InteractivePlateLookup() {
  const [patenteInput, setPatenteInput] = useState("AE789CD");
  const [patenteActiva, setPatenteActiva] = useState("AE789CD");

  const datos = BASE_DEMO[patenteActiva.replace(/\s+/g, "").toUpperCase()] || BASE_DEMO["AE789CD"];

  const handleBuscar = (chapa: string) => {
    const limpia = chapa.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    setPatenteInput(limpia);
    if (BASE_DEMO[limpia]) {
      setPatenteActiva(limpia);
    } else {
      // Fallback a Hilux pero mostrando la chapa escrita
      setPatenteActiva(limpia);
    }
  };

  return (
    <section className="seccion">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:items-center lg:gap-16">
        <div>
          <p className="t-eyebrow">Velocidad en Mostrador</p>
          <h2 className="t-titulo mt-6 text-balance text-zinc-950 font-black">
            Buscá por patente. Tené la ficha técnica en 1 segundo.
          </h2>
          <p className="mt-6 text-base sm:text-lg leading-relaxed text-zinc-600">
            Mientras el cliente baja del auto, ya sabés qué aceite lleva, cuántos litros entran
            en el cárter y qué mantenimiento le corresponde. Cero dudas, cero demoras.
          </p>

          {/* Chips de chapas de prueba rápida */}
          <div className="mt-8">
            <p className="text-xs uppercase tracking-wider font-bold text-zinc-500 mb-3">
              Probá con estas patentes reales:
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.keys(BASE_DEMO).map((chapa) => (
                <button
                  key={chapa}
                  type="button"
                  onClick={() => handleBuscar(chapa)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    patenteActiva === chapa
                      ? "bg-accent text-accent-foreground shadow-md shadow-orange-500/20 scale-105"
                      : "bg-white text-zinc-800 border border-black/10 hover:bg-zinc-50 shadow-xs"
                  }`}
                >
                  {chapa}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Maqueta Interactiva de Búsqueda y Ficha */}
        <div className="relative rounded-[1.5rem] sm:rounded-[2rem] bg-white/80 p-1.5 sm:p-2 border border-black/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.06)] backdrop-blur-2xl">
          <div className="rounded-[calc(1.5rem-0.25rem)] sm:rounded-[calc(2rem-0.375rem)] bg-white border border-black/[0.05] p-4 sm:p-7 shadow-xs">
            {/* Input con Icono de Búsqueda */}
            <div className="relative flex items-center mb-5 sm:mb-6">
              <Search className="absolute left-4 h-5 w-5 text-zinc-400" />
              <input
                type="text"
                value={patenteInput}
                onChange={(e) => handleBuscar(e.target.value)}
                placeholder="Ingresá una patente (ej: AE789CD)..."
                className="w-full min-h-12 pl-12 pr-4 rounded-xl bg-slate-50 border border-black/10 text-zinc-950 font-mono font-bold text-sm sm:text-base uppercase tracking-wider placeholder:text-zinc-400 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
              />
            </div>

            {/* Resultado Dinámico */}
            <AnimatePresence mode="wait">
              <motion.div
                key={patenteActiva}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 sm:space-y-5"
              >
                {/* Cabecera del Vehículo Encontrado */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 border-b border-black/[0.08] pb-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] sm:text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-emerald-600" /> Ficha Homologada
                      </span>
                      <span className="text-xs text-zinc-400 font-medium">{datos.anio}</span>
                    </div>
                    <h3 className="text-base sm:text-lg md:text-xl font-black text-zinc-950 mt-1">
                      {datos.marca} {datos.modelo}
                    </h3>
                    <p className="text-xs text-zinc-500 font-mono mt-0.5">{datos.motor}</p>
                  </div>
                  <div className="self-start sm:self-center shrink-0">
                    <PlacaPatente patente={patenteActiva} size="sm" className="sm:hidden" />
                    <PlacaPatente patente={patenteActiva} size="md" className="hidden sm:block" />
                  </div>
                </div>

                {/* Especificación de Lubricación (El dolor del lubricentro) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-xl bg-orange-50/80 border border-orange-200 p-3.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-orange-700 uppercase tracking-wider mb-1.5">
                      <Droplets className="h-4 w-4 text-orange-500" />
                      <span>Capacidad Cárter</span>
                    </div>
                    <p className="text-2xl font-black text-zinc-950 tracking-tight">
                      {datos.carterLitros}{" "}
                      <span className="text-sm font-semibold text-zinc-600">Litros</span>
                    </p>
                    <p className="text-xs text-zinc-800 font-semibold mt-1">{datos.viscosidad}</p>
                    <p className="text-[11px] text-zinc-500 truncate mt-0.5">{datos.norma}</p>
                  </div>

                  <div className="rounded-xl bg-slate-50 border border-black/[0.06] p-3.5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                        <Car className="h-4 w-4" />
                        <span>Historial Taller</span>
                      </div>
                      <p className="text-sm font-bold text-zinc-900">Último Service: {datos.ultimoService}</p>
                      <p className="text-xs text-zinc-500 font-mono mt-0.5">
                        Registrado a los {datos.kmUltimoService}
                      </p>
                    </div>
                    <div className="mt-2 text-[11px] text-emerald-700 font-semibold">
                      ✓ Cliente habitual del taller
                    </div>
                  </div>
                </div>

                {/* Puntos Clave del Service */}
                <div className="rounded-xl bg-slate-50 border border-black/[0.06] p-3.5">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="text-[11px] uppercase font-bold tracking-wider text-zinc-500">
                      Puntos Clave del Service (Ficha Oficial):
                    </p>
                    <span className="text-[10px] font-mono text-accent font-bold">
                      {datos.intervaloService}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    {datos.puntosClave.map((punto, i) => (
                      <div key={i} className="p-2 rounded-lg bg-white border border-black/[0.05] flex items-center gap-1.5 shadow-xs">
                        <span className="text-emerald-600 font-bold text-xs">✓</span>
                        <span className="text-zinc-800 font-medium text-xs leading-tight">{punto}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
