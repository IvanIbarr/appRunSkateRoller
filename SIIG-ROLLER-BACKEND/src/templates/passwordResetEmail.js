const RESET_MINUTES_DEFAULT = 10;

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/**
 * Minutos restantes hasta expiración (mínimo 1).
 */
const minutesUntilExpiry = (expiresAt) => {
  if (!expiresAt) return RESET_MINUTES_DEFAULT;
  const ms = Number(expiresAt) - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return RESET_MINUTES_DEFAULT;
  return Math.max(1, Math.round(ms / 60000));
};

/**
 * Versión texto plano (fallback).
 */
const buildPasswordResetText = ({code, displayName, expiresMinutes}) => {
  const name = displayName || 'Roller';
  const mins = expiresMinutes ?? RESET_MINUTES_DEFAULT;
  return [
    `Hola ${name},`,
    '',
    'Recibimos una solicitud para restablecer la contraseña de tu cuenta en RunSkateRoller.',
    '',
    'Tu código de recuperación es:',
    '',
    String(code),
    '',
    `Este código expira en ${mins} minutos.`,
    '',
    'Si tú no solicitaste este cambio, puedes ignorar este correo. Tu contraseña seguirá siendo la misma.',
    '',
    'Equipo RunSkateRoller',
    'Rueda seguro, rueda lejos.',
  ].join('\n');
};

/**
 * Plantilla HTML responsive con estilos inline (Gmail, Outlook, móvil).
 */
const buildPasswordResetHtml = ({code, displayName, expiresMinutes}) => {
  const name = escapeHtml(displayName || 'Roller');
  const safeCode = escapeHtml(code);
  const mins = expiresMinutes ?? RESET_MINUTES_DEFAULT;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Recupera tu contraseña - RunSkateRoller</title>
</head>
<body style="margin:0;padding:0;background-color:#0B1022;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#0B1022;margin:0;padding:0;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:520px;width:100%;">
          <tr>
            <td align="center" style="padding-bottom:20px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#38BDF8 0%,#34D399 100%);background-color:#38BDF8;font-size:32px;line-height:64px;text-align:center;">
                    🛼
                  </td>
                </tr>
              </table>
              <p style="margin:12px 0 0;font-size:22px;font-weight:700;color:#F8FAFC;letter-spacing:0.5px;">RunSkateRoller</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#151B2E;border:1px solid rgba(56,189,248,0.35);border-radius:16px;padding:28px 24px;box-shadow:0 8px 24px rgba(0,0,0,0.35);">
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#F8FAFC;text-align:center;line-height:1.3;">
                Recupera tu contraseña
              </h1>
              <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#CBD5E1;">
                Hola <strong style="color:#34D399;">${name}</strong>,
              </p>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#94A3B8;">
                Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong style="color:#F8FAFC;">RunSkateRoller</strong>.
              </p>
              <p style="margin:0 0 10px;font-size:13px;color:#94A3B8;text-align:center;text-transform:uppercase;letter-spacing:1px;">
                Tu código de recuperación es
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding:8px 0 16px;">
                    <div style="display:inline-block;padding:16px 32px;background-color:#0F172A;border:2px solid #38BDF8;border-radius:12px;font-size:36px;font-weight:700;letter-spacing:8px;color:#38BDF8;font-family:'Courier New',Courier,monospace;">
                      ${safeCode}
                    </div>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 20px;font-size:14px;line-height:1.5;color:#FBBF24;text-align:center;">
                ⏱ Este código expira en <strong>${mins} minutos</strong>.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="background-color:rgba(52,211,153,0.08);border-left:4px solid #34D399;border-radius:8px;padding:12px 14px;">
                    <p style="margin:0;font-size:13px;line-height:1.55;color:#94A3B8;">
                      Si tú no solicitaste este cambio, puedes ignorar este correo. Tu contraseña seguirá siendo la misma.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:24px 8px 8px;">
              <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#38BDF8;">RunSkateRoller</p>
              <p style="margin:0;font-size:13px;color:#64748B;font-style:italic;">Rueda seguro, rueda lejos.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

const PASSWORD_RESET_SUBJECT = 'Tu código de recuperación - RunSkateRoller';

const buildPasswordResetEmail = ({code, displayName, expiresAt}) => {
  const expiresMinutes = minutesUntilExpiry(expiresAt);
  return {
    subject: PASSWORD_RESET_SUBJECT,
    text: buildPasswordResetText({code, displayName, expiresMinutes}),
    html: buildPasswordResetHtml({code, displayName, expiresMinutes}),
  };
};

module.exports = {
  PASSWORD_RESET_SUBJECT,
  buildPasswordResetEmail,
  buildPasswordResetText,
  buildPasswordResetHtml,
};
