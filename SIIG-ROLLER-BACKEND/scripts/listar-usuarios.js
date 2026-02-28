const {pool} = require('../src/config/database');

async function listarUsuarios() {
  try {
    const result = await pool.query(
      'SELECT email, tipo_perfil, edad, sexo, nacionalidad, fecha_registro FROM usuarios ORDER BY fecha_registro DESC'
    );
    
    console.log('\n=== USUARIOS REGISTRADOS ===\n');
    console.log(`Total: ${result.rows.length} usuarios\n`);
    
    result.rows.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   Tipo de perfil: ${user.tipo_perfil}`);
      console.log(`   Edad: ${user.edad} años`);
      console.log(`   Sexo: ${user.sexo}`);
      console.log(`   Nacionalidad: ${user.nacionalidad}`);
      console.log(`   Fecha de registro: ${new Date(user.fecha_registro).toLocaleString('es-ES')}`);
      console.log('');
    });
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    await pool.end();
  }
}

listarUsuarios();

