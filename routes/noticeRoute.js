const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authRole = require('../middleware/authRole');

// Add a notice (SuperAdmin only)
router.post('/notice', authRole('superAdmin'), async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      req.flash('error', 'Title and description are required.');
      return res.redirect('/superAdmin');
    }

    const superAdmin = await User.findById(req.session.user);
    superAdmin.notice.push({ title, description });
    await superAdmin.save();

    req.flash('success', 'Notice added successfully.');
    res.redirect('/superAdmin');
  } catch (err) {
    // console.error(err);
    req.flash('error', 'Failed to add notice.');
    res.redirect('/superAdmin');
  }
});

module.exports = router;