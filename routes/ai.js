const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Order = require('../models/Order');
const { authenticateToken } = require('../middleware/auth');
const { OpenAIApi, Configuration } = require('openai');
const axios = require('axios');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Generate product descriptions using AI
router.post('/generate-product-description', authenticateToken, async (req, res) => {
  try {
    const { productName, productFeatures, targetAudience } = req.body;
    
    const prompt = `
      Write a compelling product description for: ${productName}
      Features: ${productFeatures}
      Target audience: ${targetAudience}
      
      The description should be engaging, highlight benefits, and be approximately 200-300 words.
    `;
    
    const response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: prompt,
      max_tokens: 300,
      temperature: 0.7,
    });
    
    res.json({ description: response.data.choices[0].text.trim() });
  } catch (error) {
    console.error('Error generating product description:', error);
    res.status(500).json({ error: 'Failed to generate product description' });
  }
});

// Generate marketing content for products
router.post('/generate-marketing-content', authenticateToken, async (req, res) => {
  try {
    const { productName, productDescription, targetAudience } = req.body;
    
    const prompt = `
      Generate marketing content for the product: ${productName}
      Description: ${productDescription}
      Target audience: ${targetAudience}
      
      Provide:
      1. 3 catchy headlines
      2. 2 social media post ideas
      3. 1 email subject line
    `;
    
    const response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: prompt,
      max_tokens: 400,
      temperature: 0.8,
    });
    
    const content = response.data.choices[0].text.trim();
    res.json({ content });
  } catch (error) {
    console.error('Error generating marketing content:', error);
    res.status(500).json({ error: 'Failed to generate marketing content' });
  }
});

// Analyze product profitability
router.post('/analyze-product', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.body;
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Calculate profitability metrics
    const profitMargin = product.calculateProfitMargin();
    const isProfitable = product.isProfitable(20); // 20% minimum margin
    
    // Get sales data if available
    const totalRevenue = product.price * product.salesCount;
    
    // Generate insights using AI
    const prompt = `
      Analyze this product: ${product.name}
      Price: $${product.price}
      Cost: $${product.costPerItem || 0}
      Sales count: ${product.salesCount}
      Profit margin: ${profitMargin}%
      
      Is profitable: ${isProfitable ? 'Yes' : 'No'}
      
      Provide brief recommendations on pricing, marketing, or improvements.
    `;
    
    const response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: prompt,
      max_tokens: 200,
      temperature: 0.5,
    });
    
    const analysis = response.data.choices[0].text.trim();
    
    res.json({
      product: {
        id: product._id,
        name: product.name,
        price: product.price,
        cost: product.costPerItem,
        salesCount: product.salesCount,
        profitMargin: profitMargin,
        isProfitable,
        totalRevenue
      },
      analysis
    });
  } catch (error) {
    console.error('Error analyzing product:', error);
    res.status(500).json({ error: 'Failed to analyze product' });
  }
});

// Suggest new products based on market trends
router.get('/suggest-products', authenticateToken, async (req, res) => {
  try {
    const { category, keywords } = req.query;
    
    // In a real implementation, you would connect to a product sourcing API
    // For now, we'll simulate with AI-generated suggestions
    const prompt = `
      Suggest 5 trending products for the category: ${category || 'general'}
      Keywords: ${keywords || 'popular, trending'}
      
      For each product, provide:
      1. Product name
      2. Brief description
      3. Estimated market demand (high/medium/low)
      4. Potential selling points
    `;
    
    const response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: prompt,
      max_tokens: 500,
      temperature: 0.8,
    });
    
    res.json({ suggestions: response.data.choices[0].text.trim() });
  } catch (error) {
    console.error('Error suggesting products:', error);
    res.status(500).json({ error: 'Failed to suggest products' });
  }
});

// Analyze customer reviews and feedback
router.post('/analyze-feedback', authenticateToken, async (req, res) => {
  try {
    const { feedback, productId } = req.body;
    
    const prompt = `
      Analyze this customer feedback: ${feedback}
      
      Provide:
      1. Sentiment (positive/negative/neutral)
      2. Main concerns or praises
      3. Actionable recommendations for improvement
      4. Priority level (high/medium/low)
    `;
    
    const response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: prompt,
      max_tokens: 300,
      temperature: 0.4,
    });
    
    res.json({ analysis: response.data.choices[0].text.trim() });
  } catch (error) {
    console.error('Error analyzing feedback:', error);
    res.status(500).json({ error: 'Failed to analyze feedback' });
  }
});

// Predict demand for products
router.post('/predict-demand', authenticateToken, async (req, res) => {
  try {
    const { productId, historicalData } = req.body;
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // In a real implementation, you would use actual historical data
    // For now, we'll use AI to simulate a prediction
    const prompt = `
      Based on market trends, predict the demand for: ${product.name}
      Category: ${product.category}
      Historical data: ${historicalData || 'Not provided'}
      
      Provide:
      1. Demand prediction (high/medium/low) for the next 30 days
      2. Recommended inventory level
      3. Seasonal considerations
      4. Risk factors
    `;
    
    const response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: prompt,
      max_tokens: 300,
      temperature: 0.6,
    });
    
    res.json({ prediction: response.data.choices[0].text.trim() });
  } catch (error) {
    console.error('Error predicting demand:', error);
    res.status(500).json({ error: 'Failed to predict demand' });
  }
});

module.exports = router;