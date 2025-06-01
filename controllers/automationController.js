const Manufacturer = require('../models/Manufacturer');
const Product = require('../models/Product');
const Campaign = require('../models/Campaign');
const Deal = require('../models/Deal');
const geminiService = require('../services/geminiService');

// Page to manage post-deal automation for a specific manufacturer/deal
exports.getAutomationPage = async (req, res) => {
    const { manufacturerId } = req.params;
    try {
        const manufacturer = await Manufacturer.findById(manufacturerId);
        if (!manufacturer) {
            return res.redirect('/ui/deals?errorMessage=Manufacturer not found.');
        }
        if (manufacturer.status !== 'deal_closed' && manufacturer.status !== 'campaign_active') {
            // Redirect if deal is not closed yet, or provide a message
            return res.redirect(`/ui/deals?errorMessage=Deal for ${manufacturer.name} is not closed yet. Automation can only start after a deal is closed.`);
        }

        const products = await Product.find({ manufacturer: manufacturerId });
        const campaigns = await Campaign.find({ manufacturer: manufacturerId }).populate('product');

        res.render('automation-dashboard', {
            title: `Automation for ${manufacturer.name}`,
            manufacturer,
            products,
            campaigns,
            successMessage: req.query.successMessage,
            errorMessage: req.query.errorMessage,
        });
    } catch (error) {
        console.error('Error loading automation page:', error);
        res.redirect(`/ui/deals?errorMessage=Error loading automation page: ${error.message}`);
    }
};


// Generate a website for a specific product
exports.generateProductSite = async (req, res) => {
    const { productId } = req.params;
    const { productName, productCategory } = req.body; // Allow overriding if needed

    try {
        const product = await Product.findById(productId).populate('manufacturer');
        if (!product) {
            return res.status(404).send("Product not found");
        }
        if (!product.manufacturer) {
            return res.status(404).send("Manufacturer for this product not found");
        }

        const pName = productName || product.name;
        const pCategory = productCategory || product.category;

        const siteContent = await geminiService.generateProductWebsiteContent(pName, pCategory, product.manufacturer.name);

        // For PoC, we'll store a "URL" that could link to a dynamically rendered page.
        // And update the product description with generated content.
        product.description = siteContent.productDescription; // Save generated description
        product.name = pName; // Update name if changed
        product.category = pCategory; // Update category if changed

        // In a real app, you might save the full 'siteContent' JSON or deploy actual files.
        // For this PoC, we'll just store a conceptual URL and the main content.
        product.websiteUrl = `/product-site/${product._id}`; // This will be a route to render the EJS template
        await product.save();

        // Store the generated content temporarily in session or pass directly to view if redirecting to the site itself
        // For now, we'll just redirect back with a success message.
        res.redirect(`/automation/manage/${product.manufacturer._id}?successMessage=Website content generated for ${product.name}. View at ${product.websiteUrl}`);
    } catch (error) {
        console.error('Error generating product site:', error);
        res.redirect(`/automation/manage/${req.body.manufacturerId || product.manufacturer._id}?errorMessage=Error generating site: ${error.message}`);
    }
};

// Render the dynamically generated product site
exports.viewProductSite = async (req, res) => {
    const { productId } = req.params;
    try {
        const product = await Product.findById(productId).populate('manufacturer');
        if (!product || !product.websiteUrl) {
            return res.status(404).send('Product site not found or not generated yet.');
        }
        if (!product.manufacturer) {
            return res.status(404).send('Manufacturer details missing for this product site.');
        }

        // Fetch the detailed content. For this PoC, we'll re-generate it if not stored directly.
        // Ideally, you'd store the `siteContent` object from `generateProductWebsiteContent`
        // with the product or in a separate 'WebsiteContent' model.
        // For simplicity here, we'll use the product's saved name, category, and description.
        // For a more dynamic demo, you might regenerate here if needed, or pull from a specific field.
        // Let's assume the description field holds the core content for the template.
        const siteContent = {
            pageTitle: `${product.name} - Official Site`,
            headline: `Discover ${product.name}`,
            tagline: `The best ${product.category} by ${product.manufacturer.name}`,
            productDescription: product.description || "Detailed product information coming soon.",
            features: product.features && product.features.length > 0 ? product.features : ["High Quality", "Innovative Design", "User-Friendly"], // Placeholder features
            callToAction: "Learn More & Order Today!",
            productName: product.name,
            manufacturerName: product.manufacturer.name,
        };


        res.render('product-site', {
            title: siteContent.pageTitle,
            content: siteContent, // Pass the whole object
            product: product, // Pass product object for more flexibility in template
        });
    } catch (error) {
        console.error('Error rendering product site:', error);
        res.status(500).send('Error displaying product site.');
    }
};


// Generate and "launch" (simulate) an ad campaign
exports.launchAdCampaign = async (req, res) => {
    const { productId } = req.params;
    const { targetAudience } = req.body;

    try {
        const product = await Product.findById(productId).populate('manufacturer');
        if (!product) {
            return res.status(404).send("Product not found");
        }

        const campaignAssets = await geminiService.generateCampaignAssets(product.name, product.category, targetAudience);

        const newCampaign = new Campaign({
            product: product._id,
            manufacturer: product.manufacturer._id,
            generatedAdCopy: JSON.stringify(campaignAssets.adCopy, null, 2), // Store as formatted JSON string
            generatedVideoScriptIdea: JSON.stringify(campaignAssets.promotionalVideoScriptIdea, null, 2),
            status: 'generated', // Mark as generated, "launch" would be next step
        });
        await newCampaign.save();

        // Update manufacturer and product status
        product.manufacturer.status = 'campaign_active';
        await product.manufacturer.save();

        res.redirect(`/automation/manage/${product.manufacturer._id}?successMessage=Campaign assets generated for ${product.name}.`);
    } catch (error) {
        console.error('Error launching ad campaign:', error);
        res.redirect(`/automation/manage/${req.body.manufacturerId || product.manufacturer._id}?errorMessage=Error generating campaign: ${error.message}`);
    }
};

// View details of a generated campaign
exports.viewCampaignDetails = async (req, res) => {
    const { campaignId } = req.params;
    try {
        const campaign = await Campaign.findById(campaignId).populate('product').populate('manufacturer');
        if (!campaign) {
            return res.status(404).send('Campaign not found.');
        }
        res.render('campaign-details', {
            title: `Campaign for ${campaign.product.name}`,
            campaign: campaign,
            adCopy: JSON.parse(campaign.generatedAdCopy), // Parse for display
            videoScriptIdea: JSON.parse(campaign.generatedVideoScriptIdea) // Parse for display
        });
    } catch (error) {
        console.error('Error viewing campaign details:', error);
        res.status(500).send('Error displaying campaign details.');
    }
};