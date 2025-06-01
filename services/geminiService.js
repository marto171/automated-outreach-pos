require('dotenv').config(); // Load .env variables at the very top

const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { ChatPromptTemplate } = require('@langchain/core/prompts');
const { JsonOutputParser } = require('@langchain/core/output_parsers');

// Initialize the Gemini model via LangChain
// Ensure GEMINI_API_KEY is set in your .env file
const model = new ChatGoogleGenerativeAI({
    modelName: "gemini-pro", // Or "gemini-1.5-pro-latest" etc.
    apiKey: process.env.GEMINI_API_KEY,
    // temperature: 0.7, // Optional: set temperature if needed
});

// Helper to remove markdown and parse JSON, though JsonOutputParser should handle most cases
// We might not need this if the LLM consistently returns clean JSON without markdown.
// For now, let's rely on JsonOutputParser and strong prompting.
// const cleanAndParseJson = (text) => {
//     const cleaned = text.replace(/^```json\s*|```\s*$/g, '').trim();
//     return JSON.parse(cleaned);
// };

async function analyzeSentiment(text) {
    const systemMessage = `You are an AI assistant specialized in sentiment analysis and data extraction from text.
Carefully analyze the sentiment of the email response provided by the user.

Instructions:
1.  Categorize the overall sentiment as strictly 'positive', 'negative', or 'neutral'.
    *   'positive': Expresses clear satisfaction, enthusiasm, agreement, or a direct intention to proceed (e.g., scheduling a call, making a purchase, accepting an offer).
    *   'negative': Expresses clear dissatisfaction, disagreement, refusal, or complaint.
    *   'neutral': Lacks strong emotional tone, is purely informational, a simple acknowledgment, or poses a question without clear positive/negative leaning.
2.  If AND ONLY IF the sentiment is categorized as 'positive' AND a discernible phone number is present in the email text, extract the complete phone number.
    *   Phone numbers can be in various common formats (e.g., (XXX) XXX-XXXX, XXX-XXX-XXXX, XXXXXXXXXX, +X XXX XXX XXXX). Extract it as it appears.
    *   If multiple phone numbers are present in a positive email, extract the first one that seems most relevant to a follow-up or contact.
3.  If no phone number is found, or if the sentiment is not 'positive', the value for "phoneNumber" must be null.

Output format MUST be a single, valid JSON object with no additional explanatory text, comments, or markdown fences before or after the JSON.
The JSON object should strictly follow this structure:
{
  "sentiment": "positive/negative/neutral",
  "phoneNumber": "extracted_phone_number_if_any_or_null"
}`;

    const humanMessage = `Email Text: "${text}"`;

    const promptTemplate = ChatPromptTemplate.fromMessages([
        ["system", systemMessage],
        ["human", humanMessage]
    ]);

    const parser = new JsonOutputParser();
    const chain = promptTemplate.pipe(model).pipe(parser);

    try {
        console.log("Sending sentiment analysis request to Gemini via LangChain...");
        const result = await chain.invoke({
            // LangChain's fromMessages will interpolate based on placeholders if any,
            // but here we pass the full text directly as it's part of the human message.
            // If `text` was a placeholder in the template like {email_text}, we'd do:
            // invoke({ email_text: text })
        });
        console.log("LangSmith - Sentiment Analysis Result:", result);
        return result;
    } catch (error) {
        console.error('Error analyzing sentiment with LangChain/Gemini:', error);
        // Log the raw response if available and if it's an OutputParserException
        if (error.output) {
            console.error("Raw output that failed parsing:", error.output);
        }
        throw error;
    }
}

