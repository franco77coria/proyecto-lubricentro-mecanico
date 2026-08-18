"use client";

import { Check, ChevronDown, Loader2, Plus, Search, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

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

/** Valor centinela del ítem que abre el campo de texto libre. */
const OTRO = "__otro__";

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
 * 1. Combobox custom con campo de búsqueda. Reemplaza el `<select>` nativo que
 *    se veía genérico. El listbox custom muestra detalles como cc/cv/combustible,
 *    soporta filtrado por teclado y tiene animaciones premium. En mobile abre
 *    como un panel con scroll y botones grandes para la fosa.
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
        placeholder="Buscar marca…"
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
        placeholder={valor.marcaId ? "Buscar modelo…" : "Elegí la marca primero"}
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
        placeholder={valor.modeloId ? "Buscar motor…" : "Elegí el modelo primero"}
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


/* ═══════════════════════════════════════════════════════════════════
   Nivel — Un nivel de la cascada: combobox custom + modo texto libre
   ═══════════════════════════════════════════════════════════════════ */

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

  // Combobox state
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [indiceActivo, setIndiceActivo] = useState(-1);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const inputBusquedaRef = useRef<HTMLInputElement>(null);
  const listaRef = useRef<HTMLDivElement>(null);

  // Filtrar opciones por búsqueda
  const opcionesFiltradas = useMemo(() => {
    if (!busqueda.trim()) return opciones;
    const q = busqueda.toLowerCase().trim();
    return opciones.filter(
      (o) =>
        o.nombre.toLowerCase().includes(q) ||
        (o.detalle && o.detalle.toLowerCase().includes(q)),
    );
  }, [opciones, busqueda]);

  // La opción seleccionada actual
  const seleccionActual = useMemo(
    () => opciones.find((o) => o.id === valor),
    [opciones, valor],
  );

  // Cerrar al hacer click fuera
  useEffect(() => {
    if (!abierto) return;
    function handleClickFuera(e: MouseEvent) {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) {
        setAbierto(false);
        setBusqueda("");
      }
    }
    document.addEventListener("mousedown", handleClickFuera);
    return () => document.removeEventListener("mousedown", handleClickFuera);
  }, [abierto]);

  // Focus en el input de búsqueda al abrir
  useEffect(() => {
    if (abierto && inputBusquedaRef.current) {
      inputBusquedaRef.current.focus();
    }
  }, [abierto]);

  // Scroll al item activo
  useEffect(() => {
    if (indiceActivo < 0 || !listaRef.current) return;
    const items = listaRef.current.querySelectorAll("[data-item]");
    items[indiceActivo]?.scrollIntoView({ block: "nearest" });
  }, [indiceActivo]);

  const abrir = useCallback(() => {
    if (deshabilitado || cargando) return;
    setAbierto(true);
    setBusqueda("");
    setIndiceActivo(-1);
  }, [deshabilitado, cargando]);

  const seleccionar = useCallback(
    (id: string) => {
      if (id === OTRO) {
        setModoOtro(true);
        setAbierto(false);
        setBusqueda("");
        return;
      }
      onSeleccion(id);
      setAbierto(false);
      setBusqueda("");
    },
    [onSeleccion],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const totalItems = opcionesFiltradas.length + 1; // +1 por "Otra…"

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setIndiceActivo((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
          break;
        case "ArrowUp":
          e.preventDefault();
          setIndiceActivo((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
          break;
        case "Enter":
          e.preventDefault();
          if (indiceActivo >= 0 && indiceActivo < opcionesFiltradas.length) {
            seleccionar(opcionesFiltradas[indiceActivo].id);
          } else if (indiceActivo === opcionesFiltradas.length) {
            seleccionar(OTRO);
          }
          break;
        case "Escape":
          e.preventDefault();
          setAbierto(false);
          setBusqueda("");
          break;
      }
    },
    [opcionesFiltradas, indiceActivo, seleccionar],
  );

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

  // ── Modo Texto Libre ──
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
            className="min-h-11 w-full rounded-xl border border-border/80 bg-card px-3.5 text-base font-medium text-foreground shadow-sm focus:border-accent focus:ring-1 focus:ring-accent focus:outline-none transition-all"
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

  // ── Combobox Custom ──
  return (
    <div ref={contenedorRef} className="relative">
      <label
        htmlFor={`${idCampo}-trigger`}
        className="text-caption font-medium text-muted-foreground mb-1 block"
      >
        {etiqueta}
      </label>

      {/* Trigger Button */}
      <button
        id={`${idCampo}-trigger`}
        type="button"
        onClick={() => (abierto ? setAbierto(false) : abrir())}
        disabled={deshabilitado || cargando}
        aria-expanded={abierto}
        aria-haspopup="listbox"
        className={`
          group relative flex w-full items-center min-h-11 rounded-xl border bg-card px-3.5 text-left
          transition-all duration-200 ease-out
          ${abierto
            ? "border-accent ring-2 ring-accent/20 shadow-md"
            : "border-border/60 shadow-sm hover:border-border hover:shadow-md"
          }
          ${deshabilitado ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
      >
        {cargando ? (
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando…
          </span>
        ) : seleccionActual ? (
          <span className="flex-1 truncate">
            <span className="text-sm font-semibold text-foreground">
              {seleccionActual.nombre}
            </span>
            {seleccionActual.detalle && (
              <span className="ml-2 text-xs text-muted-foreground">
                {seleccionActual.detalle}
              </span>
            )}
            {seleccionActual.pendiente && (
              <span className="ml-2 inline-flex items-center rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600">
                pendiente
              </span>
            )}
          </span>
        ) : (
          <span className="flex-1 text-sm text-muted-foreground">{placeholder}</span>
        )}

        <ChevronDown
          className={`
            ml-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200
            ${abierto ? "rotate-180" : ""}
          `}
        />
      </button>

      {/* Dropdown Panel */}
      {abierto && (
        <div
          className="
            absolute z-50 mt-1.5 w-full rounded-xl border border-border/60 bg-card
            shadow-lg shadow-black/8 overflow-hidden
            animate-[comboboxIn_150ms_ease-out]
          "
          role="listbox"
          aria-label={etiqueta}
        >
          {/* Search Input */}
          <div className="flex items-center gap-2 border-b border-border/40 px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputBusquedaRef}
              type="text"
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setIndiceActivo(-1);
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
              autoComplete="off"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => {
                  setBusqueda("");
                  inputBusquedaRef.current?.focus();
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Options List */}
          <div
            ref={listaRef}
            className="max-h-56 overflow-y-auto overscroll-contain py-1 scroll-smooth"
          >
            {opcionesFiltradas.length === 0 && (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                No se encontraron resultados
              </div>
            )}

            {opcionesFiltradas.map((opcion, i) => (
              <button
                key={opcion.id}
                type="button"
                data-item
                role="option"
                aria-selected={opcion.id === valor}
                onClick={() => seleccionar(opcion.id)}
                onMouseEnter={() => setIndiceActivo(i)}
                className={`
                  group/item flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors duration-100
                  ${i === indiceActivo ? "bg-accent/8" : ""}
                  ${opcion.id === valor ? "bg-accent/10" : "hover:bg-muted/50"}
                `}
              >
                {/* Check icon for selected */}
                <span className="w-4 shrink-0 flex items-center justify-center">
                  {opcion.id === valor && (
                    <Check className="h-3.5 w-3.5 text-accent" strokeWidth={3} />
                  )}
                </span>

                <span className="flex-1 min-w-0">
                  <span
                    className={`block text-sm truncate ${
                      opcion.id === valor ? "font-bold text-accent" : "font-medium text-foreground"
                    }`}
                  >
                    {opcion.nombre}
                  </span>
                  {opcion.detalle && (
                    <span className="block text-xs text-muted-foreground mt-0.5 truncate">
                      {opcion.detalle}
                    </span>
                  )}
                </span>

                {opcion.pendiente && (
                  <span className="inline-flex items-center rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 shrink-0">
                    pendiente
                  </span>
                )}
              </button>
            ))}

            {/* Separator + "Otra…" */}
            {!deshabilitado && (
              <>
                <div className="mx-3 my-1 border-t border-border/30" />
                <button
                  type="button"
                  data-item
                  role="option"
                  onClick={() => seleccionar(OTRO)}
                  onMouseEnter={() => setIndiceActivo(opcionesFiltradas.length)}
                  className={`
                    flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors duration-100
                    ${indiceActivo === opcionesFiltradas.length ? "bg-accent/8" : "hover:bg-muted/50"}
                  `}
                >
                  <span className="w-4 shrink-0 flex items-center justify-center">
                    <Plus className="h-3.5 w-3.5 text-accent" />
                  </span>
                  <span className="text-sm font-medium text-accent">
                    Agregar otra…
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
