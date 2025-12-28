// Simplified server for the autonomous dropshipping store
// This version doesn't require external dependencies beyond Node.js core modules

const http = require('http');
const url = require('url');
const querystring = require('querystring');

// In-memory data stores (in production, use a proper database)
let products = [
  {
    id: '1',
    name: 'Smartphone Holder',
    description: 'Adjustable phone mount for car dashboard',
    category: 'Electronics',
    price: 19.99,
    costPerItem: 8.50,
    supplierId: 'aliexpress-123',
    supplierName: 'AliExpress',
    supplierProductId: 'AE-001',
    images: [
      { url: 'https://example.com/phone-holder-1.jpg', alt: 'Phone holder front view' }
    ],
    rating: { average: 4.7, count: 128 },
    tags: ['car', 'electronics', 'phone'],
    status: 'active',
    inventoryQuantity: 150,
    availableForSale: true,
    salesCount: 89
  },
  {
    id: '2',
    name: 'Wireless Charging Pad',
    description: 'Fast charging pad compatible with all Qi-enabled devices',
    category: 'Electronics',
    price: 24.99,
    costPerItem: 10.25,
    supplierId: 'aliexpress-456',
    supplierName: 'AliExpress',
    supplierProductId: 'AE-002',
    images: [
      { url: 'https://example.com/charger-1.jpg', alt: 'Wireless charger' }
    ],
    rating: { average: 4.5, count: 92 },
    tags: ['charging', 'wireless', 'electronics'],
    status: 'active',
    inventoryQuantity: 200,
    availableForSale: true,
    salesCount: 156
  }
];

let orders = [
  {
    id: '1',
    orderNumber: '#1001',
    customer: {
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe'
    },
    items: [
      {
        product: '1',
        name: 'Smartphone Holder',
        price: 19.99,
        quantity: 1,
        total: 19.99
      }
    ],
    totalAmount: 19.99,
    status: 'shipped',
    fulfillmentStatus: 'fulfilled',
    paymentStatus: 'paid',
    createdAt: new Date().toISOString()
  }
];

// Simple router
function router(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API endpoints
  if (path.startsWith('/api/')) {
    // Products API
    if (path === '/api/products' && method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        products,
        total: products.length
      }));
    } 
    else if (path.match(/^\/api\/products\/\w+$/) && method === 'GET') {
      const id = path.split('/')[3];
      const product = products.find(p => p.id === id);
      
      if (product) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(product));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Product not found' }));
      }
    }
    // Orders API
    else if (path === '/api/orders' && method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        orders,
        total: orders.length
      }));
    }
    // Health check
    else if (path === '/health' && method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        services: {
          database: 'connected',
          ai: 'ready',
          automation: 'running'
        }
      }));
    }
    // Root API info
    else if (path === '/api' && method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        message: 'Autonomous Dropshipping Store API',
        version: '1.0.0',
        endpoints: {
          products: '/api/products',
          orders: '/api/orders',
          health: '/health'
        }
      }));
    }
    else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Endpoint not found' }));
    }
  } 
  // Main page
  else if (path === '/' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Autonomous Dropshipping Store</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .container { max-width: 800px; margin: 0 auto; }
          .feature { background: #f5f5f5; padding: 20px; margin: 10px 0; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Autonomous Dropshipping Store</h1>
          <p>Welcome to the AI-powered autonomous dropshipping platform.</p>
          
          <div class="feature">
            <h2>Key Features</h2>
            <ul>
              <li>AI-powered product sourcing and validation</li>
              <li>Automated inventory management</li>
              <li>Intelligent pricing based on market conditions</li>
              <li>Automated marketing campaigns</li>
              <li>Order fulfillment automation</li>
              <li>AI customer support</li>
            </ul>
          </div>
          
          <div class="feature">
            <h2>API Endpoints</h2>
            <ul>
              <li>GET <a href="/api/products">/api/products</a> - List all products</li>
              <li>GET <a href="/api/orders">/api/orders</a> - List all orders</li>
              <li>GET <a href="/health">/health</a> - Health check</li>
            </ul>
          </div>
        </div>
      </body>
      </html>
    `);
  }
  else {
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Page Not Found</title>
      </head>
      <body>
        <h1>404 - Page Not Found</h1>
        <p><a href="/">Go back home</a></p>
      </body>
      </html>
    `);
  }
}

// Create server
const server = http.createServer(router);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Autonomous Dropshipping Store server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to see the application`);
});

module.exports = server;