async function generateProductWebsiteContent(productName, productCategory, manufacturerName) {
    const systemMessage = `You are an expert marketing copywriter and branding specialist, tasked with creating high-converting product page content.
Your goal is to generate compelling, persuasive, and informative website content for the product detailed by the user.

Content Requirements (provide output STRICTLY in the following JSON format, with no additional text, comments, or markdown fences):
{
  "pageTitle": "A captivating and SEO-friendly title for the product page (max 60-70 characters). Should include the product name.",
  "headline": "A powerful, benefit-driven headline that grabs attention and clearly states the product's main value proposition (max 10-15 words).",
  "tagline": "A short, memorable, and catchy tagline that encapsulates the essence of the product (max 5-10 words).",
  "productDescription": "A detailed and persuasive product description (target 200-300 words, split into 2-3 paragraphs). It should: \n    - Tell a compelling story or paint a picture of how the product improves the customer's life.\n    - Clearly highlight the key problems the product solves or the desires it fulfills.\n    - Seamlessly weave in unique selling propositions (USPs) and benefits, not just features.\n    - Maintain an engaging and trustworthy tone.",
  "features": [
    "Benefit-oriented Feature 1: Clearly explain the feature and its direct advantage to the user.",
    "Benefit-oriented Feature 2: Clearly explain the feature and its direct advantage to the user.",
    "Benefit-oriented Feature 3: Clearly explain the feature and its direct advantage to the user.",
    "Benefit-oriented Feature 4: (Optional) Add if highly relevant, otherwise 3 strong features are sufficient. Focus on impact."
  ],
  "callToAction": "A strong, clear, and urgent call to action that encourages the desired next step (e.g., 'Buy Now & Experience the Difference!', 'Get Your [Product Name] Today and Unlock [Key Benefit]!', 'Discover More & Start Your Journey!')."
}`;

    const humanMessage = `Generate content for:
Product Name: {productName}
Product Category: {productCategory}
Manufacturer: {manufacturerName}`;

    const promptTemplate = ChatPromptTemplate.fromMessages([
        ["system", systemMessage],
        ["human", humanMessage]
    ]);

    const parser = new JsonOutputParser();
    const chain = promptTemplate.pipe(model).pipe(parser);

    try {
        console.log("Sending website content generation request to Gemini via LangChain...");
        const result = await chain.invoke({
            productName,
            productCategory,
            manufacturerName
        });
        console.log("LangSmith - Website Content Result:", result);
        return result;
    } catch (error) {
        console.error('Error generating website content with LangChain/Gemini:', error);
        if (error.output) {
            console.error("Raw output that failed parsing:", error.output);
        }
        throw error;
    }
}

async function generateCampaignAssets(productName, productCategory, targetAudience) {
    const effectiveTargetAudience = targetAudience || `General consumers interested in high-quality ${productCategory}`;

    const systemMessage = `You are a creative and results-driven digital marketing strategist.
Your task is to generate a suite of compelling marketing campaign assets for the product detailed by the user, tailored to the specified target audience.

Asset Requirements (provide output STRICTLY in the following JSON format, with no additional text, comments, or markdown fences):
{
  "adCopy": [
    {
      "platform": "Facebook/Instagram Ad",
      "headline": "Short, attention-grabbing headline (max 5-7 words). Evoke curiosity or highlight a key benefit.",
      "body": "Compelling body text (2-4 sentences, approx. 50-90 words). Focus on the target audience's pain points or aspirations and how the product provides a solution. Include a strong emotional hook. Use emojis sparingly and appropriately if they fit the brand.",
      "cta": "Clear and direct Call to Action (e.g., Shop Now, Learn More, Get Yours Today)"
    },
    {
      "platform": "Google Search Ad (Responsive Search Ad Text Asset)",
      "headline1": "Primary Keyword + Benefit (max 30 chars)",
      "headline2": "Feature/USP + Urgency (max 30 chars)",
      "headline3": "Brand Name/Offer (max 30 chars, optional but recommended)",
      "description1": "Key benefit 1, supporting detail, call to action hint (max 90 chars)",
      "description2": "Key benefit 2, unique selling point, social proof hint (max 90 chars)"
    }
  ],
  "promotionalVideoScriptIdea": {
    "title": "Catchy and intriguing video title idea (e.g., 'Unlock [Benefit] with [Product Name]!')",
    "concept": "A brief concept for a 30-45 second promotional video. Describe 3-4 key scenes or messages. \n    Scene 1: Introduce problem/desire relevant to the target audience. \n    Scene 2: Introduce [Product Name] as the solution, showcasing its most appealing feature. \n    Scene 3: Show the positive outcome/transformation. \n    Scene 4: Strong call to action with product visual.",
    "voiceoverNarrationIdea": "Key voiceover points: \n    - Start with a hook related to the target audience's needs. \n    - Briefly explain what [Product Name] is and its core benefit. \n    - Emphasize the transformation or solution it offers. \n    - End with a clear call to action.",
    "visualStyleSuggestion": "Briefly suggest a visual style (e.g., 'Bright and optimistic', 'Sleek and modern', 'Authentic and relatable')."
  },
  "emailCampaignSubject": "Highly engaging and click-worthy subject line for a promotional email (max 50-60 characters). Consider using curiosity, urgency, personalization (if applicable), or a clear benefit."
}`;
    // Note: In the system prompt above, I replaced ${productName} and ${effectiveTargetAudience}
    // with generic placeholders like [Product Name] because the actual values will be
    // injected via the human message context. This keeps the system prompt more static.

    const humanMessage = `Generate campaign assets for:
Product Name: {productName}
Product Category: {productCategory}
Target Audience: {effectiveTargetAudience}`;

    const promptTemplate = ChatPromptTemplate.fromMessages([
        ["system", systemMessage],
        ["human", humanMessage]
    ]);
    const parser = new JsonOutputParser();
    const chain = promptTemplate.pipe(model).pipe(parser);

    try {
        console.log("Sending campaign assets generation request to Gemini via LangChain...");
        const result = await chain.invoke({
            productName,
            productCategory,
            effectiveTargetAudience
        });
        console.log("LangSmith - Campaign Assets Result:", result);
        return result;
    } catch (error) {
        console.error('Error generating campaign assets with LangChain/Gemini:', error);
        if (error.output) {
            console.error("Raw output that failed parsing:", error.output);
        }
        throw error;
    }
}

