const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Order = require('../models/Order');
const { authenticateToken, authenticateAdmin } = require('../middleware/auth');
const Queue = require('bull');
const axios = require('axios');

// Create Bull queues for different automation tasks
const productSyncQueue = new Queue('product sync', process.env.REDIS_URL || 'redis://127.0.0.1:6379');
const orderFulfillmentQueue = new Queue('order fulfillment', process.env.REDIS_URL || 'redis://127.0.0.1:6379');
const marketingQueue = new Queue('marketing', process.env.REDIS_URL || 'redis://127.0.0.1:6379');
const inventoryQueue = new Queue('inventory', process.env.REDIS_URL || 'redis://127.0.0.1:6379');

// Process product sync jobs
productSyncQueue.process('syncProduct', async (job) => {
  const { productId, supplierId } = job.data;
  
  try {
    // Simulate product sync with supplier
    console.log(`Syncing product ${productId} with supplier ${supplierId}`);
    
    // In a real implementation, you would connect to supplier APIs
    // Update product information, inventory, pricing, etc.
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }
    
    // Update product with latest information from supplier
    // This is a simplified example
    product.lastUpdated = new Date();
    await product.save();
    
    return { success: true, productId, supplierId };
  } catch (error) {
    console.error(`Error syncing product ${productId}:`, error);
    throw error;
  }
});

// Process order fulfillment jobs
orderFulfillmentQueue.process('fulfillOrder', async (job) => {
  const { orderId, shippingInfo } = job.data;
  
  try {
    console.log(`Fulfilling order ${orderId}`);
    
    // In a real implementation, you would connect to fulfillment services
    // Create shipping labels, notify suppliers, update order status
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }
    
    // Update order status
    order.fulfillmentStatus = 'fulfilled';
    order.shippedAt = new Date();
    await order.save();
    
    return { success: true, orderId, trackingNumber: `AUTO-${Date.now()}` };
  } catch (error) {
    console.error(`Error fulfilling order ${orderId}:`, error);
    throw error;
  }
});

// Process marketing jobs
marketingQueue.process('executeMarketingCampaign', async (job) => {
  const { productId, campaignType } = job.data;
  
  try {
    console.log(`Executing ${campaignType} campaign for product ${productId}`);
    
    // In a real implementation, you would execute marketing campaigns
    // Post to social media, create ads, send emails, etc.
    
    return { success: true, productId, campaignType };
  } catch (error) {
    console.error(`Error executing marketing campaign for product ${productId}:`, error);
    throw error;
  }
});

// Process inventory jobs
inventoryQueue.process('checkInventory', async (job) => {
  const { productId } = job.data;
  
  try {
    console.log(`Checking inventory for product ${productId}`);
    
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }
    
    // Check if inventory is low
    if (product.inventoryQuantity < 5) { // Threshold of 5
      console.log(`Low inventory alert for product ${product.name}`);
      
      // Add to reorder queue
      await productSyncQueue.add('syncProduct', {
        productId: product._id,
        supplierId: product.supplierId
      }, {
        delay: 300000 // 5 minutes delay
      });
    }
    
    return { success: true, productId, inventoryLevel: product.inventoryQuantity };
  } catch (error) {
    console.error(`Error checking inventory for product ${productId}:`, error);
    throw error;
  }
});

// Trigger product sync
router.post('/products/sync', authenticateAdmin, async (req, res) => {
  try {
    const { productId, supplierId } = req.body;
    
    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }
    
    const job = await productSyncQueue.add('syncProduct', {
      productId,
      supplierId: supplierId || 'default-supplier'
    });
    
    res.json({ 
      message: 'Product sync job queued successfully', 
      jobId: job.id,
      productId 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Trigger order fulfillment
router.post('/orders/fulfill', authenticateAdmin, async (req, res) => {
  try {
    const { orderId, shippingInfo } = req.body;
    
    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }
    
    const job = await orderFulfillmentQueue.add('fulfillOrder', {
      orderId,
      shippingInfo
    });
    
    res.json({ 
      message: 'Order fulfillment job queued successfully', 
      jobId: job.id,
      orderId 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Trigger marketing campaign
router.post('/marketing/campaign', authenticateAdmin, async (req, res) => {
  try {
    const { productId, campaignType } = req.body;
    
    if (!productId || !campaignType) {
      return res.status(400).json({ 
        error: 'Product ID and campaign type are required' 
      });
    }
    
    const job = await marketingQueue.add('executeMarketingCampaign', {
      productId,
      campaignType
    });
    
    res.json({ 
      message: 'Marketing campaign job queued successfully', 
      jobId: job.id,
      productId,
      campaignType
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check inventory levels
router.post('/inventory/check', authenticateAdmin, async (req, res) => {
  try {
    const { productId } = req.body;
    
    if (productId) {
      // Check specific product
      const job = await inventoryQueue.add('checkInventory', { productId });
      res.json({ 
        message: 'Inventory check job queued for specific product', 
        jobId: job.id,
        productId 
      });
    } else {
      // Check all products
      const products = await Product.find({ status: 'active' });
      const jobs = [];
      
      for (const product of products) {
        const job = await inventoryQueue.add('checkInventory', { 
          productId: product._id 
        });
        jobs.push(job.id);
      }
      
      res.json({ 
        message: 'Inventory check jobs queued for all active products', 
        jobIds: jobs,
        totalProducts: products.length
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get queue status
router.get('/queues/status', authenticateAdmin, async (req, res) => {
  try {
    const queues = [
      { name: 'productSync', queue: productSyncQueue },
      { name: 'orderFulfillment', queue: orderFulfillmentQueue },
      { name: 'marketing', queue: marketingQueue },
      { name: 'inventory', queue: inventoryQueue }
    ];
    
    const status = {};
    
    for (const q of queues) {
      status[q.name] = {
        waiting: await q.queue.getWaitingCount(),
        active: await q.queue.getActiveCount(),
        completed: await q.queue.getCompletedCount(),
        failed: await q.queue.getFailedCount(),
        delayed: await q.queue.getDelayedCount()
      };
    }
    
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start periodic tasks
function startPeriodicTasks() {
  console.log('Starting periodic automation tasks...');
  
  // Schedule inventory checks every hour
  setInterval(async () => {
    try {
      const products = await Product.find({ status: 'active' });
      
      for (const product of products) {
        await inventoryQueue.add('checkInventory', { productId: product._id });
      }
      
      console.log(`Scheduled inventory checks for ${products.length} products`);
    } catch (error) {
      console.error('Error scheduling inventory checks:', error);
    }
  }, 3600000); // Every hour
  
  // Schedule order processing every 10 minutes
  setInterval(async () => {
    try {
      const pendingOrders = await Order.find({ 
        status: 'confirmed', 
        fulfillmentStatus: 'pending' 
      });
      
      for (const order of pendingOrders) {
        await orderFulfillmentQueue.add('fulfillOrder', { 
          orderId: order._id,
          shippingInfo: order.shippingAddress
        });
      }
      
      console.log(`Scheduled fulfillment for ${pendingOrders.length} orders`);
    } catch (error) {
      console.error('Error scheduling order fulfillment:', error);
    }
  }, 600000); // Every 10 minutes
}

// Initialize periodic tasks when module is loaded
startPeriodicTasks();

module.exports = router;