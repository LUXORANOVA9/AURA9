const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    index: true
  },
  subcategory: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  compareAtPrice: {
    type: Number,
    min: 0
  },
  costPerItem: {
    type: Number,
    min: 0
  },
  supplierId: {
    type: String,
    required: true,
    index: true
  },
  supplierName: {
    type: String,
    required: true
  },
  supplierProductId: {
    type: String,
    required: true
  },
  images: [{
    url: String,
    alt: String
  }],
  variants: [{
    name: String,
    price: Number,
    sku: String,
    inventoryQuantity: Number,
    availableForSale: {
      type: Boolean,
      default: true
    }
  }],
  rating: {
    average: {
      type: Number,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  tags: [String],
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending', 'deleted'],
    default: 'pending'
  },
  inventoryQuantity: {
    type: Number,
    default: 0
  },
  availableForSale: {
    type: Boolean,
    default: false
  },
  shippingInfo: {
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    shippingTime: String, // e.g., "7-14 days"
    shippingFrom: String // e.g., "China", "US Warehouse"
  },
  seo: {
    title: String,
    description: String,
    keywords: [String]
  },
  aiGenerated: {
    type: Boolean,
    default: false
  },
  aiMarketingContent: {
    headlines: [String],
    descriptions: [String],
    socialMediaPosts: [String]
  },
  salesCount: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  dateAdded: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
productSchema.index({ category: 1, status: 1 });
productSchema.index({ supplierId: 1 });
productSchema.index({ tags: 1 });
productSchema.index({ name: 'text', description: 'text' });

// Method to calculate profit margin
productSchema.methods.calculateProfitMargin = function() {
  if (this.costPerItem && this.price) {
    return ((this.price - this.costPerItem) / this.price) * 100;
  }
  return 0;
};

// Method to check if product is profitable
productSchema.methods.isProfitable = function(minMargin = 20) {
  return this.calculateProfitMargin() >= minMargin;
};

// Virtual for profit amount
productSchema.virtual('profit').get(function() {
  if (this.costPerItem && this.price) {
    return this.price - this.costPerItem;
  }
  return 0;
});

module.exports = mongoose.model('Product', productSchema);