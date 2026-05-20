const express = require('express');
const router = express.Router();
const eventoController = require('../controllers/eventoController');
const {optionalAuth} = require('../middleware/authMiddleware');

router.get('/', eventoController.getEventos);
router.post('/', optionalAuth, eventoController.createEvento);
router.put('/:id', eventoController.updateEvento);
router.delete('/:id', eventoController.deleteEvento);

module.exports = router;
