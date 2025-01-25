const createRateLimiter = require('api-rate-limiter-middleware');

// Apply the rate limiter with a 5-minute window and a maximum of 10 requests per IP
const limiter = createRateLimiter({ minutes: 5, maxRequests: 30 });
module.exports = limiter;

