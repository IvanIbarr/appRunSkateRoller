const express = require('express');
const router = express.Router();
const seguimientoController = require('../controllers/seguimientoController');
const {authenticateToken} = require('../middleware/authMiddleware');

// Rutas protegidas (requieren autenticación)
router.post('/create', authenticateToken, seguimientoController.createSeguimiento);
router.get('/active', authenticateToken, seguimientoController.getActiveSeguimientos);
router.get('/history', authenticateToken, seguimientoController.getHistory);
router.get('/stats/:id', authenticateToken, seguimientoController.getStats);
router.get('/user-stats', authenticateToken, seguimientoController.getUserStats);
router.get('/leaderboard', authenticateToken, seguimientoController.getLeaderboard);
router.post('/:id/finish', authenticateToken, seguimientoController.finishSeguimiento);
router.post('/location-point', authenticateToken, seguimientoController.addLocationPoint);

// Ruta pública para ver seguimiento compartido (no requiere autenticación)
router.get('/:id', seguimientoController.getSeguimiento);

module.exports = router;

