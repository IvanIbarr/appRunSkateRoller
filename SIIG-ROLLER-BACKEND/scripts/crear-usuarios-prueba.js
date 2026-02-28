/**
 * Script para crear usuarios de prueba en la base de datos
 * Ejecutar con: node scripts/crear-usuarios-prueba.js
 */

require('dotenv').config();
const {pool} = require('../src/config/database');
const bcrypt = require('bcrypt');

const usuariosPrueba = [
  {
    email: 'admin@roller.com',
    password: 'admin123',
    edad: 30,
    cumpleaños: '1994-01-15',
    sexo: 'masculino',
    nacionalidad: 'español',
    tipoPerfil: 'administrador',
  },
  {
    email: 'lider@roller.com',
    password: 'lider123',
    edad: 28,
    cumpleaños: '1996-05-20',
    sexo: 'masculino',
    nacionalidad: 'español',
    tipoPerfil: 'liderGrupo',
  },
  {
    email: 'roller@roller.com',
    password: 'roller123',
    edad: 25,
    cumpleaños: '1999-08-10',
    sexo: 'femenino',
    nacionalidad: 'inglés',
    tipoPerfil: 'roller',
  },
];

async function crearUsuariosPrueba() {
  try {
    console.log('🔄 Creando usuarios de prueba...\n');

    for (const usuarioData of usuariosPrueba) {
      // Verificar si el usuario ya existe
      const checkQuery = 'SELECT id FROM usuarios WHERE email = $1';
      const checkResult = await pool.query(checkQuery, [usuarioData.email]);

      if (checkResult.rows.length > 0) {
        console.log(`⏭️  Usuario ${usuarioData.email} ya existe, omitiendo...`);
        continue;
      }

      // Hash de contraseña
      const passwordHash = await bcrypt.hash(usuarioData.password, 10);

      // Insertar usuario
      const insertQuery = `
        INSERT INTO usuarios (
          email, 
          password_hash, 
          edad, 
          cumpleaños, 
          sexo, 
          nacionalidad, 
          tipo_perfil,
          logo
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, email, tipo_perfil
      `;

      const values = [
        usuarioData.email,
        passwordHash,
        usuarioData.edad,
        usuarioData.cumpleaños,
        usuarioData.sexo,
        usuarioData.nacionalidad,
        usuarioData.tipoPerfil,
        null, // logo
      ];

      const result = await pool.query(insertQuery, values);
      const usuario = result.rows[0];

      console.log(`✅ Usuario creado: ${usuario.email} (${usuario.tipo_perfil})`);
    }

    console.log('\n✅ Proceso completado!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear usuarios:', error);
    process.exit(1);
  }
}

// Ejecutar
crearUsuariosPrueba();

