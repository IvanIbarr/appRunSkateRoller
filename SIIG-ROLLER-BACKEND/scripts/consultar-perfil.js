const {pool} = require('../src/config/database');

async function consultarPerfil() {
  try {
    const email = 'yunuem2018@gmail.com';
    
    console.log(`🔍 Consultando perfil para: ${email}\n`);

    const query = 'SELECT email, tipo_perfil, alias, nombramiento, grupo_id FROM usuarios WHERE email = $1';
    const result = await pool.query(query, [email]);

    if (result.rows.length === 0) {
      console.log('❌ Usuario no encontrado');
    } else {
      const usuario = result.rows[0];
      console.log('✅ Usuario encontrado:');
      console.log(`   Email: ${usuario.email}`);
      console.log(`   Tipo de Perfil: ${usuario.tipo_perfil || 'No definido'}`);
      console.log(`   Alias: ${usuario.alias || 'No tiene alias'}`);
      console.log(`   Nombramiento: ${usuario.nombramiento || 'No tiene nombramiento'}`);
      console.log(`   Grupo ID: ${usuario.grupo_id || 'No pertenece a un grupo'}`);
    }

  } catch (error) {
    console.error('\n❌ Error al consultar perfil:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Ejecutar el script
consultarPerfil()
  .then(() => {
    console.log('\n🎉 Consulta completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });

