const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const CONTENT = {
  es: {
    subject: '¡Bienvenido a RunSkateRoller!',
    preheader: 'Tu aventura sobre ruedas comienza ahora.',
    title: '¡Bienvenido a RunSkateRoller!',
    greeting: 'Hola Roller,',
    p1: '¡Bienvenido a RunSkateRoller!',
    p2: 'Tu aventura sobre ruedas comienza ahora.',
    p3: 'Nos emociona que te sumes a una comunidad creada para quienes aman patinar, recorrer la ciudad y descubrir nuevas rutas kilómetro a kilómetro.',
    p4: 'Desde hoy podrás registrar tus recorridos, medir tus avances, explorar rutas, compartir experiencias y competir sanamente con otros rollers en el ranking.',
    p5: 'Ponte los patines, ajusta tus ruedas y prepárate para rodar.',
    p6: 'Nos vemos en la ruta.',
    team: 'Equipo RunSkateRoller',
    tagline: 'Rueda seguro, rueda lejos.',
  },
  en: {
    subject: 'Welcome to RunSkateRoller!',
    preheader: 'Your wheels adventure starts now.',
    title: 'Welcome to RunSkateRoller!',
    greeting: 'Hello Roller,',
    p1: 'Welcome to RunSkateRoller!',
    p2: 'Your wheels adventure starts now.',
    p3: 'We are excited that you join a community built for those who love skating, exploring the city, and discovering new routes kilometer by kilometer.',
    p4: 'From today you can log your rides, track your progress, explore routes, share experiences, and compete fairly with other rollers on the leaderboard.',
    p5: 'Lace up your skates, tune your wheels, and get ready to roll.',
    p6: 'See you on the route.',
    team: 'RunSkateRoller Team',
    tagline: 'Skate safe, skate far.',
  },
};

const localeFromNacionalidad = (nacionalidad) => {
  const n = String(nacionalidad || '').trim().toLowerCase();
  if (n === 'inglés' || n === 'ingles' || n === 'english') return 'en';
  return 'es';
};

const buildWelcomeHtml = ({displayName, locale}) => {
  const lang = locale === 'en' ? 'en' : 'es';
  const c = CONTENT[lang];
  const name = escapeHtml(displayName || 'Roller');

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${escapeHtml(c.subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#0B1022;font-family:Arial,Helvetica,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    ${escapeHtml(c.preheader)}
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#0B1022;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:520px;">
          <tr>
            <td align="center" style="padding-bottom:20px;">
              <div style="width:64px;height:64px;border-radius:50%;background-color:#38BDF8;font-size:32px;line-height:64px;text-align:center;">🛼</div>
              <p style="margin:12px 0 0;font-size:22px;font-weight:700;color:#F8FAFC;">RunSkateRoller</p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#151B2E;border:1px solid rgba(56,189,248,0.35);border-radius:16px;padding:28px 24px;">
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#34D399;text-align:center;">${escapeHtml(c.title)}</h1>
              <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#CBD5E1;">${escapeHtml(c.greeting).replace('Roller', name)}</p>
              <p style="margin:0 0 12px;font-size:16px;line-height:1.6;color:#F8FAFC;font-weight:700;">${escapeHtml(c.p1)}</p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#38BDF8;">${escapeHtml(c.p2)}</p>
              <p style="margin:0 0 14px;font-size:14px;line-height:1.65;color:#94A3B8;">${escapeHtml(c.p3)}</p>
              <p style="margin:0 0 14px;font-size:14px;line-height:1.65;color:#94A3B8;">${escapeHtml(c.p4)}</p>
              <p style="margin:0 0 8px;font-size:14px;line-height:1.65;color:#CBD5E1;font-weight:600;">${escapeHtml(c.p5)}</p>
              <p style="margin:0;font-size:14px;line-height:1.65;color:#34D399;">${escapeHtml(c.p6)}</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:24px 8px;">
              <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#38BDF8;">${escapeHtml(c.team)}</p>
              <p style="margin:0;font-size:13px;color:#64748B;font-style:italic;">${escapeHtml(c.tagline)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

const buildWelcomeText = ({displayName, locale}) => {
  const lang = locale === 'en' ? 'en' : 'es';
  const c = CONTENT[lang];
  const name = displayName || 'Roller';
  const greeting = c.greeting.replace('Roller', name);
  return [
    greeting,
    '',
    c.p1,
    '',
    c.p2,
    '',
    c.p3,
    '',
    c.p4,
    '',
    c.p5,
    '',
    c.p6,
    '',
    c.team,
    c.tagline,
  ].join('\n');
};

const buildWelcomeEmail = ({displayName, nacionalidad, alias}) => {
  const locale = localeFromNacionalidad(nacionalidad);
  const name = (alias || displayName || 'Roller').toString().trim() || 'Roller';
  const c = CONTENT[locale];
  return {
    subject: c.subject,
    preheader: c.preheader,
    text: buildWelcomeText({displayName: name, locale}),
    html: buildWelcomeHtml({displayName: name, locale}),
    locale,
  };
};

module.exports = {
  buildWelcomeEmail,
  localeFromNacionalidad,
};
