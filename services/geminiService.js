const geminiModel = require('../config/gemini');

async function analyzeSentiment(text) {
    const prompt = `Analyze the sentiment of the following email response. Categorize it as 'positive', 'negative', or 'neutral'. If it's positive and includes a phone number, please extract the phone number.
  Email Text: "${text}"
  
  Output format should be JSON:
  {
    "sentiment": "positive/negative/neutral",
    "phoneNumber": "extracted_phone_number_if_any_or_null"
  }`;
    try {
        const result = await geminiModel.generateContent(prompt);
        const response = await result.response;
        const rawJson = response.text()
            .replace(/^```json\s*|```\s*$/g, '') // Remove markdown code block fences
            .trim();
        console.log("Gemini Raw Response (Sentiment):", rawJson);
        return JSON.parse(rawJson);
    } catch (error) {
        console.error('Error analyzing sentiment with Gemini:', error);
        throw error;
    }
}

async function generateProductWebsiteContent(productName, productCategory, manufacturerName) {
    const prompt = `Generate compelling website content for a product page.
  Product Name: ${productName}
  Product Category: ${productCategory}
  Manufacturer: ${manufacturerName}

  Provide the following sections in JSON format:
  {
    "pageTitle": "A catchy title for the product page",
    "headline": "A strong headline for the product",
    "tagline": "A short, memorable tagline",
    "productDescription": "A detailed and persuasive product description (2-3 paragraphs). Highlight key features and benefits.",
    "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4"],
    "callToAction": "A compelling call to action, e.g., 'Order Now and Transform Your Experience!'"
  }`;
    try {
        const result = await geminiModel.generateContent(prompt);
        const response = await result.response;
        const rawJson = response.text()
            .replace(/^```json\s*|```\s*$/g, '')
            .trim();
        console.log("Gemini Raw Response (Website Content):", rawJson);
        return JSON.parse(rawJson);
    } catch (error) {
        console.error('Error generating website content with Gemini:', error);
        throw error;
    }
}

async function generateCampaignAssets(productName, productCategory, targetAudience) {
    const prompt = `Generate marketing campaign assets for a product.
  Product Name: ${productName}
  Product Category: ${productCategory}
  Target Audience: ${targetAudience || 'General consumers interested in ' + productCategory}

  Provide the following in JSON format:
  {
    "adCopy": [
      { "platform": "Facebook/Instagram Ad", "headline": "Short Headline", "body": "Compelling body text (2-3 sentences)", "cta": "Call to Action (e.g., Shop Now)" },
      { "platform": "Google Search Ad", "headline1": "Headline 1 (max 30 chars)", "headline2": "Headline 2 (max 30 chars)", "description": "Description (max 90 chars)" }
    ],
    "promotionalVideoScriptIdea": {
      "title": "Video Title Idea",
      "concept": "A brief concept for a 30-60 second promotional video. Describe key scenes or messages.",
      "voiceoverNarrationIdea": "Key points for a voiceover."
    },
    "emailCampaignSubject": "Catchy subject line for an email promotion"
  }`;
    try {
        const result = await geminiModel.generateContent(prompt);
        const response = await result.response;
        const rawJson = response.text()
            .replace(/^```json\s*|```\s*$/g, '')
            .trim();
        console.log("Gemini Raw Response (Campaign Assets):", rawJson);
        return JSON.parse(rawJson);
    } catch (error) {
        console.error('Error generating campaign assets with Gemini:', error);
        throw error;
    }
}

async function suggestProductAlternative(productName, productCategory, reasonForUnderperformance, successfulProductsExamples) {
    // successfulProductsExamples should be a string like "Product A (High Sales), Product B (Trending)"
    const prompt = `A manufacturer's product is underperforming.
  Current Product Name: ${productName}
  Product Category: ${productCategory}
  Reason for Underperformance: ${reasonForUnderperformance}
  Examples of successful products in the same category: ${successfulProductsExamples || "Not specified, use general knowledge for " + productCategory}

  Suggest one specific, alternative product that the manufacturer could consider producing to maximize sales.
  Provide the suggestion in JSON format:
  {
    "suggestedProductName": "Name of the suggested alternative product",
    "reasoning": "Brief reasoning why this alternative might be more successful, considering the category and potential market demand.",
    "keyFeaturesToConsider": ["Feature 1", "Feature 2", "Feature 3"]
  }`;
    try {
        const result = await geminiModel.generateContent(prompt);
        const response = await result.response;
        const rawJson = response.text()
            .replace(/^```json\s*|```\s*$/g, '')
            .trim();
        console.log("Gemini Raw Response (Product Suggestion):", rawJson);
        return JSON.parse(rawJson);
    } catch (error) {
        console.error('Error suggesting product alternative with Gemini:', error);
        throw error;
    }
}

module.exports = {
    analyzeSentiment,
    generateProductWebsiteContent,
    generateCampaignAssets,
    suggestProductAlternative,
};