const Manufacturer = require('../models/Manufacturer');
const Product = require('../models/Product');
const Deal = require('../models/Deal');
const Campaign = require('../models/Campaign');
const User = require('../models/User'); // For expertise example

// Renders the main dashboard / homepage
exports.getDashboard = async (req, res) => {
    try {
        const manufacturerCount = await Manufacturer.countDocuments();
        const openDealsCount = await Deal.countDocuments({ status: { $in: ['offer_sent', 'response_positive', 'negotiating'] } });
        const closedDealsCount = await Deal.countDocuments({ status: 'closed_won' });
        const activeCampaignsCount = await Campaign.countDocuments({ status: 'active' });

        res.render('index', {
            title: 'Outreach Dashboard',
            manufacturerCount,
            openDealsCount,
            closedDealsCount,
            activeCampaignsCount,
            successMessage: req.query.successMessage,
            errorMessage: req.query.errorMessage,
        });
    } catch (error) {
        console.error("Error loading dashboard:", error);
        res.status(500).send("Error loading dashboard data.");
    }
};

// Renders page to manage/view "sales users" or "experts"
exports.getSalesUsersPage = async (req, res) => {
    try {
        const users = await User.find();
        res.render('sales-users', {
            title: 'Manage Sales Users',
            users: users,
            successMessage: req.query.successMessage,
            errorMessage: req.query.errorMessage,
        });
    } catch (error) {
        console.error("Error fetching sales users:", error);
        res.status(500).render('sales-users', {
            title: 'Manage Sales Users',
            users: [],
            errorMessage: 'Failed to load sales users.',
        });
    }
};

// Adds a new sales user
exports.addSalesUser = async (req, res) => {
    const { name, email, areaOfExpertise } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.redirect('/ui/sales-users?errorMessage=User with this email already exists.');
        }
        const newUser = new User({ name, email, areaOfExpertise });
        await newUser.save();
        res.redirect('/ui/sales-users?successMessage=Sales user added successfully.');
    } catch (error) {
        console.error("Error adding sales user:", error);
        res.redirect(`/ui/sales-users?errorMessage=Error adding sales user: ${error.message}`);
    }
};