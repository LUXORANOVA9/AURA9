const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { authenticateToken } = require('../middleware/auth');

// GET all orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, customerEmail } = req.query;
    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (customerEmail) {
      query.customerEmail = { $regex: customerEmail, $options: 'i' };
    }
    
    const orders = await Order.find(query)
      .populate('items.product')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    const total = await Order.countDocuments(query);
    
    res.json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single order
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.product');
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create new order
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { customer, items, shippingAddress, billingAddress, paymentMethod } = req.body;
    
    // Validate products and calculate totals
    let totalAmount = 0;
    const orderItems = [];
    
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({ error: `Product ${item.product} not found` });
      }
      
      if (!product.availableForSale || product.inventoryQuantity < item.quantity) {
        return res.status(400).json({ 
          error: `Insufficient inventory for product ${product.name}` 
        });
      }
      
      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;
      
      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        total: itemTotal
      });
    }
    
    const order = new Order({
      customer,
      items: orderItems,
      totalAmount,
      shippingAddress,
      billingAddress,
      paymentMethod,
      status: 'pending'
    });
    
    await order.save();
    
    // Update product inventory
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(
        item.product,
        { 
          $inc: { inventoryQuantity: -item.quantity },
          $inc: { salesCount: item.quantity }
        }
      );
    }
    
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT update order status
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const allowedUpdates = ['status', 'trackingNumber', 'fulfillmentStatus', 'notes'];
    const updates = Object.keys(req.body);
    
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));
    if (!isValidOperation) {
      return res.status(400).json({ error: 'Invalid updates!' });
    }
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// POST process payment
router.post('/:id/process-payment', authenticateToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // In a real implementation, you would integrate with a payment processor
    // For now, we'll just update the payment status
    order.paymentStatus = 'paid';
    order.status = 'confirmed';
    await order.save();
    
    res.json({ 
      message: 'Payment processed successfully', 
      order: order 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;