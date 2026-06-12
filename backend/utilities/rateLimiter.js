const rateLimit = require("express-rate-limit");

/**
 * General API rate limiter
 * Use for most routes (admin, teller, kiosk APIs)
 */
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120, // max requests per minute per IP
  message: {
    error: "Too many requests, please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Strict limiter for login routes
 * Prevents brute-force attacks
 */
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // max 10 attempts per 5 minutes
  message: {
    error: "Too many login attempts. Try again later."
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Kiosk / ticket generation limiter
 * Prevent spam ticket generation
 */
const kioskLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: {
    error: "Kiosk rate limit exceeded. Please slow down."
  }
});

module.exports = {
  apiLimiter,
  authLimiter,
  kioskLimiter
};