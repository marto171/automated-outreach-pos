const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    manufacturer: { type: mongoose.Schema.Types.ObjectId, ref: 'Manufacturer', required: true },
    name: { type: String, required: true },
    description: { type: String },
    category: { type: String, required: true, index: true }, // e.g., electronics, apparel
    websiteUrl: { type: String }, // URL of the auto-generated site
    currentSalesPerformance: { type: Number, default: 0 }, // A metric like units sold/month
    isUnderperforming: { type: Boolean, default: false },
    suggestedChanges: [{
        suggestion: String,
        dateSuggested: Date,
        reason: String,
    }],
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Product', ProductSchema);