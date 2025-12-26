const express = require('express');
const router = express.Router();
const User = require("../models/User");

router.get("/", async (req, res) => {
  
  try{
    const superAdminExists = await User.findOne({ role: "superAdmin" });
  if (!superAdminExists) return res.redirect("/register-superAdmin");
  res.render("index");
  }catch(err){
    // console.error(err);
    req.flash("error", "Server Error");
    res.redirect("/login");
  }
});

module.exports = router;