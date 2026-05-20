const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const http = require('http');
const {Server} = require('socket.io');
require('dotenv').config();

const logger = require('./utils/fileLogger');
const {testConnection} = require('./config/database');
const {setIO} = require('./realtime/io');
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const eventoRoutes = require('./routes/eventoRoutes');
const staffRoutes = require('./routes/staffRoutes');
const grupoRoutes = require('./routes/grupoRoutes');
const aliasRoutes = require('./routes/aliasRoutes');
const seguimientoRoutes = require('./routes/seguimientoRoutes');
const rollertipsRoutes = require('./routes/rollertipsRoutes');
const marketingRoutes = require('./routes/marketingRoutes');
const clientLogRoutes = require('./routes/clientLogRoutes');

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
      ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
      : ['http://localhost:3000', 'http://127.0.0.1:3000'];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Permitir todos en desarrollo
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Client-Log-Secret'],
};

app.use(cors(corsOptions));
app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({extended: true}));

app.use(
  morgan(':method :url :status :res[content-length] - :response-time ms', {
    stream: logger.accessLogStream,
    skip: (req) => req.url === '/health',
  }),
);

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
app.use('/api/marketing', marketingRoutes);
app.use('/api/logs', clientLogRoutes);

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
      marketing: {
        listSales: 'GET /api/marketing/sales',
        createSale: 'POST /api/marketing/sales (JWT)',
        updateSale: 'PUT /api/marketing/sales/:id (JWT, dueño)',
        deleteSale: 'DELETE /api/marketing/sales/:id (JWT, dueño)',
      },
      logs: {
        clientIngest: 'POST /api/logs/client (bitácora front; ver CLIENT_LOG_INGEST)',
        files: 'Carpeta logs/ combined-*.log error-*.log (retención 3 días)',
      },
    },
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  logger.error(`Error no controlado: ${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method,
  });
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

    const HOST = process.env.BIND_HOST || '0.0.0.0';
    const httpServer = http.createServer(app);
    const io = new Server(httpServer, {
      cors: {
        origin: true,
        credentials: true,
        methods: ['GET', 'POST'],
      },
    });

    io.on('connection', (socket) => {
      // Por ahora un canal global para eventos.
      socket.join('events');
      socket.on('disconnect', () => {});
    });

    setIO(io);

    httpServer.listen(PORT, HOST, () => {
      logger.info(
        `Servidor en http://localhost:${PORT} (LAN: http://<tu-IP>:${PORT})`,
        {port: PORT, host: HOST, env: process.env.NODE_ENV || 'development'},
      );
      logger.info(`Bitácora en carpeta logs/ (rotación automática, retención 3 días)`);
      try {
        const {startEventoReminderScheduler} = require('./services/eventoReminderScheduler');
        startEventoReminderScheduler();
      } catch (schedErr) {
        logger.warn('Recordatorios de eventos no iniciados', {error: schedErr.message});
      }
    });
  } catch (error) {
    logger.error('Error al iniciar el servidor', {error: error.message, stack: error.stack});
    process.exit(1);
  }
};

startServer();

