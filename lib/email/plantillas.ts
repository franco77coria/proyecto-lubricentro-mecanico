/**
 * Plantillas HTML de correo electrónico transaccionales para Fierros.
 * Estilo: Executive Card — Moderno, minimalista, limpio y responsive.
 */

interface DatosBaseEmail {
  nombreUsuario?: string | null;
  nombreTaller?: string | null;
  appUrl?: string;
}

interface DatosAvisoTrial extends DatosBaseEmail {
  diasRestantes: number;
}

interface DatosPagoExitoso extends DatosBaseEmail {
  planNombre: string;
  montoARS: number;
  fechaVigencia?: string | null;
  idOperacion?: string | null;
}

interface DatosPagoFallido extends DatosBaseEmail {
  motivo?: string | null;
}

const URL_BASE_DEFECTO = process.env.NEXT_PUBLIC_APP_URL || "https://fierros.app";

/**
 * Envoltorio base para todos los correos de Fierros estilo Executive Card.
 */
function envoltorioBase({
  tituloPreheader,
  badgeEstado,
  badgeColor,
  titulo,
  subtitulo,
  cuerpoHtml,
  textoBoton,
  urlBoton,
  notaSecundaria,
}: {
  tituloPreheader: string;
  badgeEstado: string;
  badgeColor: "emerald" | "amber" | "rose" | "blue" | "slate";
  titulo: string;
  subtitulo: string;
  cuerpoHtml: string;
  textoBoton?: string;
  urlBoton?: string;
  notaSecundaria?: string;
}): string {
  const coloresBadge = {
    emerald: { bg: "#ecfdf5", border: "#a7f3d0", text: "#065f46" },
    amber: { bg: "#fffbeb", border: "#fde68a", text: "#92400e" },
    rose: { bg: "#fff1f2", border: "#fecdd3", text: "#9f1239" },
    blue: { bg: "#eff6ff", border: "#bfdbfe", text: "#1e40af" },
    slate: { bg: "#f1f5f9", border: "#cbd5e1", text: "#334155" },
  }[badgeColor];

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titulo}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f4f5;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    table {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      border: 0;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }
    @media only screen and (max-width: 600px) {
      .card-container {
        width: 100% !important;
        border-radius: 0 !important;
        border-left: none !important;
        border-right: none !important;
      }
      .card-content {
        padding: 24px 20px !important;
      }
      .btn-cta {
        display: block !important;
        width: 100% !important;
        text-align: center !important;
        box-sizing: border-box !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5;">
  <!-- Preheader oculto para vista previa en bandeja -->
  <div style="display: none; font-size: 1px; color: #f4f4f5; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ${tituloPreheader}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; width: 100%; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Contenedor Card Principal -->
        <table role="presentation" class="card-container" width="100%" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 16px; box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05); overflow: hidden;">
          
          <!-- Encabezado de Marca -->
          <tr>
            <td style="padding: 28px 32px 20px; border-bottom: 1px solid #f4f4f5;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="display: inline-flex; align-items: center; gap: 8px;">
                      <div style="background-color: #09090b; border-radius: 8px; padding: 6px 12px; display: inline-block;">
                        <span style="font-size: 15px; font-weight: 900; letter-spacing: 0.05em; color: #ffffff;">FIERROS</span>
                        <span style="display: inline-block; width: 6px; height: 6px; background-color: #ea580c; border-radius: 50%; margin-left: 3px; vertical-align: middle;"></span>
                      </div>
                    </div>
                  </td>
                  <td align="right">
                    <span style="font-size: 11px; font-weight: 600; letter-spacing: 0.06em; color: #71717a; text-transform: uppercase;">
                      Software de Taller
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Contenido Principal -->
          <tr>
            <td class="card-content" style="padding: 32px 32px 28px;">
              <!-- Badge de Estado -->
              <div style="display: inline-block; background-color: ${coloresBadge.bg}; border: 1px solid ${coloresBadge.border}; border-radius: 9999px; padding: 4px 12px; margin-bottom: 16px;">
                <span style="font-size: 11px; font-weight: 700; color: ${coloresBadge.text}; letter-spacing: 0.04em; text-transform: uppercase;">
                  ${badgeEstado}
                </span>
              </div>

              <!-- Título y Subtítulo -->
              <h1 style="margin: 0 0 10px; font-size: 22px; font-weight: 800; color: #09090b; line-height: 1.3;">
                ${titulo}
              </h1>
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #52525b;">
                ${subtitulo}
              </p>

              <!-- Bloque Dinámico -->
              ${cuerpoHtml}

              <!-- Botón de Acción Principal -->
              ${
                textoBoton && urlBoton
                  ? `
              <div style="margin: 28px 0 16px;">
                <a href="${urlBoton}" class="btn-cta" style="background-color: #09090b; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 28px; border-radius: 10px; display: inline-block; letter-spacing: 0.01em;">
                  ${textoBoton} &rarr;
                </a>
              </div>`
                  : ""
              }

              <!-- Nota de Tranquilidad / Reaseguro -->
              ${
                notaSecundaria
                  ? `
              <p style="margin: 20px 0 0; font-size: 13px; line-height: 1.5; color: #71717a;">
                ${notaSecundaria}
              </p>`
                  : ""
              }
            </td>
          </tr>

          <!-- Pie de la Card -->
          <tr>
            <td style="padding: 20px 32px; background-color: #fafafa; border-top: 1px solid #f4f4f5;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size: 12px; color: #71717a;">
                      ¿Necesitás soporte con tu taller?
                    </span>
                  </td>
                  <td align="right">
                    <a href="https://wa.me/5491123456789" style="font-size: 12px; font-weight: 600; color: #09090b; text-decoration: underline;">
                      Escribirnos por WhatsApp
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Pie de Página Institucional -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 580px; margin-top: 20px;">
          <tr>
            <td align="center" style="font-size: 11px; color: #a1a1aa; line-height: 1.6;">
              <p style="margin: 0 0 6px;">
                Fierros &bull; Sistema Operativo para Talleres Mecánicos y Lubricentros
              </p>
              <p style="margin: 0;">
                Este correo fue enviado de manera automática. Tus datos están protegidos bajo la Ley N° 25.326.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * 1. Email de Bienvenida — Día 1 del Trial de 7 días.
 */
export function renderEmailBienvenida({
  nombreUsuario,
  nombreTaller,
  appUrl = URL_BASE_DEFECTO,
}: DatosBaseEmail): { asunto: string; html: string } {
  const saludo = nombreUsuario ? `¡Hola ${nombreUsuario}!` : "¡Hola!";
  const tallerTexto = nombreTaller ? `para <strong>${nombreTaller}</strong>` : "para tu taller";

  const cuerpoHtml = `
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
      <p style="margin: 0 0 12px; font-size: 13px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.05em;">
        ¿Qué tenés habilitado durante tus 7 días de prueba?
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 6px 0; font-size: 14px; color: #334155;">
            <strong style="color: #10b981;">&bull;</strong> Órdenes de Trabajo (OT) y peritaje con checklist fosa.
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 14px; color: #334155;">
            <strong style="color: #10b981;">&bull;</strong> Historial de vehículos y clientes unificados por patente.
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 14px; color: #334155;">
            <strong style="color: #10b981;">&bull;</strong> Presupuestos con cálculo automático y envío por WhatsApp.
          </td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 14px; color: #334155;">
            <strong style="color: #10b981;">&bull;</strong> Control de caja diaria, señas y cobranzas en mostrador.
          </td>
        </tr>
      </table>
    </div>
  `;

  const html = envoltorioBase({
    tituloPreheader: "¡Tu cuenta en Fierros está lista! Tenés 7 días de prueba gratuita completa.",
    badgeEstado: "Prueba Activa • 7 Días",
    badgeColor: "emerald",
    titulo: "¡Bienvenido a Fierros!",
    subtitulo: `${saludo} Tu cuenta ${tallerTexto} ya está en marcha. Tenés 7 días de acceso irrestricto para digitalizar la fosa, cargar órdenes y emitir presupuestos sin necesidad de ingresar tarjeta.`,
    cuerpoHtml,
    textoBoton: "Ingresar a mi Tablero",
    urlBoton: `${appUrl}/tablero`,
    notaSecundaria: "Recordatorio: No te solicitamos tarjeta de crédito para iniciar. Durante estos 7 días podés comprobar cómo Fierros acelera tu taller.",
  });

  return {
    asunto: "¡Te damos la bienvenida a Fierros! Tu prueba de 7 días está activa",
    html,
  };
}

/**
 * 2. Aviso de Vencimiento de Trial — Faltan 48 horas (Día 5).
 */
export function renderEmailAvisoTrial({
  nombreUsuario,
  nombreTaller,
  diasRestantes,
  appUrl = URL_BASE_DEFECTO,
}: DatosAvisoTrial): { asunto: string; html: string } {
  const saludo = nombreUsuario ? `Hola ${nombreUsuario},` : "Hola,";
  const tallerTexto = nombreTaller ? `de <strong>${nombreTaller}</strong>` : "de tu taller";

  const cuerpoHtml = `
    <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding-bottom: 12px;">
            <span style="font-size: 13px; font-weight: 800; color: #92400e; text-transform: uppercase; letter-spacing: 0.05em;">
              Planes Disponibles para Continuar
            </span>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-top: 1px solid #fef3c7;">
            <div style="font-size: 14px; font-weight: 700; color: #1e293b;">
              Plan Inicial — $29.900 ARS/mes
            </div>
            <div style="font-size: 12px; color: #64748b;">
              Ideal para lubricentros chicos y mecánicos independientes. OTs ilimitadas, WhatsApp y clientes.
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-top: 1px solid #fef3c7;">
            <div style="font-size: 14px; font-weight: 700; color: #ea580c;">
              Plan Pro (Recomendado) — $44.900 ARS/mes
            </div>
            <div style="font-size: 12px; color: #64748b;">
              Todo lo del Inicial + Escaneo OCR de Cédula Verde con IA, diagnóstico asistido y control de stock.
            </div>
          </td>
        </tr>
      </table>
    </div>
  `;

  const html = envoltorioBase({
    tituloPreheader: `Te quedan ${diasRestantes} días de prueba gratuita en Fierros. Elegí tu plan para seguir operando sin cortes.`,
    badgeEstado: `Quedan ${diasRestantes} Días de Prueba`,
    badgeColor: "amber",
    titulo: `Tu período de prueba finaliza en ${diasRestantes} días`,
    subtitulo: `${saludo} Te escribimos para recordarte que la prueba gratuita de 7 días ${tallerTexto} concluye en 48 horas. Para que tu equipo no sufra interrupciones en la fosa ni pierdas el ritmo de trabajo, podés activar tu plan con tarjeta mediante Mercado Pago.`,
    cuerpoHtml,
    textoBoton: "Elegir Plan y Activar",
    urlBoton: `${appUrl}/suscripcion`,
    notaSecundaria: "Tus órdenes de trabajo, clientes e historiales vehiculares están completamente protegidos y no se borrarán.",
  });

  return {
    asunto: `Te quedan ${diasRestantes} días de prueba en Fierros`,
    html,
  };
}

/**
 * 3. Trial Vencido — Día 7.
 */
export function renderEmailTrialVencido({
  nombreUsuario,
  nombreTaller,
  appUrl = URL_BASE_DEFECTO,
}: DatosBaseEmail): { asunto: string; html: string } {
  const saludo = nombreUsuario ? `Hola ${nombreUsuario},` : "Hola,";
  const tallerTexto = nombreTaller ? `de <strong>${nombreTaller}</strong>` : "de tu taller";

  const cuerpoHtml = `
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
      <p style="margin: 0 0 8px; font-size: 14px; font-weight: 700; color: #0f172a;">
        ¿Qué ocurre con la información cargada?
      </p>
      <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #475569;">
        Todos tus datos están 100% seguros y respaldados. Al activar el Plan Inicial o Plan Pro, recuperás acceso inmediato a tus OTs, clientes, vehículos y presupuestos sin perder un solo registro.
      </p>
    </div>
  `;

  const html = envoltorioBase({
    tituloPreheader: "Tu período de prueba en Fierros ha finalizado. Reactivá tu taller con 1 clic.",
    badgeEstado: "Prueba Finalizada",
    badgeColor: "slate",
    titulo: "Tu prueba gratuita ha finalizado",
    subtitulo: `${saludo} El período de 7 días ${tallerTexto} ha llegado a su término y las funciones de carga de nuevas órdenes quedaron temporalmente en pausa.`,
    cuerpoHtml,
    textoBoton: "Reactivar mi Taller Ahora",
    urlBoton: `${appUrl}/suscripcion`,
    notaSecundaria: "Los pagos se procesan de forma segura a través de Mercado Pago (PCI-DSS Compliant) sin contratos de permanencia.",
  });

  return {
    asunto: "Tu período de prueba en Fierros ha finalizado",
    html,
  };
}

/**
 * 4. Pago y Suscripción Confirmada con Éxito.
 */
export function renderEmailPagoExitoso({
  nombreUsuario,
  nombreTaller,
  planNombre,
  montoARS,
  fechaVigencia,
  idOperacion,
  appUrl = URL_BASE_DEFECTO,
}: DatosPagoExitoso): { asunto: string; html: string } {
  const saludo = nombreUsuario ? `¡Excelente, ${nombreUsuario}!` : "¡Excelente!";
  const tallerTexto = nombreTaller ? `para <strong>${nombreTaller}</strong>` : "para tu taller";
  const montoFormateado = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(montoARS);

  const cuerpoHtml = `
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: #64748b;">Plan contratado:</td>
          <td align="right" style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #0f172a;">${planNombre}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: #64748b;">Monto mensual:</td>
          <td align="right" style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #059669;">${montoFormateado} ARS</td>
        </tr>
        ${
          fechaVigencia
            ? `
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: #64748b;">Próxima renovación:</td>
          <td align="right" style="padding: 6px 0; font-size: 13px; font-weight: 600; color: #334155;">
            ${new Date(fechaVigencia).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}
          </td>
        </tr>`
            : ""
        }
        ${
          idOperacion
            ? `
        <tr>
          <td style="padding: 6px 0; font-size: 12px; color: #94a3b8;">Comprobante MP:</td>
          <td align="right" style="padding: 6px 0; font-size: 12px; font-family: monospace; color: #64748b;">${idOperacion}</td>
        </tr>`
            : ""
        }
      </table>
    </div>
  `;

  const html = envoltorioBase({
    tituloPreheader: `Suscripción confirmada en Fierros. Tu taller está activo con el ${planNombre}.`,
    badgeEstado: "Suscripción Activa",
    badgeColor: "emerald",
    titulo: "¡Pago acreditado con éxito!",
    subtitulo: `${saludo} Tu suscripción a Fierros ${tallerTexto} fue confirmada y procesada correctamente mediante Mercado Pago. El sistema está 100% operativo sin límites.`,
    cuerpoHtml,
    textoBoton: "Ir al Tablero del Taller",
    urlBoton: `${appUrl}/tablero`,
    notaSecundaria: "Podés administrar tu forma de pago o descargar tus recibos en cualquier momento desde la sección de Facturación.",
  });

  return {
    asunto: "¡Suscripción confirmada en Fierros! Tu taller está activo",
    html,
  };
}

/**
 * 5. Pago Fallido / Rechazo de Tarjeta en Mercado Pago.
 */
export function renderEmailPagoFallido({
  nombreUsuario,
  nombreTaller,
  motivo,
  appUrl = URL_BASE_DEFECTO,
}: DatosPagoFallido): { asunto: string; html: string } {
  const saludo = nombreUsuario ? `Hola ${nombreUsuario},` : "Hola,";
  const tallerTexto = nombreTaller ? `de <strong>${nombreTaller}</strong>` : "de tu taller";

  const cuerpoHtml = `
    <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
      <p style="margin: 0 0 6px; font-size: 14px; font-weight: 700; color: #9f1239;">
        Detalle del inconveniente:
      </p>
      <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #881337;">
        ${motivo || "La entidad emisora de la tarjeta rechazó la operación automática (fondos insuficientes o plástico vencido)."}
      </p>
    </div>
  `;

  const html = envoltorioBase({
    tituloPreheader: "Aviso importante: No pudimos procesar el cobro de tu suscripción en Fierros.",
    badgeEstado: "Pago Pendiente",
    badgeColor: "rose",
    titulo: "Hubo un problema con tu cobro",
    subtitulo: `${saludo} Mercado Pago nos informó que no pudo procesar la renovación de la suscripción ${tallerTexto}. Para mantener el taller en marcha y no interrumpir el ingreso de vehículos a la fosa, actualizá tu medio de pago.`,
    cuerpoHtml,
    textoBoton: "Actualizar Medio de Pago",
    urlBoton: `${appUrl}/suscripcion`,
    notaSecundaria: "Tenés un período de gracia de 48 horas antes de que las herramientas del taller se suspendan.",
  });

  return {
    asunto: "Aviso: No pudimos procesar el cobro de tu suscripción en Fierros",
    html,
  };
}
