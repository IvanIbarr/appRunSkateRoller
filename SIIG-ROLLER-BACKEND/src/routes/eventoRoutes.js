const express = require('express');
const router = express.Router();
const eventoController = require('../controllers/eventoController');
const {optionalAuth, authenticateToken} = require('../middleware/authMiddleware');

router.get('/', optionalAuth, eventoController.getEventos);
router.post('/', optionalAuth, eventoController.createEvento);
router.post('/:id/register', authenticateToken, eventoController.registerEvento);
router.delete('/:id/register', authenticateToken, eventoController.unregisterEvento);
router.put('/:id', eventoController.updateEvento);
router.delete('/:id', eventoController.deleteEvento);

module.exports = router;
