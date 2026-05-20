const https = require('https');
const nodemailer = require('nodemailer');

/** Remitente plan gratuito Resend (dominio de prueba). */
const RESEND_FROM = 'roll3rskat3roll3r <onboarding@resend.dev>';

const buildSmtpMailer = () => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const rejectUnauthorizedEnv = process.env.SMTP_TLS_REJECT_UNAUTHORIZED;
  const rejectUnauthorized =
    rejectUnauthorizedEnv === undefined
      ? true
      : rejectUnauthorizedEnv !== 'false';

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {user, pass},
    tls: {rejectUnauthorized},
  });
};

const isResendConfigured = () => Boolean(process.env.RESEND_API_KEY?.trim());

const isSmtpConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const isEmailConfigured = () => isResendConfigured() || isSmtpConfigured();

const sendViaResendApi = ({to, subject, text}) => {
  const apiKey = process.env.RESEND_API_KEY.trim();
  const body = JSON.stringify({
    from: RESEND_FROM,
    to: [to],
    subject,
    text,
  });
  const insecure = process.env.RESEND_TLS_REJECT_UNAUTHORIZED === 'false';

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.resend.com',
        path: '/emails',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
        rejectUnauthorized: !insecure,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          let data = {};
          try {
            data = raw ? JSON.parse(raw) : {};
          } catch {
            /* ignore */
          }
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
            return;
          }
          const msg =
            (typeof data.message === 'string' && data.message) ||
            (typeof data.error === 'string' && data.error) ||
            `Resend HTTP ${res.statusCode}`;
          reject(new Error(msg));
        });
      },
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
};

/**
 * Envía correo: prioridad Resend API, respaldo SMTP.
 */
const sendEmail = async ({to, subject, text}) => {
  const recipient = String(to || '').trim();
  if (!recipient) {
    throw new Error('Destinatario vacío');
  }

  if (isResendConfigured()) {
    await sendViaResendApi({to: recipient, subject, text});
    return {provider: 'resend'};
  }

  const transporter = buildSmtpMailer();
  const from = process.env.SMTP_FROM?.trim() || RESEND_FROM;
  if (!transporter) {
    throw new Error('Correo no configurado (RESEND_API_KEY o SMTP_*)');
  }

  await transporter.sendMail({
    from,
    to: recipient,
    subject,
    text,
  });
  return {provider: 'smtp'};
};

module.exports = {
  RESEND_FROM,
  sendEmail,
  isEmailConfigured,
  isResendConfigured,
  isSmtpConfigured,
};
