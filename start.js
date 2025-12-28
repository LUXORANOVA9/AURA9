// Startup script for the autonomous dropshipping store
console.log('Starting Autonomous Dropshipping Store...');
console.log('=====================================');

// Check if we can run the full version or simplified version
const fs = require('fs');

// Try to run the simple server
try {
  console.log('Starting simplified server (using core modules only)...');
  require('./simple-server.js');
  console.log('Simplified server running successfully!');
} catch (error) {
  console.error('Error starting simplified server:', error.message);
  console.log('Please make sure you have Node.js installed.');
}