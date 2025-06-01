const mongoose = require('mongoose');

const ManufacturerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    contactEmail: { type: String, required: true, unique: true },
    contactPhone: { type: String },
    alibabaProfileUrl: { type: String }, // Simulated
    reviews: { type: Number, default: 0 },
    lowSalesVolume: { type: Boolean, default: true }, // Simplified from "low sales"
    highProductAvailability: { type: Boolean, default: true },
    status: {
        type: String,
        enum: ['identified', 'contacted', 'positive_response', 'negative_response', 'deal_pending', 'deal_closed', 'campaign_active', 'feedback_provided'],
        default: 'identified',
    },
    outreachAttemptDate: { type: Date },
    responseDate: { type: Date },
    notes: { type: String },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Manufacturer', ManufacturerSchema);