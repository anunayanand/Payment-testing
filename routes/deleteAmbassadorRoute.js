const express = require('express');
const router = express.Router();
const Ambassador = require("../models/Ambassador");
const authRole = require('../middleware/authRole');

router.post("/delete-ambassador/:id", authRole("superAdmin"), async (req, res) => {
  try {
    const ambassador = await Ambassador.findById(req.params.id);

    if (!ambassador) {
      req.flash('error', 'Ambassador not found');
      return res.redirect("/superAdmin");
    }

    await Ambassador.findByIdAndDelete(req.params.id);

    req.flash('success', `Ambassador "${ambassador.name}" Deleted Successfully!`);

    // Redirect back to the ambassador section on SuperAdmin dashboard
    return res.redirect("/superAdmin#viewAmbassadors");

  } catch (err) {
    // console.error(err);
    req.flash('error', 'Failed to Delete Ambassador');
    return res.redirect("/superAdmin");
  }
});

module.exports = router;
