const mongoose = require('mongoose');

const DealSchema = new mongoose.Schema({
    manufacturer: { type: mongoose.Schema.Types.ObjectId, ref: 'Manufacturer', required: true },
    termsOffered: { type: String },
    status: {
        type: String,
        enum: ['offer_sent', 'response_positive', 'response_negative', 'negotiating', 'closed_won', 'closed_lost'],
        default: 'offer_sent',
    },
    phoneNumberCollected: { type: String }, // Collected after positive response
    closedDate: { type: Date },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Deal', DealSchema);