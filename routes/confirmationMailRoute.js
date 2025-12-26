const express = require("express");
const router = express.Router();
const axios = require("axios");
const User = require("../models/User");
const SCRIPT_URL = process.env.SCRIPT_URL;


// ==============================
// HELPER: Send Bulk Confirmation Emails
// ==============================
async function sendBulkConfirmationMails(interns) {
  const sendPromises = interns.map(async (intern) => {
    try {
      const { intern_id, name, email, domain, duration, whatsappLink } = intern;

      await axios.post(SCRIPT_URL, {
        type: 'confirmation',
        email,
        name,
        domain,
        duration,
        whatsappLink
      });

      await User.findOneAndUpdate({ intern_id }, { confirmationSent: true });

      // console.log(`✅ Confirmation mail sent to ${email}`);
      return { status: "fulfilled", email };
    } catch (err) {
      // console.error(`❌ Confirmation mail failed for ${intern.email}:`, err.message);
      return { status: "rejected", email: intern.email, reason: err.message };
    }
  });

  return Promise.all(sendPromises);
}

// ==============================
// ROUTE: Send Confirmation Mail
// ==============================
// ==============================
router.post("/send-confirmation-mail", async (req, res) => {
  if (!SCRIPT_URL) {
    req.flash("error", "Server error: Missing SCRIPT_URL");
    return res.redirect("/superAdmin");
  }

  try {
    const { interns, whatsappLink, batchConfirm } = req.body;

    // Normalize internIds
    const internIds = interns ? (Array.isArray(interns) ? interns : [interns]) : [];

    if (!internIds.length) {
      req.flash("error", "No interns selected.");
      return res.redirect("/superAdmin");
    }

    if (!whatsappLink || whatsappLink.trim() === "") {
      req.flash("error", "WhatsApp link is required.");
      return res.redirect("/superAdmin");
    }

    if (!batchConfirm || batchConfirm === "all") {
      req.flash("error", "Please select a batch before sending mails.");
      return res.redirect("/superAdmin");
    }

    // Update WhatsApp link for selected batch
    const result = await User.updateMany(
      { batch_no: batchConfirm },
      { $set: { whatsappLink } }
    );
    // console.log("WhatsApp link update result:", result);

    // Fetch selected interns
    const internDocs = await User.find({ intern_id: { $in: internIds } });

    // Send mails (using your existing sendBulkConfirmationMails)
    const results = await sendBulkConfirmationMails(internDocs);

    const success = results.filter(r => r.status === "fulfilled").length;
    const failed = results.filter(r => r.status === "rejected").length;

    if (failed === 0) req.flash("success", `✅ ${success} confirmation mails sent successfully.`);
    else req.flash("error", `⚠️ ${success} sent, ${failed} failed.`);

    res.redirect("/superAdmin");
  } catch (err) {
    // console.error("Error in confirmation route:", err);
    req.flash("error", "Server error while sending confirmation mails.");
    res.redirect("/superAdmin");
  }
});


module.exports = router;