async function suggestProductAlternative(productName, productCategory, reasonForUnderperformance, successfulProductsExamples) {
    const knownSuccessfulExamples = successfulProductsExamples || `general successful examples within the ${productCategory} category based on common market knowledge`;

    const systemMessage = `You are an innovative product development consultant and market analyst.
A manufacturer's product is underperforming. You will be provided with details by the user.
We are looking for a specific, actionable suggestion for ONE alternative product the manufacturer could consider developing to better meet market demand and maximize sales.

Based on the user-provided information, provide a detailed suggestion in the following STRICT JSON format, with no additional explanatory text, comments, or markdown fences:
{
  "suggestedProductName": "A catchy, market-appropriate name for the suggested alternative product.",
  "alternativeProductConcept": "A concise description of the alternative product concept (1-2 sentences). What is it, and who is it for?",
  "reasoningForSuccess": "Detailed reasoning (2-3 sentences) explaining WHY this alternative product is likely to be more successful than the current product. Specifically address how it overcomes the stated reason for underperformance, taps into current market trends for the product category, or fills an unmet customer need. Refer to insights from successful examples if relevant.",
  "keyDifferentiatingFeatures": [
    "Feature 1: A core feature that directly addresses a key market demand or the previous product's shortcoming. Explain its benefit.",
    "Feature 2: Another significant feature that offers unique value or innovation compared to existing offerings. Explain its benefit.",
    "Feature 3: A feature that enhances user experience, convenience, or addresses a niche demand within the target market. Explain its benefit."
  ],
  "targetAudienceProfile": "Briefly describe the ideal customer profile for this suggested alternative product (1-2 sentences)."
}`;
    // Similar to above, placeholders in system prompt are generic.

    const humanMessage = `Current Product Name: {productName}
Product Category: {productCategory}
Reason for Underperformance: {reasonForUnderperformance}
Examples of successful products in the same or adjacent categories: {knownSuccessfulExamples}

Suggest an alternative.`;

    const promptTemplate = ChatPromptTemplate.fromMessages([
        ["system", systemMessage],
        ["human", humanMessage]
    ]);
    const parser = new JsonOutputParser();
    const chain = promptTemplate.pipe(model).pipe(parser);

    try {
        console.log("Sending product suggestion request to Gemini via LangChain...");
        const result = await chain.invoke({
            productName,
            productCategory,
            reasonForUnderperformance,
            knownSuccessfulExamples
        });
        console.log("LangSmith - Product Suggestion Result:", result);
        return result;
    } catch (error) {
        console.error('Error suggesting product alternative with LangChain/Gemini:', error);
        if (error.output) {
            console.error("Raw output that failed parsing:", error.output);
        }
        throw error;
    }
}

module.exports = {
    analyzeSentiment,
    generateProductWebsiteContent,
    generateCampaignAssets,
    suggestProductAlternative,
};

// Example of how to run one of the functions (for testing)
// Make sure to have your .env file set up correctly.
/*
async function test() {
    try {
        // Test Sentiment Analysis
        const sentimentResult = await analyzeSentiment("Hello! This is great. Please call me at 555-123-4567 to discuss further.");
        console.log("\n--- Sentiment Test Result ---");
        console.dir(sentimentResult, { depth: null });

        // Test Product Website Content
        const websiteContent = await generateProductWebsiteContent("AquaPurify Home Filter", "Water Filters", "PureLife Inc.");
        console.log("\n--- Website Content Test Result ---");
        console.dir(websiteContent, { depth: null });

        // Test Campaign Assets
        const campaignAssets = await generateCampaignAssets("EcoSmart Thermostat", "Smart Home Devices", "Tech-savvy homeowners looking to save energy");
        console.log("\n--- Campaign Assets Test Result ---");
        console.dir(campaignAssets, { depth: null });

        // Test Product Alternative
        const alternative = await suggestProductAlternative(
            "ClassicBrew Coffee Maker",
            "Kitchen Appliances",
            "Sales declining due to lack of smart features and outdated design.",
            "SmartBrew X1 (App-controlled, modern aesthetic), InstaPod Single Serve (Fast, convenient)"
        );
        console.log("\n--- Product Alternative Test Result ---");
        console.dir(alternative, { depth: null });

    } catch (e) {
        console.error("\nTest failed:", e);
    }
}

test();
*/