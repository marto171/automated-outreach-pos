const Deal = require('../models/Deal');
const Manufacturer = require('../models/Manufacturer');
const Product = require('../models/Product'); // For creating initial product on deal close

// Get the Deal Menu page (list of deals)
exports.getDealsPage = async (req, res) => {
    try {
        const deals = await Deal.find().populate('manufacturer').sort({ createdAt: -1 });
        // Filter for deals that are in actionable states for the "Deal Menu"
        // Typically, these are 'response_positive' where a human needs to take action.
        const actionableDeals = deals.filter(deal => deal.status === 'response_positive' || deal.status === 'negotiating');

        res.render('deals', {
            title: 'Deal Menu & Management',
            deals: deals, // Show all deals for management
            actionableDeals: actionableDeals, // Specifically for the "Deal Menu" part
            successMessage: req.query.successMessage,
            errorMessage: req.query.errorMessage,
        });
    } catch (error) {
        console.error('Error fetching deals:', error);
        res.status(500).send("Error fetching deals");
    }
};

// Update deal status (e.g., to negotiating, closed_won, closed_lost)
exports.updateDealStatus = async (req, res) => {
    const { dealId } = req.params;
    const { status, phoneNumberCollected } = req.body; // New status from form

    try {
        const deal = await Deal.findById(dealId).populate('manufacturer');
        if (!deal) {
            return res.redirect('/ui/deals?errorMessage=Deal not found.');
        }

        const oldStatus = deal.status;
        deal.status = status;

        if (phoneNumberCollected && phoneNumberCollected.trim() !== "") {
            deal.phoneNumberCollected = phoneNumberCollected;
            // Optionally update manufacturer's phone if this is a more recent/accurate number
            if (deal.manufacturer && (!deal.manufacturer.contactPhone || deal.manufacturer.contactPhone !== phoneNumberCollected)) {
                deal.manufacturer.contactPhone = phoneNumberCollected;
            }
        }


        if (status === 'closed_won') {
            deal.closedDate = new Date();
            deal.manufacturer.status = 'deal_closed';
            // Trigger for post-deal automation can happen here or be a separate step
            // For PoC, we'll assume automation controller handles this based on 'deal_closed'

            // Create a placeholder product for the manufacturer if one doesn't exist
            // In a real app, you'd get product details.
            let product = await Product.findOne({ manufacturer: deal.manufacturer._id });
            if (!product) {
                product = new Product({
                    manufacturer: deal.manufacturer._id,
                    name: `Primary Product for ${deal.manufacturer.name}`, // Placeholder
                    category: 'General', // Placeholder, should be specified
                    description: 'Awaiting detailed product information post-deal.',
                });
                await product.save();
            }
        } else if (status === 'closed_lost') {
            deal.closedDate = new Date();
            deal.manufacturer.status = 'negative_response'; // Or a more specific 'deal_lost' status
        } else if (status === 'negotiating') {
            deal.manufacturer.status = 'deal_pending';
        }

        await deal.save();
        if (deal.manufacturer) {
            await deal.manufacturer.save();
        }


        res.redirect(`/ui/deals?successMessage=Deal status updated to ${status}.`);
    } catch (error) {
        console.error('Error updating deal status:', error);
        res.redirect(`/ui/deals?errorMessage=Error updating deal: ${error.message}`);
    }
};