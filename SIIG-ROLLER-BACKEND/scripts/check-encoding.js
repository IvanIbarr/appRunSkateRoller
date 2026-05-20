require('dotenv').config();
const {pool} = require('../src/config/database');

(async () => {
  const r = await pool.query(`
    SELECT
      current_setting('server_encoding') AS server,
      current_setting('client_encoding') AS client,
      pg_encoding_to_char(encoding) AS db_enc,
      datname
    FROM pg_database
    WHERE datname = current_database()
  `);
  console.log('encoding:', r.rows[0]);
  await pool.query("SET client_encoding TO 'UTF8'");
  const r2 = await pool.query("SELECT current_setting('client_encoding') AS client");
  console.log('after SET:', r2.rows[0]);
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
