const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const {testConnection} = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const eventoRoutes = require('./routes/eventoRoutes');
const staffRoutes = require('./routes/staffRoutes');
const grupoRoutes = require('./routes/grupoRoutes');
const aliasRoutes = require('./routes/aliasRoutes');
const seguimientoRoutes = require('./routes/seguimientoRoutes');
const rollertipsRoutes = require('./routes/rollertipsRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
})); // Seguridad HTTP
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.CORS_ORIGIN 
      ? process.env.CORS_ORIGIN.split(',')
      : ['http://localhost:3000', 'http://127.0.0.1:3000'];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Permitir todos en desarrollo
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({extended: true}));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Ruta de health check
app.get('/health', async (req, res) => {
  const dbConnected = await testConnection();
  res.json({
    status: 'ok',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/evento', eventoRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/grupo', grupoRoutes);
app.use('/api/alias', aliasRoutes);
app.use('/api/seguimiento', seguimientoRoutes);
app.use('/api/rollertips', rollertipsRoutes);

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    message: 'RunSkateRoller API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: {
        login: 'POST /api/auth/login',
        registro: 'POST /api/auth/registro',
        me: 'GET /api/auth/me',
      },
      chat: {
        getMessages: 'GET /api/chat/:chatType',
        createMessage: 'POST /api/chat',
      },
    },
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Error interno del servidor',
  });
});

// Iniciar servidor
const startServer = async () => {
  try {
    // Probar conexión a la base de datos
    await testConnection();

    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();

