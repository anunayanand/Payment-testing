const express = require('express');
const router = express.Router();
const authRole = require('../middleware/authRole');
const Project = require("../models/Project");

router.post("/submission/:projectId/:internId", authRole("admin"), async (req, res) => {
try{
    const { action } = req.body;
  const { projectId, internId } = req.params;
  const project = await Project.findById(projectId);
  const submission = project.submissions.find(s => s.internId.toString() === internId);
  if (submission) {
    submission.status = action;
    await project.save();
  }
  res.redirect("/admin");
}
catch(err){
    // console.error(err);
    req.flash("error", "Server Error");
    res.redirect("/admin");
  }
});
module.exports = router;