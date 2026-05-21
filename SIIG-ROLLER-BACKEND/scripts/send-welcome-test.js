/**
 * Envía el correo de bienvenida de prueba (sin registrar usuario).
 * Uso: node scripts/send-welcome-test.js [email] [nacionalidad]
 * Ejemplo: node scripts/send-welcome-test.js sacx2003@gmail.com español
 */

require('dotenv').config();
const {buildWelcomeEmail} = require('../src/templates/welcomeEmail');
const {sendEmail, isEmailConfigured} = require('../src/services/emailService');

async function main() {
  const to = (process.argv[2] || 'sacx2003@gmail.com').trim();
  const nacionalidad = (process.argv[3] || 'español').trim();

  if (!isEmailConfigured()) {
    console.error('❌ Email no configurado. Define RESEND_API_KEY en .env');
    process.exit(1);
  }

  const welcome = buildWelcomeEmail({
    displayName: 'Roller',
    nacionalidad,
    alias: 'Roller',
  });

  await sendEmail({
    to,
    subject: welcome.subject,
    text: welcome.text,
    html: welcome.html,
  });

  console.log(`✅ Correo de bienvenida enviado a ${to} (${welcome.locale})`);
  console.log(`   Asunto: ${welcome.subject}`);
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
