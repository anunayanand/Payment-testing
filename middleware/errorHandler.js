// middleware/errorHandler.js
module.exports = (err, req, res, next) => {
  console.error("🔥 Error:", err);

  // Custom readable message
  let message = "Something went wrong. Please try again.";

  if (err.code === 11000) {
    // Mongo duplicate key (like unique email)
    message = "This email is already registered.";
  } else if (err.name === "ValidationError") {
    message = Object.values(err.errors).map(e => e.message).join(", ");
  } else if (err.name === "CastError") {
    message = "Invalid ID format.";
  }

  req.flash("error", message);
  res.redirect("back"); // stay on same page
};
