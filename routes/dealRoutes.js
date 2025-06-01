const express = require('express');
const router = express.Router();
const dealController = require('../controllers/dealController');

// UI for deal menu
router.get('/ui/deals', dealController.getDealsPage);

// API/Action routes for deals
router.post('/:dealId/update-status', dealController.updateDealStatus);

module.exports = router;