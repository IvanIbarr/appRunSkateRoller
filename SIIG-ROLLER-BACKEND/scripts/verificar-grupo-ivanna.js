const {pool} = require('../src/config/database');

async function verificarGrupoIvanna() {
  try {
    console.log('=== VERIFICANDO GRUPO DE IVANNA ===\n');

    // 1. Buscar el usuario ivanna@gmail.com
    const usuarioQuery = `
      SELECT id, email, tipo_perfil, grupo_id, nombramiento
      FROM usuarios
      WHERE email = $1
    `;
    const usuarioResult = await pool.query(usuarioQuery, ['ivanna@gmail.com']);
    
    if (usuarioResult.rows.length === 0) {
      console.log('❌ Usuario ivanna@gmail.com no encontrado');
      return;
    }

    const usuario = usuarioResult.rows[0];
    console.log('✅ Usuario encontrado:');
    console.log(`   ID: ${usuario.id}`);
    console.log(`   Email: ${usuario.email}`);
    console.log(`   Tipo Perfil: ${usuario.tipo_perfil}`);
    console.log(`   Grupo ID: ${usuario.grupo_id || 'NULL'}`);
    console.log(`   Nombramiento: ${usuario.nombramiento || 'NULL'}`);
    console.log('');

    // 2. Si tiene grupo_id, buscar el grupo
    if (usuario.grupo_id) {
      const grupoQuery = `
        SELECT id, nombre_grupo, lider_id, created_at
        FROM grupos
        WHERE id = $1
      `;
      const grupoResult = await pool.query(grupoQuery, [usuario.grupo_id]);
      
      if (grupoResult.rows.length === 0) {
        console.log('❌ Grupo con ID', usuario.grupo_id, 'no encontrado');
        console.log('   El usuario tiene grupo_id pero el grupo no existe');
        return;
      }

      const grupo = grupoResult.rows[0];
      console.log('✅ Grupo encontrado:');
      console.log(`   ID: ${grupo.id}`);
      console.log(`   Nombre: ${grupo.nombre_grupo || 'NULL (sin nombre)'}`);
      console.log(`   Líder ID: ${grupo.lider_id}`);
      console.log(`   Creado: ${grupo.created_at}`);
      console.log('');

      // 3. Verificar el líder del grupo
      if (grupo.lider_id) {
        const liderQuery = `
          SELECT id, email, alias
          FROM usuarios
          WHERE id = $1
        `;
        const liderResult = await pool.query(liderQuery, [grupo.lider_id]);
        if (liderResult.rows.length > 0) {
          const lider = liderResult.rows[0];
          console.log('✅ Líder del grupo:');
          console.log(`   Email: ${lider.email}`);
          console.log(`   Alias: ${lider.alias || 'sin alias'}`);
        }
      }
    } else {
      console.log('❌ El usuario NO tiene grupo_id asignado');
      console.log('   Esto explica por qué no se muestra el nombre del grupo');
    }

    // 4. Buscar todos los grupos para ver si hay alguno con nombre "BaByRoller"
    const todosGruposQuery = `
      SELECT id, nombre_grupo, lider_id
      FROM grupos
      ORDER BY created_at DESC
    `;
    const todosGruposResult = await pool.query(todosGruposQuery);
    console.log('\n=== TODOS LOS GRUPOS EN LA BASE DE DATOS ===');
    if (todosGruposResult.rows.length === 0) {
      console.log('❌ No hay grupos en la base de datos');
    } else {
      todosGruposResult.rows.forEach((g, index) => {
        console.log(`${index + 1}. ID: ${g.id}, Nombre: ${g.nombre_grupo || 'SIN NOMBRE'}, Líder: ${g.lider_id}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

verificarGrupoIvanna();

