const express = require('express');
const {ingest} = require('../controllers/clientLogController');

const router = express.Router();

router.post('/client', express.json({limit: '48kb'}), ingest);

module.exports = router;
