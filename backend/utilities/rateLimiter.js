const rateLimit = require("express-rate-limit");

/**
 * General API rate limiter
 * Applied to /api routes (admin, teller, display, kiosk data)
 * Standard: 300 requests per 1 minute per IP
 */
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 300, // max 300 requests per minute per IP
  message: {
    error: "Too many API requests, please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const url = req.originalUrl || req.url || '';
    // Unrestricted retries and calls for tellers
    return url.includes('/tickets') || url.includes('/teller') || url.includes('/check-session') || url.includes('/login');
  }
});

const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // max 5 attempts per 5 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const url = req.originalUrl || req.url || '';
    // Completely exempt teller login from attempt limits and lockout timers
    return url.includes('/login') || url.includes('/teller');
  },
  handler: (req, res) => {
    const resetTime = req.rateLimit?.resetTime || new Date(Date.now() + 5 * 60 * 1000);
    const secondsRemaining = Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000));

    res.status(429).json({
      success: false,
      message: `Too many login attempts. Please wait ${secondsRemaining} seconds before trying again.`,
      error: `Too many login attempts. Please wait ${secondsRemaining} seconds before trying again.`,
      retryAfter: secondsRemaining,
      resetTime: resetTime.getTime()
    });
  }
});

/**
 * Kiosk / ticket generation limiter
 * Prevents spam ticket generation
 * Standard: 30 tickets per minute per IP
 */
const kioskLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: {
    error: "Kiosk ticket limit exceeded. Please wait a moment."
  }
});

/**
 * Reset rate limit counter for IP after successful login
 */
function resetAuthLimit(req) {
  try {
    const key = req.ip;
    if (authLimiter && typeof authLimiter.resetKey === "function") {
      authLimiter.resetKey(key);
    }
  } catch (err) {
    console.error("Failed to reset auth limiter key:", err);
  }
}

module.exports = {
  apiLimiter,
  authLimiter,
  kioskLimiter,
  resetAuthLimit
};