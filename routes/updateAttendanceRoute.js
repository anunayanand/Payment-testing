const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authRole = require('../middleware/authRole');

// Update meeting attendance (single or bulk)
router.post('/meetings/update-attendance', authRole('admin'), async (req, res) => {
  try {
    const { attendance, interns } = req.body;

    if (!attendance) {
      req.flash('error', 'Attendance value is required');
      return res.redirect('/admin');
    }

    if (!interns) {
      req.flash('error', 'No interns selected');
      return res.redirect('/admin');
    }

    const internsArr = JSON.parse(interns);

    for(const item of internsArr){
      await User.findOneAndUpdate(
        { _id: item.userId, 'meetings._id': item.meetingId },
        { $set: { 'meetings.$.attendance': attendance } }
      );
    }

    req.flash('success', `Attendance marked as "${attendance}" for selected interns`);
    res.redirect('/admin');

  } catch (err) {
    console.error(err);
    req.flash('error', 'Error updating attendance');
    res.redirect('/admin');
  }
});

module.exports = router;
