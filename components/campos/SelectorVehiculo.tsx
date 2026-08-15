"use client";

import { Check, Loader2, X } from "lucide-react";
import { useEffect, useId, useState, useTransition } from "react";

import { useIsla } from "@/components/isla/IslaContext";
import {
  listarMarcas,
  listarModelos,
  listarMotorizaciones,
  proponerMarca,
  proponerModelo,
  proponerMotorizacion,
  type OpcionCatalogo,
} from "@/lib/actions/catalogo";

export interface ValorVehiculo {
  marcaId: string;
  modeloId: string;
  motorizacionId: string;
}

/** Valor centinela del `<option>` que abre el campo de texto libre. */
const OTRO = "__otro__";

const CLASE_CAMPO =
  "min-h-12 w-full rounded-2xl border border-border/80 bg-card px-3.5 pr-10 text-base font-semibold text-foreground shadow-sm focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none disabled:opacity-50 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23f97316%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:18px_18px] bg-[right_14px_center] bg-no-repeat transition-all";

/**
 * Lo que se trajo para un padre determinado.
 *
 * Guardar de qué padre son las opciones, y no solo las opciones, permite
 * DERIVAR tanto la lista visible como el "cargando…": si el id guardado no es
 * el que está elegido ahora, es que la respuesta todavía no llegó. Sin esto
 * harían falta dos `setState` sincrónicos dentro del efecto, que es justo lo
 * que dispara renders en cascada.
 */
interface Cache {
  padreId: string;
  items: OpcionCatalogo[];
}

const CACHE_VACIO: Cache = { padreId: "", items: [] };

/**
 * Marca → modelo → motorización, en cascada, con salida por OTROS.
 *
 * Tres decisiones que vale la pena explicar:
 *
 * 1. `<select>` nativo y no un combobox propio. En el celular abre la rueda del
 *    sistema, que es enorme y se maneja con el pulgar sucio; cualquier lista
 *    custom con `<div>`s es más linda en el escritorio y peor en la fosa.
 *
 * 2. La cascada pide los datos por nivel. Los 951 modelos del catálogo no viajan
 *    al navegador para filtrar 20.
 *
 * 3. OTROS nunca frena la carga. Lo que el mostrador escribe se da de alta como
 *    `pendiente` al instante y queda seleccionado: el auto entra igual y el
 *    dueño aprueba después. Un catálogo que obliga a esperar una aprobación
 *    para recibir un auto se abandona en la primera semana.
 *
 * El texto libre no queda como texto libre: se convierte en una fila del
 * catálogo. Es lo que permite que la ficha técnica de fluidos y filtros
 * enganche después — un `marca_texto` suelto no engancha con nada.
 */
export function SelectorVehiculo({
  marcas: marcasIniciales,
  valor,
  onChange,
}: {
  marcas: OpcionCatalogo[];
  valor: ValorVehiculo;
  onChange: (v: ValorVehiculo) => void;
}) {
  const [marcas, setMarcas] = useState(marcasIniciales);
  const [cacheModelos, setCacheModelos] = useState<Cache>(CACHE_VACIO);
  const [cacheMotores, setCacheMotores] = useState<Cache>(CACHE_VACIO);

  const modelos = cacheModelos.padreId === valor.marcaId ? cacheModelos.items : [];
  const motores = cacheMotores.padreId === valor.modeloId ? cacheMotores.items : [];
  const cargandoModelos = Boolean(valor.marcaId) && cacheModelos.padreId !== valor.marcaId;
  const cargandoMotores = Boolean(valor.modeloId) && cacheMotores.padreId !== valor.modeloId;

  // El flag `vigente` descarta la respuesta de una marca que el usuario ya
  // abandonó: sin eso, elegir dos marcas rápido puede dejar los modelos de la
  // primera colgados sobre la segunda.
  useEffect(() => {
    const marcaId = valor.marcaId;
    if (!marcaId) return;
    let vigente = true;
    listarModelos(marcaId).then((items) => vigente && setCacheModelos({ padreId: marcaId, items }));
    return () => {
      vigente = false;
    };
  }, [valor.marcaId]);

  useEffect(() => {
    const modeloId = valor.modeloId;
    if (!modeloId) return;
    let vigente = true;
    listarMotorizaciones(modeloId).then(
      (items) => vigente && setCacheMotores({ padreId: modeloId, items }),
    );
    return () => {
      vigente = false;
    };
  }, [valor.modeloId]);

  return (
    <div className="space-y-3">
      <Nivel
        etiqueta="Marca"
        placeholder="Elegir marca…"
        etiquetaOtro="Escribí la marca"
        opciones={marcas}
        valor={valor.marcaId}
        // Cambiar de marca invalida el modelo y la motorización: un modelo
        // pertenece a una marca, no se arrastra.
        onSeleccion={(id) => onChange({ marcaId: id, modeloId: "", motorizacionId: "" })}
        onProponer={async (nombre) => {
          const res = await proponerMarca(nombre);
          if (res.id) setMarcas(await listarMarcas());
          return res;
        }}
      />

      {/* La `key` remonta el nivel cuando cambia su padre. Es lo que resetea el
          modo texto sin un efecto que lo apague a mano. */}
      <Nivel
        key={`modelo-${valor.marcaId}`}
        etiqueta="Modelo"
        placeholder={valor.marcaId ? "Elegir modelo…" : "Elegí la marca primero"}
        etiquetaOtro="Escribí el modelo"
        opciones={modelos}
        valor={valor.modeloId}
        deshabilitado={!valor.marcaId}
        cargando={cargandoModelos}
        onSeleccion={(id) => onChange({ ...valor, modeloId: id, motorizacionId: "" })}
        onProponer={async (nombre) => {
          const res = await proponerModelo(valor.marcaId, nombre);
          if (res.id) {
            setCacheModelos({
              padreId: valor.marcaId,
              items: await listarModelos(valor.marcaId),
            });
          }
          return res;
        }}
      />

      <Nivel
        key={`motor-${valor.modeloId}`}
        etiqueta="Motorización"
        placeholder={valor.modeloId ? "Elegir motor…" : "Elegí el modelo primero"}
        etiquetaOtro="Escribí el motor (ej. 1.6 16v MSI)"
        opciones={motores}
        valor={valor.motorizacionId}
        deshabilitado={!valor.modeloId}
        cargando={cargandoMotores}
        onSeleccion={(id) => onChange({ ...valor, motorizacionId: id })}
        onProponer={async (nombre) => {
          const res = await proponerMotorizacion(valor.modeloId, nombre);
          if (res.id) {
            setCacheMotores({
              padreId: valor.modeloId,
              items: await listarMotorizaciones(valor.modeloId),
            });
          }
          return res;
        }}
      />

      {valor.modeloId && !cargandoMotores && motores.length === 0 && (
        <p className="text-caption text-muted-foreground">
          Este modelo todavía no tiene motorizaciones cargadas. Podés agregar la
          que corresponda con <strong>Otra…</strong> y queda para todo el taller.
        </p>
      )}
    </div>
  );
}

