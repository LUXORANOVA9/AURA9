const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  total: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  _id: false
});

const addressSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  company: String,
  address1: String,
  address2: String,
  city: String,
  province: String,
  country: String,
  zip: String,
  phone: String
});

const customerSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  firstName: String,
  lastName: String,
  phone: String,
  acceptsMarketing: {
    type: Boolean,
    default: false
  }
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    index: true
  },
  customer: {
    type: customerSchema,
    required: true
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  subtotal: {
    type: Number,
    min: 0
  },
  totalTax: {
    type: Number,
    default: 0
  },
  totalShipping: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  shippingAddress: addressSchema,
  billingAddress: addressSchema,
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },
  fulfillmentStatus: {
    type: String,
    enum: ['pending', 'fulfilled', 'partial', 'unfulfilled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending'
  },
  trackingNumber: String,
  shippingCarrier: String,
  paymentMethod: String,
  notes: String,
  tags: [String],
  processedAt: Date,
  shippedAt: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  cancellationReason: String,
  refundedAt: Date,
  refundAmount: Number,
  source: {
    type: String,
    default: 'web'
  },
  sourceUrl: String,
  userAgent: String,
  ip: String,
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

// Generate order number before saving
orderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    // Generate a unique order number
    const timestamp = Date.now().toString();
    const random = Math.floor(1000 + Math.random() * 9000).toString();
    this.orderNumber = `#${timestamp.slice(-8)}${random}`;
  }
  next();
});

// Calculate subtotal before saving
orderSchema.pre('save', function(next) {
  if (this.items && this.items.length > 0) {
    this.subtotal = this.items.reduce((sum, item) => sum + item.total, 0);
  }
  next();
});

// Indexes for better query performance
orderSchema.index({ status: 1 });
orderSchema.index({ 'customer.email': 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ orderNumber: 1 });

// Method to calculate total
orderSchema.methods.calculateTotal = function() {
  return this.subtotal + this.totalShipping + this.totalTax;
};

// Method to add item to order
orderSchema.methods.addItem = function(product, quantity = 1) {
  const existingItem = this.items.find(item => item.product.toString() === product._id.toString());
  
  if (existingItem) {
    existingItem.quantity += quantity;
    existingItem.total = existingItem.price * existingItem.quantity;
  } else {
    this.items.push({
      product: product._id,
      name: product.name,
      price: product.price,
      quantity: quantity,
      total: product.price * quantity
    });
  }
  
  this.totalAmount = this.calculateTotal();
};

// Method to remove item from order
orderSchema.methods.removeItem = function(productId) {
  this.items = this.items.filter(item => item.product.toString() !== productId.toString());
  this.totalAmount = this.calculateTotal();
};

module.exports = mongoose.model('Order', orderSchema);