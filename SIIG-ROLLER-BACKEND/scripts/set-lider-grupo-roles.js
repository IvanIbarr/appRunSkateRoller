const {pool} = require('../src/config/database');

async function run() {
  const emails = ['sacx2003@gmail.com', 'roller@roller.com', 'lider@roller.com'];
  try {
    const updated = await pool.query(
      `UPDATE usuarios
       SET tipo_perfil = 'liderGrupo'
       WHERE email = ANY($1)
       RETURNING email, tipo_perfil`,
      [emails],
    );

    console.log(`ACTUALIZADOS=${updated.rowCount}`);
    for (const row of updated.rows) {
      console.log(`${row.email}:${row.tipo_perfil}`);
    }

    const verify = await pool.query(
      `SELECT email, tipo_perfil
       FROM usuarios
       WHERE email = ANY($1)
       ORDER BY email`,
      [emails],
    );
    console.log('VERIFICACION');
    for (const row of verify.rows) {
      console.log(`${row.email}:${row.tipo_perfil}`);
    }
  } catch (error) {
    console.error('Error actualizando roles:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

run();
