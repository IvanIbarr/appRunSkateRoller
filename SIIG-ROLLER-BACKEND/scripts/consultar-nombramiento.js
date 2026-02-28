const {pool} = require('../src/config/database');

async function consultarNombramiento() {
  try {
    console.log('🔍 Consultando nombramiento de usuarios...\n');

    // Buscar por alias o email que contenga "alex" o "azcapo"
    const query = `
      SELECT 
        id,
        email,
        alias,
        nombramiento,
        tipo_perfil,
        grupo_id
      FROM usuarios
      WHERE LOWER(email) LIKE '%alex%' 
         OR LOWER(email) LIKE '%azcapo%'
         OR LOWER(alias) LIKE '%alex%'
         OR LOWER(alias) LIKE '%azcapo%'
      ORDER BY email;
    `;

    const result = await pool.query(query);

    if (result.rows.length === 0) {
      console.log('❌ No se encontraron usuarios que coincidan con "alex" o "azcapo"');
    } else {
      console.log(`✅ Se encontraron ${result.rows.length} usuario(s):\n`);
      
      result.rows.forEach((user, index) => {
        console.log(`${index + 1}. Usuario:`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Alias: ${user.alias || '(sin alias)'}`);
        console.log(`   Nombramiento: ${user.nombramiento || '(sin nombramiento)'}`);
        console.log(`   Tipo Perfil: ${user.tipo_perfil}`);
        console.log(`   Grupo ID: ${user.grupo_id || '(sin grupo)'}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('\n❌ Error al consultar:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Ejecutar el script
consultarNombramiento()
  .then(() => {
    console.log('\n🎉 Consulta completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error fatal:', error);
    process.exit(1);
  });