/** Un nivel de la cascada: el select y, si hace falta, el campo de texto. */
function Nivel({
  etiqueta,
  placeholder,
  etiquetaOtro,
  opciones,
  valor,
  deshabilitado = false,
  cargando = false,
  onSeleccion,
  onProponer,
}: {
  etiqueta: string;
  placeholder: string;
  etiquetaOtro: string;
  opciones: OpcionCatalogo[];
  valor: string;
  deshabilitado?: boolean;
  cargando?: boolean;
  onSeleccion: (id: string) => void;
  onProponer: (nombre: string) => Promise<{ id?: string; error?: string }>;
}) {
  const idCampo = useId();
  const { notificar } = useIsla();
  const [modoOtro, setModoOtro] = useState(false);
  const [texto, setTexto] = useState("");
  const [guardando, iniciar] = useTransition();

  function confirmar() {
    const limpio = texto.trim();
    if (!limpio) return;
    iniciar(async () => {
      const res = await onProponer(limpio);
      if (res.error || !res.id) {
        notificar({ tipo: "error", mensaje: res.error ?? "No se pudo agregar" });
        return;
      }
      onSeleccion(res.id);
      notificar({
        tipo: "exito",
        mensaje: `${limpio} agregado — queda pendiente de aprobación`,
      });
      setModoOtro(false);
      setTexto("");
    });
  }

  if (modoOtro) {
    return (
      <div>
        <label htmlFor={idCampo} className="text-caption text-muted-foreground">
          {etiquetaOtro}
        </label>
        <div className="mt-1 flex gap-2">
          <input
            id={idCampo}
            autoFocus
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                confirmar();
              }
              if (e.key === "Escape") setModoOtro(false);
            }}
            maxLength={60}
            className={CLASE_CAMPO}
          />
          <button
            type="button"
            onClick={confirmar}
            disabled={guardando || !texto.trim()}
            aria-label={`Agregar ${etiqueta.toLowerCase()}`}
            className="grid min-h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-white transition-transform active:scale-95 disabled:opacity-50"
          >
            {guardando ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Check className="h-4 w-4" aria-hidden />
            )}
          </button>
          <button
            type="button"
            onClick={() => setModoOtro(false)}
            aria-label="Cancelar"
            className="grid min-h-11 w-11 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground transition-transform active:scale-95"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor={idCampo} className="text-caption text-muted-foreground">
        {etiqueta}
      </label>
      <select
        id={idCampo}
        value={valor}
        disabled={deshabilitado || cargando}
        onChange={(e) => {
          if (e.target.value === OTRO) setModoOtro(true);
          else onSeleccion(e.target.value);
        }}
        className={`mt-1 ${CLASE_CAMPO}`}
      >
        <option value="">{cargando ? "Cargando…" : placeholder}</option>
        {opciones.map((o) => (
          <option key={o.id} value={o.id}>
            {o.nombre}
            {o.detalle ? ` — ${o.detalle}` : ""}
            {o.pendiente ? " (sin aprobar)" : ""}
          </option>
        ))}
        {!deshabilitado && <option value={OTRO}>Otra… (no está en la lista)</option>}
      </select>
    </div>
  );
}
