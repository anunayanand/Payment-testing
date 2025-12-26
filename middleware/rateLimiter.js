const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,              // 5 attempts per minute
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res /*, next */) => {
    req.flash("error", "Too many login attempts. Please try again later.");
    return res.redirect("/");
  }
});

module.exports = loginLimiter;