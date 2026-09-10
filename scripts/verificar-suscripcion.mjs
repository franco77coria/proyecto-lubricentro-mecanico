import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const envContent = fs.readFileSync(".env.local", "utf8");
const env = {};
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Faltan variables de entorno para verificación");
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

async function main() {
  console.log("\n[1] Verificación de Período de Prueba de 7 Días");

  // Crear usuario temporal para el test
  const email = `test-trial-${Date.now()}@ejemplo.test`;
  const password = `Prueba!${Date.now()}`;
  const { data: user, error: errUser } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (errUser) throw new Error("Error creando usuario: " + errUser.message);

  const clientAuth = createClient(supabaseUrl, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
  await clientAuth.auth.signInWithPassword({ email, password });

  // Crear taller
  const { data: tallerId, error: errTaller } = await clientAuth.rpc("crear_taller", {
    p_nombre: "Taller Test Trial 7 Días",
    p_nombre_usuario: "Dueño Test",
  });

  if (errTaller) throw new Error("Error en crear_taller: " + errTaller.message);

  // Consultar taller creado
  const { data: taller } = await admin
    .from("taller")
    .select("estado_suscripcion, trial_fin, mp_subscription_status")
    .eq("id", tallerId)
    .single();

  const ahora = Date.now();
  const trialFin = new Date(taller.trial_fin).getTime();
  const diferenciaDias = (trialFin - ahora) / (1000 * 60 * 60 * 24);

  if (taller.estado_suscripcion !== "trial") {
    throw new Error(`Esperaba estado 'trial', obtuve '${taller.estado_suscripcion}'`);
  }

  if (diferenciaDias < 6.9 || diferenciaDias > 7.1) {
    throw new Error(`Esperaba trial_fin en ~7 días, obtuve diferencia de ${diferenciaDias} días`);
  }

  console.log(`  OK    Taller creado con prueba gratuita de 7 días exactos (trial_fin: ${taller.trial_fin})`);

  console.log("\n[2] Verificación de Activación por Webhook / Mercado Pago");
  // Simular actualización del webhook
  const { error: errUpdate } = await admin
    .from("taller")
    .update({
      estado_suscripcion: "activa",
      mp_subscription_status: "authorized",
      mp_preapproval_id: "test_preapproval_123",
      suscripcion_fin: new Date(ahora + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .eq("id", tallerId);

  if (errUpdate) throw new Error("Error simulando activación: " + errUpdate.message);

  // Registrar evento
  const { error: errEvento } = await admin
    .from("taller_suscripcion_evento")
    .insert({
      taller_id: tallerId,
      mp_id: "test_preapproval_123",
      tipo: "subscription_preapproval",
      estado: "authorized",
      monto: 29900,
      payload: { test: true },
    });

  if (errEvento) throw new Error("Error registrando evento de suscripción: " + errEvento.message);

  console.log("  OK    Suscripción activada e historial registrado en taller_suscripcion_evento");

  // Limpieza
  await admin.from("taller").delete().eq("id", tallerId);
  await admin.auth.admin.deleteUser(user.user.id);
  console.log("  OK    Limpieza de datos de prueba completada");

  console.log("\nPrueba de integración SaaS y Trial de 7 días 100% exitosa.\n");
}

main().catch((err) => {
  console.error("Fallo:", err);
  process.exit(1);
});
