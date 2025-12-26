const express = require("express");
const router = express.Router();
const User = require("../models/User");
const authRole = require("../middleware/authRole");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

// Multer + Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "uploads", // folder in Cloudinary
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});
const upload = multer({ storage });

// Update user route with image upload
router.post(
  "/internUpdate/:id",
  authRole("intern"),
  upload.single("img_url"), // 👈 Multer middleware to handle file upload
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).send("User not found");

      if (user.role !== "intern" || req.session.role !== "intern") {
        return res.status(403).send("Forbidden");
      }

      // If an image is uploaded, Cloudinary URL will be in req.file.path
      let updateData = {};
      if (req.file) {
          // If user already has a picture, delete it from Cloudinary
          if (user.img_public_id) {
            await cloudinary.uploader.destroy(user.img_public_id);
          }

          updateData.img_url = req.file.path;       // Cloudinary URL
          updateData.img_public_id = req.file.filename; // Cloudinary public_id
        }

      await User.findByIdAndUpdate(req.params.id, updateData);

      req.flash("success", "Profile Updated Successfully!");
      return res.redirect("/intern");

    } catch (error) {
      console.error(error);
      res.status(500).send("Server Error");
    }
  }
);

module.exports = router;
