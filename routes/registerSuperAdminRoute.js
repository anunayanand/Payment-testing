const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/User");

router.post("/register-superAdmin", async (req, res) => {
 try{
   const { name, email, password,phone } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const superadmin = new User({ name, email, phone,password: hashedPassword, role: "superAdmin" });
  await superadmin.save();
  // console.log(superadmin);
  req.session.user = superadmin._id;
  req.session.role = "superAdmin";
  req.flash("success", "Super Admin registered successfully");
  res.redirect("/superAdmin");
 }catch(err){
    console.error(err);
    req.flash("error", "Super Admin registration failed");
    res.redirect("/register-superAdmin");
  }
});
module.exports = router;