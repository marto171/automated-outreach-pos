const express = require('express');
const router = express.Router();

const mainRoutes = require('./mainRoutes');
const sourcingRoutes = require('./sourcingRoutes');
const dealRoutes = require('./dealRoutes');
const automationRoutes = require('./automationRoutes');
const feedbackRoutes = require('./feedbackRoutes');

router.use('/', mainRoutes); // Handles root and general UI like /ui/dashboard
router.use('/sourcing', sourcingRoutes);
router.use('/deals', dealRoutes);
router.use('/automation', automationRoutes);
router.use('/feedback', feedbackRoutes);


// A simple catch-all for the root, redirecting to a dashboard
router.get('/', (req, res) => {
    res.redirect('/ui/dashboard');
});


module.exports = router;