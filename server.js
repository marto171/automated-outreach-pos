require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const connectDB = require('./config/db');
const mainRoutes = require('./routes/mainRoutes');
const sourcingRoutes = require('./routes/sourcingRoutes');
const dealRoutes = require('./routes/dealRoutes');
const automationRoutes = require('./routes/automationRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes'); // Added feedback routes
const allAppRoutes = require('./routes/index'); // Main router

const app = express();

// Connect to Database
connectDB();

// EJS Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', allAppRoutes); // Use the main router

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});