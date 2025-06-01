const Manufacturer = require('../models/Manufacturer');
const Deal = require('../models/Deal');
const { findPotentialManufacturers } = require('../services/manufacturerService');
const { sendEmail, generateOutreachEmailContent } = require('../services/emailService');
const geminiService = require('../services/geminiService');

// Page to view and add manufacturers (simulated sourcing)
exports.getManufacturersPage = async (req, res) => {
    try {
        const manufacturers = await Manufacturer.find().sort({ createdAt: -1 });
        res.render('manufacturers', {
            title: 'Manage Manufacturers',
            manufacturers,
            successMessage: req.query.successMessage,
            errorMessage: req.query.errorMessage,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error fetching manufacturers");
    }
};

// Simulate scanning for manufacturers
exports.scanForManufacturers = async (req, res) => {
    try {
        const newManufacturers = await findPotentialManufacturers(); // This now saves to DB
        if (newManufacturers.length > 0) {
            res.redirect('/ui/manufacturers?successMessage=Simulated scan complete. Found and saved new potential manufacturers.');
        } else {
            res.redirect('/ui/manufacturers?successMessage=Simulated scan complete. No new manufacturers found or all potentials already exist.');
        }
    } catch (error) {
        console.error('Error during simulated scan:', error);
        res.redirect(`/ui/manufacturers?errorMessage=Error during scan: ${error.message}`);
    }
};

// Manually add a manufacturer
exports.addManufacturer = async (req, res) => {
    const { name, contactEmail, contactPhone, alibabaProfileUrl, reviews, lowSalesVolume, highProductAvailability } = req.body;
    try {
        const newManufacturer = new Manufacturer({
            name,
            contactEmail,
            contactPhone,
            alibabaProfileUrl,
            reviews: parseInt(reviews) || 0,
            lowSalesVolume: lowSalesVolume === 'on', // Checkbox value
            highProductAvailability: highProductAvailability === 'on',
            status: 'identified'
        });
        await newManufacturer.save();
        res.redirect('/ui/manufacturers?successMessage=Manufacturer added successfully.');
    } catch (error) {
        console.error('Error adding manufacturer:', error);
        res.redirect(`/ui/manufacturers?errorMessage=Error adding manufacturer: ${error.message}`);
    }
};

// Send outreach email to a specific manufacturer
exports.sendOutreachEmail = async (req, res) => {
    const { manufacturerId } = req.params;
    const { companyTerms } = req.body; // Get terms from form

    if (!companyTerms || companyTerms.trim() === "") {
        return res.redirect(`/ui/manufacturers?errorMessage=Company terms are required to send an outreach email.`);
    }

    try {
        const manufacturer = await Manufacturer.findById(manufacturerId);
        if (!manufacturer) {
            return res.redirect('/ui/manufacturers?errorMessage=Manufacturer not found.');
        }
        if (manufacturer.status !== 'identified' && manufacturer.status !== 'negative_response') {
            return res.redirect(`/ui/manufacturers?errorMessage=Outreach already sent or in progress for ${manufacturer.name}. Current status: ${manufacturer.status}`);
        }

        const { subject, htmlContent } = generateOutreachEmailContent(manufacturer.name, companyTerms);
        await sendEmail(manufacturer.contactEmail, subject, htmlContent);

        manufacturer.status = 'contacted';
        manufacturer.outreachAttemptDate = new Date();
        await manufacturer.save();

        // Create a deal record
        const existingDeal = await Deal.findOne({ manufacturer: manufacturerId });
        if (existingDeal) {
            existingDeal.termsOffered = companyTerms;
            existingDeal.status = 'offer_sent';
            existingDeal.createdAt = new Date(); // Update timestamp if re-sending
            await existingDeal.save();
        } else {
            const newDeal = new Deal({
                manufacturer: manufacturerId,
                termsOffered: companyTerms,
                status: 'offer_sent',
            });
            await newDeal.save();
        }

        res.redirect('/ui/manufacturers?successMessage=Outreach email sent successfully.');
    } catch (error) {
        console.error('Error sending outreach email:', error);
        res.redirect(`/ui/manufacturers?errorMessage=Error sending email: ${error.message}`);
    }
};

// Simulate processing an email response (for PoC, this is manually triggered)
exports.processEmailResponse = async (req, res) => {
    const { manufacturerId } = req.params;
    const { responseText } = req.body;

    if (!responseText || responseText.trim() === "") {
        return res.redirect(`/ui/deals?errorMessage=Response text cannot be empty.`);
    }

    try {
        const manufacturer = await Manufacturer.findById(manufacturerId);
        const deal = await Deal.findOne({ manufacturer: manufacturerId });

        if (!manufacturer || !deal) {
            return res.redirect('/ui/deals?errorMessage=Manufacturer or Deal not found.');
        }

        const analysis = await geminiService.analyzeSentiment(responseText);
        manufacturer.responseDate = new Date();
        manufacturer.notes = (manufacturer.notes || "") + `\nResponse analyzed: ${analysis.sentiment}. Details: ${responseText}`;

        if (analysis.sentiment === 'positive') {
            manufacturer.status = 'positive_response';
            deal.status = 'response_positive';
            if (analysis.phoneNumber) {
                deal.phoneNumberCollected = analysis.phoneNumber;
                manufacturer.contactPhone = manufacturer.contactPhone || analysis.phoneNumber; // Update manufacturer phone if not set
            }
        } else if (analysis.sentiment === 'negative') {
            manufacturer.status = 'negative_response';
            deal.status = 'response_negative';
        } else { // Neutral
            // Keep status as 'contacted' or decide on a 'neutral_response' status
            manufacturer.notes += "\nSentiment: Neutral. Manual review suggested.";
            // Deal status might remain 'offer_sent' or move to a specific neutral state
        }

        await manufacturer.save();
        await deal.save();

        res.redirect(`/ui/deals?successMessage=Email response processed for ${manufacturer.name}. Sentiment: ${analysis.sentiment}.`);
    } catch (error) {
        console.error('Error processing email response:', error);
        res.redirect(`/ui/deals?errorMessage=Error processing response: ${error.message}`);
    }
};