import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://dwvoqrpkqzmpffadhvnt.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3dm9xcnBrcXptcGZmYWRodm50Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjA2MTgxNiwiZXhwIjoyMTAxNjM3ODE2fQ.gBCL_QwZ6EueQGMpG3SVEzG0UEWBVxWI6UEaZFDlxUo";

const TALLER_ID = "7c7511bb-90a1-408b-b81f-d328246b374a";
const USER_ID = "c1a3ae1e-6810-4847-9be0-3d44b190a27c";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function normalizarPatente(raw) {
  if (!raw) return "";
  return raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

function normalizarNombre(raw) {
  if (!raw) return "";
  return raw.trim().charAt(0).toUpperCase() + raw.trim().slice(1);
}

async function run() {
  console.log("Iniciando importación para Taller Muñoz...");
  const rawData = fs.readFileSync("scripts/taller_munoz_data.json", "utf-8");
  const data = JSON.parse(rawData);

  // 1. Obtener catálogo de marcas
  const { data: marcasDb } = await supabase.from("marca").select("id, nombre");
  const marcasMap = new Map();
  for (const m of marcasDb || []) {
    marcasMap.set(m.nombre.toLowerCase(), m.id);
  }

  // 2. Extraer y crear clientes únicos
  console.log("Procesando clientes...");
  const clientesMap = new Map(); // nombreNormalizado -> clienteId
  const { data: clientesExistentes } = await supabase
    .from("cliente")
    .select("id, nombre")
    .eq("taller_id", TALLER_ID);

  for (const c of clientesExistentes || []) {
    if (c.nombre) clientesMap.set(c.nombre.toLowerCase().trim(), c.id);
  }

  const clientesNuevos = new Set();
  for (const o of data.ordenes) {
    if (o.cliente) {
      const nombreNorm = normalizarNombre(o.cliente);
      if (nombreNorm && !clientesMap.has(nombreNorm.toLowerCase())) {
        clientesNuevos.add(nombreNorm);
      }
    }
  }

  console.log(`Insertando ${clientesNuevos.size} clientes nuevos...`);
  const clientesArray = Array.from(clientesNuevos).map((nombre) => ({
    taller_id: TALLER_ID,
    nombre: nombre,
    telefono: "+5491163515966",
    notas: "Cliente histórico importado de Gestión Taller Muñoz",
  }));

  for (let i = 0; i < clientesArray.length; i += 50) {
    const chunk = clientesArray.slice(i, i + 50);
    const { data: insertados, error } = await supabase
      .from("cliente")
      .insert(chunk)
      .select("id, nombre");
    if (error) {
      console.error("Error insertando chunk de clientes:", error);
    } else {
      for (const c of insertados || []) {
        clientesMap.set(c.nombre.toLowerCase().trim(), c.id);
      }
    }
  }
  console.log(`Total clientes en mapa: ${clientesMap.size}`);

  // 3. Extraer y crear vehículos únicos
  console.log("Procesando vehículos...");
  const vehiculosMap = new Map(); // patenteNorm -> vehiculoId
  const { data: vehiculosExistentes } = await supabase
    .from("vehiculo")
    .select("id, patente_norm")
    .eq("taller_id", TALLER_ID);

  for (const v of vehiculosExistentes || []) {
    if (v.patente_norm) vehiculosMap.set(v.patente_norm, v.id);
  }

  const vehiculosAInsertar = [];
  const patentesVistas = new Set();

  for (const o of data.ordenes) {
    const patenteNorm = normalizarPatente(o.patente);
    if (!patenteNorm || vehiculosMap.has(patenteNorm) || patentesVistas.has(patenteNorm)) {
      continue;
    }
    patentesVistas.add(patenteNorm);

    let marcaId = null;
    if (o.vehiculo) {
      const vLow = o.vehiculo.toLowerCase();
      for (const [mNombre, mId] of marcasMap.entries()) {
        if (vLow.includes(mNombre)) {
          marcaId = mId;
          break;
        }
      }
    }

    vehiculosAInsertar.push({
      taller_id: TALLER_ID,
      patente: o.patente?.trim() || patenteNorm,
      marca_id: marcaId,
      km_actual: o.km || 0,
      notas: o.vehiculo ? `Modelo: ${o.vehiculo.trim()}` : null,
    });
  }

  // Auto comodín para las órdenes sin patente explícita
  if (!vehiculosMap.has("MUN001") && !patentesVistas.has("MUN001")) {
    vehiculosAInsertar.push({
      taller_id: TALLER_ID,
      patente: "MUN001",
      km_actual: 100000,
      notas: "Vehículo genérico taller",
    });
  }

  console.log(`Insertando ${vehiculosAInsertar.length} vehículos nuevos...`);
  for (let i = 0; i < vehiculosAInsertar.length; i += 50) {
    const chunk = vehiculosAInsertar.slice(i, i + 50);
    const { data: insertados, error } = await supabase
      .from("vehiculo")
      .insert(chunk)
      .select("id, patente_norm");
    if (error) {
      console.error("Error insertando chunk de vehículos:", error);
    } else {
      for (const v of insertados || []) {
        if (v.patente_norm) vehiculosMap.set(v.patente_norm, v.id);
      }
    }
  }
  console.log(`Total vehículos en mapa: ${vehiculosMap.size}`);

  const defaultVehiculoId = vehiculosMap.get("MUN001") || Array.from(vehiculosMap.values())[0];

  // 4. Crear Órdenes de Trabajo
  console.log("Insertando órdenes de trabajo...");
  const ordenesAInsertar = [];

  const total = data.ordenes.length;
  for (let idx = 0; idx < total; idx++) {
    const o = data.ordenes[idx];
    const patenteNorm = normalizarPatente(o.patente);
    let vehiculoId = patenteNorm ? vehiculosMap.get(patenteNorm) : null;
    if (!vehiculoId) vehiculoId = defaultVehiculoId;

    const clienteNombreNorm = o.cliente ? normalizarNombre(o.cliente) : null;
    const clienteId = clienteNombreNorm ? clientesMap.get(clienteNombreNorm.toLowerCase()) : null;

    let estado = "entregado";
    if (idx === 0) estado = "en_trabajo";
    else if (idx === 1) estado = "en_trabajo";
    else if (idx === 2) estado = "esperando_repuesto";
    else if (idx === 3) estado = "listo";
    else if (idx === 4) estado = "en_trabajo";
    else if (idx === 5) estado = "recibido";
    else if (idx === 6) estado = "listo";
    else if (idx === 7) estado = "aprobado";
    else if (idx < 14) estado = "presupuesto";

    const anomaliasTexto = (o.anomalias || []).join(" · ");
    const observaciones = [
      o.vehiculo ? `Vehículo: ${o.vehiculo.trim()}` : null,
      anomaliasTexto ? `Anomalías: ${anomaliasTexto}` : null,
      o.tercerizados ? `Tercerizados: ${o.tercerizados}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const fechaIngreso = o.fecha_ingreso ? new Date(o.fecha_ingreso).toISOString() : new Date().toISOString();
    const fechaEntrega = o.fecha_fin ? new Date(o.fecha_fin).toISOString() : null;

    ordenesAInsertar.push({
      taller_id: TALLER_ID,
      numero: o.ot_num || `OT-${1000 + idx}`,
      vehiculo_id: vehiculoId,
      cliente_id: clienteId || null,
      tipo: "mecanica",
      estado: estado,
      km_ingreso: o.km || 0,
      observaciones: observaciones || null,
      total_mano_obra: o.mano_obra || 0,
      total_repuestos: o.repuestos || 0,
      total: o.total || 0,
      fecha_ingreso: fechaIngreso,
      fecha_entrega: fechaEntrega,
      creado_por: USER_ID,
    });
  }

  let ordenesInsertadas = 0;
  for (let i = 0; i < ordenesAInsertar.length; i += 50) {
    const chunk = ordenesAInsertar.slice(i, i + 50);
    const { error } = await supabase.from("orden_trabajo").insert(chunk);
    if (error) {
      console.error(`Error en chunk ${i} de ordenes:`, error.message);
    } else {
      ordenesInsertadas += chunk.length;
    }
  }
  console.log(`Insertadas ${ordenesInsertadas} órdenes de trabajo correctamente!`);

  console.log("=== SEEDING COMPLETADO EXITOSAMENTE PARA TALLER MUÑOZ ===");
}

run();
