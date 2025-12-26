const express = require('express');
const router = express.Router();
const User = require("../models/User");
const authRole = require('../middleware/authRole');


// Delete a notice (SuperAdmin only)
router.post('/notice/delete/:index', authRole('superAdmin'), async (req, res) => {
  try {
    const index = parseInt(req.params.index);
    const superAdmin = await User.findById(req.session.user);

    if (superAdmin.notice && superAdmin.notice.length > index) {
      superAdmin.notice.splice(index, 1);
      await superAdmin.save();
      req.flash('success', 'Notice deleted successfully.');
    }

    res.redirect('/superAdmin');
  } catch (err) {
    // console.error(err);
    req.flash('error', 'Failed to delete notice.');
    res.redirect('/superAdmin');
  }
});

module.exports = router;

