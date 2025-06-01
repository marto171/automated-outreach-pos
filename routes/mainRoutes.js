const express = require('express');
const router = express.Router();
const mainController = require('../controllers/mainController');

// UI Routes
router.get('/ui/dashboard', mainController.getDashboard);
router.get('/ui/sales-users', mainController.getSalesUsersPage);
router.post('/ui/sales-users/add', mainController.addSalesUser);


module.exports = router;