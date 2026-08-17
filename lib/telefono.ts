/**
 * Normalización y Formato Telefónico Global E.164 (Zero-Dependency).
 *
 * Cumple con el estándar ITU-T E.164 y la restricción PostgreSQL:
 *   check (telefono is null or telefono ~ '^\+[1-9][0-9]{7,14}$')
 */

export interface MetadatoPais {
  iso: string;
  nombre: string;
  prefijo: string; // ej: "54", "52", "55", "34", "1"
  bandera: string;
  ejemplo: string;
}

export const PAISES_PRINCIPALES: MetadatoPais[] = [
  { iso: "AR", nombre: "Argentina", prefijo: "54", bandera: "🇦🇷", ejemplo: "11 2345-6789" },
  { iso: "BR", nombre: "Brasil", prefijo: "55", bandera: "🇧🇷", ejemplo: "11 91234-5678" },
  { iso: "MX", nombre: "México", prefijo: "52", bandera: "🇲🇽", ejemplo: "55 1234 5678" },
  { iso: "ES", nombre: "España", prefijo: "34", bandera: "🇪🇸", ejemplo: "612 34 56 78" },
  { iso: "US", nombre: "Estados Unidos", prefijo: "1", bandera: "🇺🇸", ejemplo: "(555) 123-4567" },
  { iso: "CL", nombre: "Chile", prefijo: "56", bandera: "🇨🇱", ejemplo: "9 1234 5678" },
  { iso: "CO", nombre: "Colombia", prefijo: "57", bandera: "🇨🇴", ejemplo: "300 123 4567" },
  { iso: "UY", nombre: "Uruguay", prefijo: "598", bandera: "🇺🇾", ejemplo: "99 123 456" },
  { iso: "PY", nombre: "Paraguay", prefijo: "595", bandera: "🇵🇾", ejemplo: "981 123456" },
  { iso: "PE", nombre: "Perú", prefijo: "51", bandera: "🇵🇪", ejemplo: "912 345 678" },
];

const PREFIJOS_ORDENADOS = [...PAISES_PRINCIPALES].sort(
  (a, b) => b.prefijo.length - a.prefijo.length,
);

