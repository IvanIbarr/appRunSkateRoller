const {pool} = require('../src/config/database');

async function verificarUsuarios() {
  try {
    console.log('=== VERIFICANDO USUARIOS Y SUS GRUPOS ===\n');

    const emails = ['ivanna@gmail.com', 'yunuem2018@gmail.com'];

    for (const email of emails) {
      console.log(`\n--- Verificando ${email} ---`);
      
      // 1. Buscar el usuario
      const usuarioQuery = `
        SELECT id, email, tipo_perfil, grupo_id, nombramiento
        FROM usuarios
        WHERE email = $1
      `;
      const usuarioResult = await pool.query(usuarioQuery, [email]);
      
      if (usuarioResult.rows.length === 0) {
        console.log(`❌ Usuario ${email} no encontrado`);
        continue;
      }

      const usuario = usuarioResult.rows[0];
      console.log(`✅ Usuario encontrado:`);
      console.log(`   ID: ${usuario.id}`);
      console.log(`   Tipo Perfil: ${usuario.tipo_perfil}`);
      console.log(`   Grupo ID: ${usuario.grupo_id || 'NULL'}`);
      console.log(`   Nombramiento: ${usuario.nombramiento || 'NULL'}`);

      // 2. Si tiene grupo_id, buscar el grupo
      if (usuario.grupo_id) {
        const grupoQuery = `
          SELECT id, nombre_grupo, lider_id
          FROM grupos
          WHERE id = $1
        `;
        const grupoResult = await pool.query(grupoQuery, [usuario.grupo_id]);
        
        if (grupoResult.rows.length === 0) {
          console.log(`❌ Grupo con ID ${usuario.grupo_id} no encontrado`);
        } else {
          const grupo = grupoResult.rows[0];
          console.log(`✅ Grupo encontrado:`);
          console.log(`   ID: ${grupo.id}`);
          console.log(`   Nombre: ${grupo.nombre_grupo || 'NULL (sin nombre)'}`);
          console.log(`   Líder ID: ${grupo.lider_id}`);
        }
      } else {
        console.log(`❌ El usuario NO tiene grupo_id asignado`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

verificarUsuarios();

