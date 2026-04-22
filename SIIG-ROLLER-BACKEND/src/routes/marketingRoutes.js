const express = require('express');
const marketingSalesController = require('../controllers/marketingSalesController');
const {authenticateToken} = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/sales', marketingSalesController.listSales);
router.post('/sales', authenticateToken, marketingSalesController.createSale);
router.put('/sales/:id', authenticateToken, marketingSalesController.updateSale);
router.delete('/sales/:id', authenticateToken, marketingSalesController.deleteSale);

module.exports = router;
