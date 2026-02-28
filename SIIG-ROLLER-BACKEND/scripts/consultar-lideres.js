const {pool} = require('../src/config/database');

async function consultarLideres() {
  try {
    console.log('🔍 Consultando líderes del grupo...\n');

    // Consultar usuarios líderes
    const usuariosQuery = `
      SELECT u.id, u.email, u.tipo_perfil, u.alias, u.nombramiento, u.grupo_id, g.lider_id
      FROM usuarios u
      LEFT JOIN grupos g ON u.grupo_id = g.id
      WHERE u.tipo_perfil = 'liderGrupo' OR u.tipo_perfil = 'administrador'
      ORDER BY u.email;
    `;
    
    const usuariosResult = await pool.query(usuariosQuery);

    if (usuariosResult.rows.length === 0) {
      console.log('❌ No se encontraron líderes');
    } else {
      console.log('✅ Líderes encontrados:\n');
      usuariosResult.rows.forEach((usuario) => {
        console.log(`   Email: ${usuario.email}`);
        console.log(`   Tipo Perfil: ${usuario.tipo_perfil}`);
        console.log(`   Alias: ${usuario.alias || 'No tiene'}`);
        console.log(`   Nombramiento: ${usuario.nombramiento || 'No tiene'}`);
        console.log(`   Grupo ID: ${usuario.grupo_id || 'No tiene grupo'}`);
        console.log(`   Líder ID del Grupo: ${usuario.lider_id || 'No aplica'}`);
        console.log(`   Usuario ID: ${usuario.id}`);
        console.log(`   ¿Es líder principal?: ${usuario.lider_id === usuario.id ? '✅ SÍ' : '❌ NO'}`);
        console.log('   ---');
      });
    }

    // Consultar grupos y sus líderes
    const gruposQuery = `
      SELECT g.id, g.nombre_grupo, g.lider_id, u.email as lider_email
      FROM grupos g
      LEFT JOIN usuarios u ON g.lider_id = u.id
      ORDER BY g.nombre_grupo;
    `;
    
    const gruposResult = await pool.query(gruposQuery);

    if (gruposResult.rows.length > 0) {
      console.log('\n📊 Grupos encontrados:\n');
      gruposResult.rows.forEach((grupo) => {
        console.log(`   Grupo: ${grupo.nombre_grupo || 'Sin nombre'}`);
        console.log(`   Líder Principal (ID): ${grupo.lider_id}`);
        console.log(`   Email del Líder: ${grupo.lider_email || 'No encontrado'}`);
        console.log('   ---');
      });
    }

  } catch (error) {
    console.error('\n❌ Error al consultar líderes:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Ejecutar el script
consultarLideres()
  .then(() => {
    console.log('\n🎉 Consulta completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });

