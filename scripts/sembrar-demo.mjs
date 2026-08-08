/**
 * Datos de demostración para el taller de prueba.
 *
 * Sirve para mirar las pantallas con contenido real: una lista vacía no dice
 * nada sobre si el diseño funciona. Todo se identifica con el prefijo DEMO en
 * las notas para poder borrarlo después.
 *
 *   node scripts/sembrar-demo.mjs           siembra
 *   node scripts/sembrar-demo.mjs --limpiar borra lo sembrado
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const linea of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = linea.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m) process.env[m[1]] ??= m[2].trim();
}

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const EMAIL = "prueba-ui@ejemplo.test";

const VEHICULOS = [
  { patente: "AB123CD", marca: "Volkswagen", modelo: "Amarok", anio: 2019, color: "Gris", km: 128400 },
  { patente: "RTF421", marca: "Ford", modelo: "EcoSport", anio: 2013, color: "Blanco", km: 210300 },
  { patente: "AD456FG", marca: "Toyota", modelo: "Hilux", anio: 2021, color: "Negro", km: 74250 },
  { patente: "MPK338", marca: "Chevrolet", modelo: "Corsa", anio: 2009, color: "Rojo", km: 302100 },
  { patente: "AE789HJ", marca: "Renault", modelo: "Kangoo", anio: 2020, color: "Blanco", km: 96800 },
  { patente: "A123BCD", marca: "Honda", modelo: "Titan", anio: 2022, color: "Negro", km: 18400 },
];

const CLIENTES = [
  { nombre: "Juan", apellido: "Pérez", telefono: "+5491155554444" },
  { nombre: "Marta", apellido: "Gómez", telefono: "+5491166663333" },
  { nombre: "Diego", apellido: "Sosa", telefono: "+5493514445555" },
];

const PRODUCTOS = [
  { nombre: "Filtro de aceite Mann W712", marca: "Mann", categoria: "Filtros", stock: 12, min: 5, precio: 12500 },
  { nombre: "Aceite Shell Helix 10W40", marca: "Shell", categoria: "Lubricantes", stock: 3, min: 8, precio: 28900, unidad: "litro" },
  { nombre: "Filtro de aire K&N", marca: "K&N", categoria: "Filtros", stock: 7, min: 4, precio: 21000 },
  { nombre: "Pastillas de freno Ferodo", marca: "Ferodo", categoria: "Frenos", stock: 2, min: 6, precio: 45600 },
  { nombre: "Bujía NGK Iridium", marca: "NGK", categoria: "Encendido", stock: 24, min: 10, precio: 8900 },
  { nombre: "Líquido de frenos DOT 4", marca: "Wagner", categoria: "Fluidos", stock: 9, min: 4, precio: 9800, unidad: "litro" },
  { nombre: "Correa de distribución Gates", marca: "Gates", categoria: "Motor", stock: 1, min: 3, precio: 78000 },
];

const ESTADOS = ["en_trabajo", "listo", "esperando_repuesto", "presupuesto", "entregado", "en_trabajo"];

async function tallerDelUsuario() {
  const { data } = await admin.auth.admin.listUsers();
  const user = data.users.find((u) => u.email === EMAIL);
  if (!user) throw new Error(`No existe el usuario ${EMAIL}`);
  const { data: perfil } = await admin.from("perfil").select("taller_id").eq("user_id", user.id).single();
  if (!perfil) throw new Error("El usuario no tiene taller");
  return perfil.taller_id;
}

async function limpiar(tallerId) {
  // Las OT y los vínculos caen por cascada desde vehículo y cliente.
  await admin.from("orden_trabajo").delete().eq("taller_id", tallerId);
  await admin.from("movimiento_stock").delete().eq("taller_id", tallerId);
  await admin.from("producto").delete().eq("taller_id", tallerId);
  await admin.from("vehiculo").delete().eq("taller_id", tallerId);
  await admin.from("cliente").delete().eq("taller_id", tallerId);
  console.log("Datos de demostración borrados.");
}

async function sembrar(tallerId) {
  await limpiar(tallerId);

  const { data: clientes } = await admin
    .from("cliente")
    .insert(CLIENTES.map((c) => ({ ...c, taller_id: tallerId })))
    .select("id");

  // El catálogo es global y ya está sembrado: se buscan los ids por nombre.
  const { data: marcas } = await admin.from("marca").select("id, nombre");
  const { data: modelos } = await admin.from("modelo").select("id, nombre, marca_id");
  const idMarca = (n) => marcas.find((m) => m.nombre === n)?.id ?? null;
  const idModelo = (marca, n) => {
    const mid = idMarca(marca);
    return modelos.find((m) => m.marca_id === mid && m.nombre === n)?.id ?? null;
  };

  const { data: vehiculos, error: eVeh } = await admin
    .from("vehiculo")
    .insert(
      VEHICULOS.map((v) => ({
        taller_id: tallerId,
        patente: v.patente,
        marca_id: idMarca(v.marca),
        modelo_id: idModelo(v.marca, v.modelo),
        anio: v.anio,
        color: v.color,
        km_actual: v.km,
        km_actualizado_en: new Date().toISOString(),
      })),
    )
    .select("id, patente");
  if (eVeh) throw new Error(`vehículos: ${eVeh.message}`);

  await admin.from("vehiculo_cliente").insert(
    vehiculos.map((v, i) => ({
      taller_id: tallerId,
      vehiculo_id: v.id,
      cliente_id: clientes[i % clientes.length].id,
    })),
  );

  const { data: productos, error: eProd } = await admin
    .from("producto")
    .insert(
      PRODUCTOS.map((p) => ({
        taller_id: tallerId,
        nombre: p.nombre,
        marca: p.marca,
        categoria: p.categoria,
        unidad: p.unidad ?? "unidad",
        stock_min: p.min,
        precio_venta: p.precio,
      })),
    )
    .select("id");
  if (eProd) throw new Error(`productos: ${eProd.message}`);

  // El stock entra por el libro de movimientos, nunca escribiendo la columna.
  await admin.from("movimiento_stock").insert(
    productos.map((p, i) => ({
      taller_id: tallerId,
      producto_id: p.id,
      tipo: "inicial",
      cantidad: PRODUCTOS[i].stock,
      costo_unitario: Math.round(PRODUCTOS[i].precio * 0.62),
    })),
  );

  const ahora = Date.now();
  for (let i = 0; i < ESTADOS.length; i++) {
    const veh = vehiculos[i % vehiculos.length];
    const { data: ot, error } = await admin
      .from("orden_trabajo")
      .insert({
        taller_id: tallerId,
        vehiculo_id: veh.id,
        cliente_id: clientes[i % clientes.length].id,
        estado: ESTADOS[i],
        tipo: i % 3 === 0 ? "mecanica" : "lubricentro",
        km_ingreso: 100000 + i * 4321,
        fecha_ingreso: new Date(ahora - i * 26 * 3600 * 1000).toISOString(),
      })
      .select("id")
      .single();
    if (error) throw new Error(`OT: ${error.message}`);

    await admin.from("ot_item").insert([
      {
        taller_id: tallerId,
        ot_id: ot.id,
        tipo: "mano_obra",
        descripcion: i % 2 ? "Service completo" : "Cambio de aceite y filtro",
        cantidad: 1,
        costo_unitario: 0,
        precio_unitario: 18000 + i * 6500,
      },
      {
        taller_id: tallerId,
        ot_id: ot.id,
        tipo: "repuesto",
        descripcion: PRODUCTOS[i % PRODUCTOS.length].nombre,
        producto_id: productos[i % productos.length].id,
        cantidad: 1,
        costo_unitario: Math.round(PRODUCTOS[i % PRODUCTOS.length].precio * 0.62),
        precio_unitario: PRODUCTOS[i % PRODUCTOS.length].precio,
      },
    ]);

    await admin.from("ot_nota").insert([
      { taller_id: tallerId, ot_id: ot.id, tipo: "anomalia", texto: "Hace un ruido al frenar en bajada", orden: 0 },
      { taller_id: tallerId, ot_id: ot.id, tipo: "descargo", texto: "Bujes de cremallera con juego y barra estabilizadora floja", orden: 0 },
    ]);
  }

  console.log(
    `Sembrado: ${vehiculos.length} autos, ${clientes.length} clientes, ${productos.length} productos, ${ESTADOS.length} órdenes.`,
  );
}

const tallerId = await tallerDelUsuario();
if (process.argv.includes("--limpiar")) await limpiar(tallerId);
else await sembrar(tallerId);
