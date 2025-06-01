const express = require('express');
const router = express.Router();
const sourcingController = require('../controllers/sourcingController');

// UI for managing manufacturers
router.get('/ui/manufacturers', sourcingController.getManufacturersPage);

// API/Action routes for sourcing
router.post('/scan', sourcingController.scanForManufacturers); // Simulates scanning
router.post('/add-manufacturer', sourcingController.addManufacturer); // Manually add
router.post('/:manufacturerId/send-outreach', sourcingController.sendOutreachEmail);
router.post('/:manufacturerId/process-response', sourcingController.processEmailResponse); // Manually trigger response processing

module.exports = router;