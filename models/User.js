const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    areaOfExpertise: { type: String, required: true }, // e.g., 'electronics', 'apparel', 'home goods'
    salesSuccessRate: { type: Number, default: 0 }, // Could be a calculated metric
    // For simplicity, we'll assume sales are tracked per product linked to a manufacturer
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', UserSchema);