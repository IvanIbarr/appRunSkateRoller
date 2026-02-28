const axios = require('axios');
require('dotenv').config();

// Primero necesitamos obtener el token de autenticación
async function probarEndpoint() {
  try {
    console.log('=== PROBANDO ENDPOINT GET_NOMBRE_GRUPO ===\n');

    // 1. Login para obtener token
    console.log('1. Iniciando sesión con ivanna@gmail.com...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'ivanna@gmail.com',
      password: 'Sacx2008'
    });

    if (!loginResponse.data.success || !loginResponse.data.token) {
      console.error('❌ Error al iniciar sesión:', loginResponse.data);
      return;
    }

    const token = loginResponse.data.token;
    console.log('✅ Login exitoso\n');

    // 2. Obtener nombre del grupo
    console.log('2. Obteniendo nombre del grupo...');
    const grupoResponse = await axios.get('http://localhost:3001/api/grupo/nombre', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Respuesta del endpoint:');
    console.log(JSON.stringify(grupoResponse.data, null, 2));
    console.log('');

    if (grupoResponse.data.success && grupoResponse.data.nombreGrupo) {
      console.log(`✅ Nombre del grupo encontrado: ${grupoResponse.data.nombreGrupo}`);
    } else {
      console.log('❌ No se encontró nombre del grupo');
      console.log('   Respuesta:', grupoResponse.data);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('   Respuesta del servidor:', error.response.data);
      console.error('   Status:', error.response.status);
    }
  }
}

probarEndpoint();

