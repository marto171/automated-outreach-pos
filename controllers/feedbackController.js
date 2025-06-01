const Product = require('../models/Product');
const Manufacturer = require('../models/Manufacturer');
const User = require('../models/User'); // For expertise
const geminiService = require('../services/geminiService');

// Page to view product performance and trigger feedback/suggestions
exports.getFeedbackPage = async (req, res) => {
    try {
        // Fetch products that might need feedback, e.g., those associated with active campaigns or closed deals
        const products = await Product.find()
            .populate('manufacturer', 'name status') // Populate manufacturer name and status
            .sort({ 'manufacturer.name': 1, name: 1 });

        const users = await User.find().select('name areaOfExpertise'); // For assigning expertise context

        res.render('feedback-management', {
            title: 'Product Feedback & Performance',
            products: products,
            users: users, // To show expertise for context, not for direct sales assignment in this PoC view
            successMessage: req.query.successMessage,
            errorMessage: req.query.errorMessage,
        });
    } catch (error) {
        console.error("Error loading feedback page:", error);
        res.status(500).render('feedback-management', {
            title: 'Product Feedback & Performance',
            products: [],
            users:[],
            errorMessage: 'Failed to load product performance data.'
        });
    }
};

// Simulate collecting sales data and updating product performance
exports.updateProductPerformance = async (req, res) => {
    const { productId } = req.params;
    const { salesFigure, isUnderperforming } = req.body; // salesFigure is a numeric representation

    try {
        const product = await Product.findById(productId);
        if (!product) {
            return res.redirect('/feedback?errorMessage=Product not found.');
        }

        product.currentSalesPerformance = parseFloat(salesFigure) || 0;
        product.isUnderperforming = isUnderperforming === 'on'; // Checkbox value

        await product.save();
        res.redirect(`/feedback?successMessage=Performance updated for ${product.name}.`);
    } catch (error) {
        console.error("Error updating product performance:", error);
        res.redirect(`/feedback?errorMessage=Error updating performance: ${error.message}`);
    }
};

// Generate and store a product change suggestion
exports.suggestProductChange = async (req, res) => {
    const { productId } = req.params;
    const { reasonForUnderperformance } = req.body;

    try {
        const product = await Product.findById(productId).populate('manufacturer');
        if (!product) {
            return res.redirect('/feedback?errorMessage=Product not found.');
        }
        if (!product.isUnderperforming) {
            return res.redirect(`/feedback?errorMessage=${product.name} is not marked as underperforming. Suggestion not generated.`);
        }

        // Simulate fetching successful products in the same category (simplified)
        // In a real system, this would query a DB of successful products or use more complex logic
        const successfulProductsExamples = await Product.find({
            category: product.category,
            isUnderperforming: false, // Find products that are NOT underperforming
            currentSalesPerformance: { $gt: product.currentSalesPerformance + 100 } // Example: significantly better sales
        }).limit(3).select('name currentSalesPerformance');

        let examplesString = "No specific examples found in DB. Using general knowledge.";
        if (successfulProductsExamples.length > 0) {
            examplesString = successfulProductsExamples.map(p => `${p.name} (Sales: ${p.currentSalesPerformance})`).join(', ');
        }

        const suggestion = await geminiService.suggestProductAlternative(
            product.name,
            product.category,
            reasonForUnderperformance || "General underperformance noted.",
            examplesString
        );

        product.suggestedChanges.push({
            suggestion: suggestion.suggestedProductName,
            reason: suggestion.reasoning + (suggestion.keyFeaturesToConsider ? ` Key Features: ${suggestion.keyFeaturesToConsider.join(', ')}` : ''),
            dateSuggested: new Date(),
        });

        // Notify manufacturer (e.g., change status, send an email - simplified here)
        if (product.manufacturer) {
            product.manufacturer.status = 'feedback_provided';
            product.manufacturer.notes = (product.manufacturer.notes || "") + `\nSuggestion provided for ${product.name} on ${new Date().toLocaleDateString()}: Consider producing ${suggestion.suggestedProductName}.`;
            await product.manufacturer.save();
        }

        await product.save();

        res.redirect(`/feedback?successMessage=Product change suggestion generated for ${product.name}.`);
    } catch (error) {
        console.error("Error suggesting product change:", error);
        res.redirect(`/feedback?errorMessage=Error generating suggestion: ${error.message}`);
    }
};