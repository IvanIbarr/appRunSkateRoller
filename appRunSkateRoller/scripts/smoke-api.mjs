/**
 * Comprobaciones rápidas del backend (sin UI).
 * Uso:
 *   node scripts/smoke-api.mjs
 *   node scripts/smoke-api.mjs http://192.168.1.77:3001
 *   SMOKE_API_BASE=http://192.168.1.77:3001 node scripts/smoke-api.mjs
 */

const base = (process.env.SMOKE_API_BASE || process.argv[2] || 'http://localhost:3001').replace(
  /\/$/,
  '',
);

const checks = [
  {name: 'health', method: 'GET', path: '/health', expectOk: (r) => r.ok},
  {
    name: 'marketing sales (público)',
    method: 'GET',
    path: '/api/marketing/sales',
    expectOk: (r) => r.ok,
  },
  {
    name: 'rollertips listado activos',
    method: 'GET',
    path: '/api/rollertips?scope=active',
    expectOk: (r) => r.ok,
  },
  {
    name: 'raíz API (info)',
    method: 'GET',
    path: '/',
    expectOk: (r) => r.ok,
  },
];

async function main() {
  console.log(`Base: ${base}\n`);
  let failed = 0;
  for (const c of checks) {
    const url = `${base}${c.path}`;
    try {
      const r = await fetch(url, {method: c.method});
      const pass = c.expectOk(r);
      const body = await r.text();
      let snippet = body.slice(0, 120).replace(/\s+/g, ' ');
      if (snippet.length === 120) snippet += '…';
      if (pass) {
        console.log(`✓ ${c.name}  ${r.status}  ${url}`);
      } else {
        console.log(`✗ ${c.name}  ${r.status}  ${url}`);
        console.log(`  cuerpo: ${snippet}`);
        failed++;
      }
    } catch (e) {
      console.log(`✗ ${c.name}  ERROR  ${url}`);
      console.log(`  ${e?.message || e}`);
      failed++;
    }
  }
  console.log('');
  if (failed) {
    console.log(`Fallaron ${failed} comprobación(es). ¿Backend en marcha y firewall abierto?`);
    process.exit(1);
  }
  console.log('Todas las comprobaciones del API respondieron OK.');
  process.exit(0);
}

main();
