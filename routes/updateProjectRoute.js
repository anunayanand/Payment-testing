const express = require("express");
const router = express.Router();
const Project = require("../models/Project");
const authRole = require("../middleware/authRole");
const User = require("../models/User");

// Update Project
router.post("/admin/project/update/:id", authRole("admin"), async (req, res) => {
  try {
    const { title, description, week, batch_no ,downloadLink, uploadLink} = req.body;

    await Project.findByIdAndUpdate(req.params.id, {
      title,
      description,
      week: Number(week),
      batch_no : Number(batch_no),
      downloadLink,
      uploadLink
    });

    res.redirect("/admin"); // go back to dashboard
  } catch (err) {
    // console.error("🔥 Error updating project:", err);
    res.status(500).send("Server Error");
  }
});

module.exports = router;