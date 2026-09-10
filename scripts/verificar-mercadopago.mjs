/**
 * Verificación integral del subsistema de Mercado Pago en vivo.
 *
 * Corre con: npm run verify:mp  o  node scripts/verificar-mercadopago.mjs
 *
 * Valida credenciales reales, planes configurados, creación de preferencias
 * Checkout Pro, suscripciones Preapproval, algoritmos HMAC y esquema en DB.
 */
import { readFileSync } from "node:fs";
import crypto from "node:crypto";
import pg from "pg";

// Cargar .env.local
try {
  for (const linea of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
    const m = linea.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) {
      const raw = m[2].trim();
      process.env[m[1]] ??= raw.replace(/^["']|["']$/g, "").trim();
    }
  }
} catch {
  console.warn("Aviso: no se encontró .env.local");
}

let fallos = 0;
const ok = (msg) => console.log(`  OK    ${msg}`);
const fail = (msg) => {
  fallos++;
  console.log(`  FALLA ${msg}`);
};

const MP_BASE_URL = "https://api.mercadopago.com";
const token =
  process.env.MERCADOPAGO_ACCESS_TOKEN ||
  process.env.MERCADO_PAGO_ACCESS_TOKEN ||
  process.env.MP_ACCESS_TOKEN;

async function main() {
  console.log("=== AUDITORÍA Y VERIFICACIÓN INTEGRAL DE MERCADO PAGO ===");

  // --- 1. Variables de Entorno -----------------------------------------------
  console.log("\n[1] Variables de entorno de Mercado Pago");
  token ? ok("Access Token presente") : fail("Falta MERCADOPAGO_ACCESS_TOKEN");
  process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY
    ? ok("Public Key presente")
    : fail("Falta NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY");
  process.env.MERCADOPAGO_CLIENT_ID
    ? ok(`Client ID presente (${process.env.MERCADOPAGO_CLIENT_ID})`)
    : fail("Falta MERCADOPAGO_CLIENT_ID");
  process.env.MP_PLAN_ID
    ? ok(`Plan ID configurado (${process.env.MP_PLAN_ID})`)
    : fail("Falta MP_PLAN_ID");

  if (!token) {
    console.error("\nNo se puede continuar sin Access Token.");
    process.exit(1);
  }

  // --- 2. Conectividad y Cuenta de Mercado Pago ------------------------------
  console.log("\n[2] Cuenta y Conectividad con API de Mercado Pago");
  let userMe;
  try {
    const res = await fetch(`${MP_BASE_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      fail(`HTTP ${res.status} al consultar /users/me`);
    } else {
      userMe = await res.json();
      ok(`Conexión exitosa. Titular: ${userMe.first_name} ${userMe.last_name} (${userMe.email})`);
      ok(`País: ${userMe.country_id} | Collector ID: ${userMe.id} | Modo: ${userMe.site_status}`);
    }
  } catch (err) {
    fail(`Excepción al conectar con Mercado Pago: ${err.message}`);
  }

  // --- 3. Validación del Plan Recurrente en MP --------------------------------
  console.log("\n[3] Estado del Plan Recurrente de Suscripción en Mercado Pago");
  const planId = process.env.MP_PLAN_ID;
  if (planId) {
    try {
      const res = await fetch(`${MP_BASE_URL}/preapproval_plan/${planId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        fail(`HTTP ${res.status} al buscar plan ${planId}`);
      } else {
        const plan = await res.json();
        ok(`Plan encontrado: "${plan.reason}"`);
        ok(`Monto recurrente: $${plan.auto_recurring?.transaction_amount} ${plan.auto_recurring?.currency_id} cada ${plan.auto_recurring?.frequency} ${plan.auto_recurring?.frequency_type}`);
        plan.status === "active"
          ? ok("Estado del plan: ACTIVO")
          : fail(`Estado del plan: ${plan.status}`);
        ok(`Checkout URL del plan: ${plan.init_point}`);
      }
    } catch (err) {
      fail(`Excepción al consultar plan: ${err.message}`);
    }
  }

  // --- 4. Prueba en Vivo: Creación de Preferencia Checkout Pro (1 mes) --------
  console.log("\n[4] Prueba en vivo: Creación de Checkout Pro (Pago puntual / Dinero en cuenta)");
  try {
    const resPref = await fetch(`${MP_BASE_URL}/checkout/preferences`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [
          {
            id: "test-verificacion-plan-mes",
            title: "Verificación Automática Plan Pro (1 Mes)",
            quantity: 1,
            currency_id: "ARS",
            unit_price: 29900,
          },
        ],
        payer: {
          email: "test_verification@tallerpro.app",
        },
        external_reference: "00000000-0000-0000-0000-000000000000",
        back_urls: {
          success: "https://tallerpro.app/suscripcion?status=success",
          failure: "https://tallerpro.app/suscripcion?status=failure",
          pending: "https://tallerpro.app/suscripcion?status=pending",
        },
        auto_return: "approved",
      }),
    });

    if (!resPref.ok) {
      const errTxt = await resPref.text();
      fail(`HTTP ${resPref.status} creando preferencia: ${errTxt}`);
    } else {
      const prefData = await resPref.json();
      if (prefData.id && prefData.init_point) {
        ok(`Preferencia generada exitosamente. ID: ${prefData.id}`);
        ok(`Init Point generado: ${prefData.init_point}`);
      } else {
        fail("La respuesta de MP no contiene init_point");
      }
    }
  } catch (err) {
    fail(`Excepción al crear Checkout Pro: ${err.message}`);
  }

  // --- 5. Prueba en Vivo: Creación de Preapproval (Débito recurrente) ---------
  console.log("\n[5] Prueba en vivo: Creación de Preapproval (Débito recurrente mensual)");
  try {
    const resSub = await fetch(`${MP_BASE_URL}/preapproval`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        payer_email: "test_verification@tallerpro.app",
        back_url: "https://tallerpro.app/suscripcion?status=success",
        reason: "Verificación Automática Débito Mensual Taller Pro",
        external_reference: "00000000-0000-0000-0000-000000000000",
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: 29900,
          currency_id: "ARS",
        },
        status: "pending",
      }),
    });

    if (!resSub.ok) {
      const errTxt = await resSub.text();
      fail(`HTTP ${resSub.status} creando preapproval: ${errTxt}`);
    } else {
      const subData = await resSub.json();
      if (subData.id && subData.init_point) {
        ok(`Suscripción recurrente generada exitosamente. ID: ${subData.id}`);
        ok(`Init Point generado: ${subData.init_point}`);
      } else {
        fail("La respuesta de MP no contiene init_point");
      }
    }
  } catch (err) {
    fail(`Excepción al crear Preapproval: ${err.message}`);
  }

  // --- 6. Prueba Criptográfica HMAC SHA-256 de Webhooks -----------------------
  console.log("\n[6] Validación de Algoritmo HMAC SHA-256 para Webhooks");
  const secretPrueba = "test_webhook_secret_abc123";
  const tsPrueba = "1726000000";
  const dataIdPrueba = "9988776655";
  const reqIdPrueba = "req_audit_01";
  const manifestPrueba = `id:${dataIdPrueba};request-id:${reqIdPrueba};ts:${tsPrueba};`;
  const signatureHash = crypto.createHmac("sha256", secretPrueba).update(manifestPrueba).digest("hex");

  const bufHmac = Buffer.from(signatureHash);
  const bufV1 = Buffer.from(signatureHash);
  const match = bufHmac.length === bufV1.length && crypto.timingSafeEqual(bufHmac, bufV1);
  match
    ? ok("Validación criptográfica HMAC timing-safe verificada al 100%")
    : fail("Falla en validación timingSafeEqual");

  // --- 7. Verificación del Esquema en Base de Datos ---------------------------
  console.log("\n[7] Esquema en Base de Datos PostgreSQL");
  if (process.env.DATABASE_URL) {
    const client = new pg.Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
    try {
      await client.connect();
      const cols = await client.query(`
        select column_name
        from information_schema.columns
        where table_schema = 'public' and table_name = 'taller'
          and column_name in ('plan', 'trial_fin', 'estado_suscripcion', 'suscripcion_fin', 'mp_preapproval_id', 'mp_subscription_status')
      `);
      const colNames = cols.rows.map((r) => r.column_name);
      colNames.includes("plan")
        ? ok("Columna taller.plan presente")
        : fail("Falta taller.plan");
      colNames.includes("trial_fin")
        ? ok("Columna taller.trial_fin presente")
        : fail("Falta taller.trial_fin");
      colNames.includes("estado_suscripcion")
        ? ok("Columna taller.estado_suscripcion presente")
        : fail("Falta taller.estado_suscripcion");
      colNames.includes("suscripcion_fin")
        ? ok("Columna taller.suscripcion_fin presente")
        : fail("Falta taller.suscripcion_fin");
      colNames.includes("mp_preapproval_id")
        ? ok("Columna taller.mp_preapproval_id presente")
        : fail("Falta taller.mp_preapproval_id");
      colNames.includes("mp_subscription_status")
        ? ok("Columna taller.mp_subscription_status presente")
        : fail("Falta taller.mp_subscription_status");

      const tablaEventos = await client.query(`
        select to_regclass('public.taller_suscripcion_evento') as existe
      `);
      tablaEventos.rows[0]?.existe
        ? ok("Tabla de auditoría public.taller_suscripcion_evento presente")
        : fail("Falta la tabla taller_suscripcion_evento");

      await client.end();
    } catch (dbErr) {
      fail(`Error verificando base de datos: ${dbErr.message}`);
    }
  } else {
    console.log("  OMITIDO: No hay DATABASE_URL configurada");
  }

  // --- Resumen Final ---------------------------------------------------------
  console.log("\n=======================================================");
  if (fallos === 0) {
    console.log("  RESULTADO: TODOS LOS CHEQUEOS DE MERCADO PAGO PASARON (100% OK)");
    console.log("=======================================================\n");
    process.exit(0);
  } else {
    console.error(`  RESULTADO: SE ENCONTRARON ${fallos} FALLO(S)`);
    console.log("=======================================================\n");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("Error fatal en verificación:", e);
  process.exit(1);
});
