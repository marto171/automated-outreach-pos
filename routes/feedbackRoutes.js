const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');

// UI for feedback management
router.get('/', feedbackController.getFeedbackPage); // Maps to /feedback/

// API/Action routes for feedback
router.post('/product/:productId/update-performance', feedbackController.updateProductPerformance);
router.post('/product/:productId/suggest-change', feedbackController.suggestProductChange);

module.exports = router;