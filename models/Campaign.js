const mongoose = require('mongoose');

const CampaignSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    manufacturer: { type: mongoose.Schema.Types.ObjectId, ref: 'Manufacturer', required: true },
    generatedAdCopy: { type: String },
    generatedVideoScriptIdea: { type: String },
    status: { type: String, enum: ['generated', 'pending_launch', 'active', 'completed'], default: 'generated' },
    launchDate: { type: Date },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Campaign', CampaignSchema);