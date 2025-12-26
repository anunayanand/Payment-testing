const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const User = require('../models/User');
const authRole = require('../middleware/authRole');

router.post("/delete-project/:id", authRole("admin"), async (req, res) => {
  try {
    const projectId = req.params.id;

    // Delete the project
    const deletedProject = await Project.findByIdAndDelete(projectId);
    if (!deletedProject) {
      req.flash("error", "Project not found");
      return res.redirect('/admin/projects');
    }

    // Remove project from all users' projectAssigned array
    await User.updateMany(
      { "projectAssigned.projectId": projectId },
      { $pull: { projectAssigned: { projectId: projectId } } }
    );

    // Flash success message with project title
    req.flash("success", `${deletedProject.title} deleted successfully`);
    res.redirect('/admin');
  } catch (err) {
    // console.error(err);
    req.flash("error", "Error deleting project");
    res.redirect('/admin/projects');
  }
});


module.exports = router;