export function normalizarTelefono(
  entrada: string | null | undefined,
  opciones?: { paisDefault?: string; esCelular?: boolean } | boolean,
): string | null {
  if (!entrada?.trim()) return null;

  const config =
    typeof opciones === "boolean"
      ? { esCelular: opciones, paisDefault: "AR" }
      : { esCelular: true, paisDefault: "AR", ...opciones };

  const limpio = entrada.trim();
  const tieneSignoMas = limpio.startsWith("+") || limpio.startsWith("00");
  let soloDigitos = limpio.replace(/\D/g, "");

  if (limpio.startsWith("00")) {
    soloDigitos = soloDigitos.slice(2);
  }

  let paisActivo = config.paisDefault || "AR";
  let digitosNacionales = soloDigitos;

  if (tieneSignoMas) {
    const prefijoDetectado = PREFIJOS_ORDENADOS.find((p) => soloDigitos.startsWith(p.prefijo));
    if (prefijoDetectado) {
      paisActivo = prefijoDetectado.iso;
      digitosNacionales = soloDigitos.slice(prefijoDetectado.prefijo.length);
    }
  } else {
    // Si no traía +, pero empieza con el prefijo explícito de Argentina 549 o 54
    if (soloDigitos.startsWith("54") && soloDigitos.length >= 10) {
      paisActivo = "AR";
      digitosNacionales = soloDigitos.slice(2);
    } else if (soloDigitos.startsWith("55") && soloDigitos.length >= 12) {
      paisActivo = "BR";
      digitosNacionales = soloDigitos.slice(2);
    } else if (soloDigitos.startsWith("52") && soloDigitos.length >= 12) {
      paisActivo = "MX";
      digitosNacionales = soloDigitos.slice(2);
    } else if (soloDigitos.startsWith("34") && soloDigitos.length === 11) {
      paisActivo = "ES";
      digitosNacionales = soloDigitos.slice(2);
    }
  }

  // Reglas específicas por país
  if (paisActivo === "AR") {
    if (digitosNacionales.startsWith("9") && digitosNacionales.length > 10) {
      digitosNacionales = digitosNacionales.slice(1);
    }
    if (digitosNacionales.startsWith("0")) {
      digitosNacionales = digitosNacionales.slice(1);
    }
    // Remover 15 después del código de área (2 a 4 dígitos)
    for (const largoArea of [2, 3, 4]) {
      if (
        digitosNacionales.length > largoArea + 2 &&
        digitosNacionales.slice(largoArea, largoArea + 2) === "15"
      ) {
        digitosNacionales =
          digitosNacionales.slice(0, largoArea) + digitosNacionales.slice(largoArea + 2);
        break;
      }
    }
    if (digitosNacionales.length < 8 || digitosNacionales.length > 12) return null;
    return `+54${config.esCelular ? "9" : ""}${digitosNacionales}`;
  }

  if (paisActivo === "MX") {
    if (digitosNacionales.startsWith("1") && digitosNacionales.length === 11) {
      digitosNacionales = digitosNacionales.slice(1);
    }
    if (digitosNacionales.length !== 10) return null;
    return `+52${digitosNacionales}`;
  }

  if (paisActivo === "BR") {
    if (digitosNacionales.startsWith("0")) digitosNacionales = digitosNacionales.slice(1);
    if (digitosNacionales.length < 10 || digitosNacionales.length > 11) return null;
    return `+55${digitosNacionales}`;
  }

  if (paisActivo === "US") {
    if (digitosNacionales.startsWith("1") && digitosNacionales.length === 11) {
      digitosNacionales = digitosNacionales.slice(1);
    }
    if (digitosNacionales.length !== 10) return null;
    return `+1${digitosNacionales}`;
  }

  if (paisActivo === "ES") {
    if (digitosNacionales.length !== 9) return null;
    return `+34${digitosNacionales}`;
  }

  // Regla general para otros países
  const prefijoObj = PAISES_PRINCIPALES.find((p) => p.iso === paisActivo);
  const prefijoFinal = prefijoObj?.prefijo || "54";
  const e164 = `+${prefijoFinal}${digitosNacionales}`;

  if (!/^\+[1-9][0-9]{7,14}$/.test(e164)) return null;

  return e164;
}

export function paraWhatsApp(e164: string): string {
  return e164.replace(/\D/g, "");
}

export function formatearTelefono(e164: string | null): string {
  if (!e164) return "";
  const d = e164.replace(/\D/g, "");

  // Argentina (+54)
  if (d.startsWith("549") && d.length >= 12) {
    const resto = d.slice(3);
    const largoArea = resto.startsWith("11") ? 2 : 3;
    const area = resto.slice(0, largoArea);
    const numero = resto.slice(largoArea);
    return `+54 9 ${area} ${numero.slice(0, -4)}-${numero.slice(-4)}`;
  }

  // México (+52)
  if (d.startsWith("52") && d.length === 12) {
    const resto = d.slice(2);
    return `+52 ${resto.slice(0, 2)} ${resto.slice(2, 6)} ${resto.slice(6)}`;
  }

  // España (+34)
  if (d.startsWith("34") && d.length === 11) {
    const resto = d.slice(2);
    return `+34 ${resto.slice(0, 3)} ${resto.slice(3, 5)} ${resto.slice(5, 7)} ${resto.slice(7)}`;
  }

  // Brasil (+55)
  if (d.startsWith("55") && (d.length === 12 || d.length === 13)) {
    const resto = d.slice(2);
    const ddd = resto.slice(0, 2);
    const num = resto.slice(2);
    return `+55 ${ddd} ${num.length === 9 ? num.slice(0, 5) + "-" + num.slice(5) : num.slice(0, 4) + "-" + num.slice(4)}`;
  }

  // USA (+1)
  if (d.startsWith("1") && d.length === 11) {
    const n = d.slice(1);
    return `+1 (${n.slice(0, 3)}) ${n.slice(3, 6)}-${n.slice(6)}`;
  }

  return e164;
}
