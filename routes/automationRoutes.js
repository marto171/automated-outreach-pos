const express = require('express');
const router = express.Router();
const automationController = require('../controllers/automationController');

// UI for managing automation for a specific manufacturer
router.get('/manage/:manufacturerId', automationController.getAutomationPage);

// API/Action routes for automation
router.post('/product/:productId/generate-site', automationController.generateProductSite);
router.post('/product/:productId/launch-campaign', automationController.launchAdCampaign);

// Route to view the generated product site
router.get('/product-site/:productId', automationController.viewProductSite);
// Route to view campaign details
router.get('/campaign/:campaignId', automationController.viewCampaignDetails);


module.exports = router;