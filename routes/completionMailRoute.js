const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { google } = require("googleapis");

// ==============================
// CONFIGURATION
// ==============================
const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

oAuth2Client.setCredentials({
  refresh_token: process.env.REFRESH_TOKEN
});

const gmail = google.gmail({
  version: "v1",
  auth: oAuth2Client
});

// ==============================
// HELPER: Encode Email for Gmail API
// ==============================
function makeBody(to, from, subject, message) {
  const str = [
    "Content-Type: text/html; charset=\"UTF-8\"\n",
    "MIME-Version: 1.0\n",
    "Content-Transfer-Encoding: 7bit\n",
    "to: ", to, "\n",
    "from: ", from, "\n",
    "subject: ", subject, "\n\n",
    message
  ].join('');

  const encodedMail = Buffer.from(str).toString("base64").replace(/\+/g, '-').replace(/\//g, '_');
  return encodedMail;
}

// ==============================
// HELPER: Send Bulk Completion Emails
// ==============================
async function sendBulkCompletionMails(interns) {
  const sendPromises = interns.map(async (intern) => {
    try {
      const { intern_id, name, email, domain } = intern;

      const subject = `Congratulations on Completing Your Internship at Rixi Lab`;
      const body = `
       <html>
  <body style="font-family: Arial, sans-serif; background-color: #f7f3f1; padding: 20px;">
    <div style="max-width: 650px; margin: auto; background: #ffffff; border-radius: 10px; 
                box-shadow: 0 2px 10px rgba(0,0,0,0.1); padding: 35px; text-align: left;">
      
      <!-- 🎉 Header -->
      <h2 style="color: #2c3e50; text-align: center; margin-bottom: 10px;">
         Congratulations, ${name}! 
      </h2>
      <p style="text-align: center; font-size: 15px; color: #666; margin-top: 0;">
        Internship Completion - Rixi Lab
      </p>
      
      <!-- 📝 Main Message -->
      <p style="font-size: 15px; color: #333; line-height: 1.6;">
        We are delighted to inform you that your internship with <b>Rixi Lab</b> in the domain of 
        <b>${domain}</b> has been <b style="color: green;">successfully completed</b>.  
        Congratulations on reaching this important milestone in your journey!
      </p>
      
      <!-- 🎓 Certificate Block -->
      <div style="background: #f7f3f1; border-left: 5px solid #ff6600; padding: 14px 16px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #333;">
          ✅ Your <b>Internship Certificate</b> is now available on your dashboard.<br>
          🔗 Login and download it anytime.
        </p>
      </div>
      
      <!-- ⭐ Canva Premium -->
      <p style="font-size: 15px; color: #333; line-height: 1.6;">
        As a token of appreciation, we are excited to provide you with <b style="color:#ff6600;">Canva Premium access for 1 year</b>.  
        Simply log in to <a href="https://www.canva.com" style="color:#3498db; text-decoration:none;">canva.com</a>  
        using your Rixi Lab registered email ID and start enjoying all the premium features.
      </p>
      
      <!-- 🔗 Button -->
      <p style="text-align: center; margin: 25px 0;">
        <a href="https://rixilab.tech" 
           style="background: #ff6600; color: white; text-decoration: none; 
                  padding: 12px 24px; border-radius: 6px; font-weight: bold; 
                  display: inline-block;">
          🔑 Login & Download Certificate
        </a>
      </p>

      <!-- 💼 LinkedIn Encourage -->
      <p style="font-size: 15px; color: #333; line-height: 1.6;">
        We encourage you to <b>share your Internship Certificate on LinkedIn</b> and tag 
        <a href="https://www.linkedin.com/company/rixilab" style="color:#3498db; text-decoration:none;">Rixi Lab</a> in your post.  
        This will help you showcase your achievement and expand your professional network. 
      </p>
      
      <!-- ❤️ Appreciation -->
      <p style="font-size: 15px; color: #333; line-height: 1.6;">
        We sincerely appreciate your <b>hard work, dedication, and contributions</b> during your internship.  
        Your journey with us has been truly valuable, and we are confident you will achieve even greater milestones in the future.
      </p>

      <p style="font-size: 15px; color: #2c3e50; font-weight: bold; margin-top: 20px;">
        Once again, congratulations and best of luck ahead! 🌟
      </p>

      <hr style="border:none; border-top:1px solid #ddd; margin:25px 0;">
      
      <!-- ✅ Signature -->
      <p style="font-size: 14px; color: #333; margin-bottom: 5px;">
        Thanks & Regards,<br>
        <b style="font-size:16px; font-weight:700; color:#2c3e50;">Rixi Lab</b><br>
        <i>"Rethink Innovate eXecute Inspire"</i>
      </p>

      <!-- ✅ Social Media -->
      <p style="text-align: center; margin-top: 15px;">
        <a href="https://www.instagram.com/rixilab.in" target="_blank" style="margin: 0 10px;">
          <img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" 
               alt="Instagram" width="26" style="vertical-align: middle;">
        </a>
        <a href="https://www.linkedin.com/company/rixilab" target="_blank" style="margin: 0 10px;">
          <img src="https://cdn-icons-png.flaticon.com/512/174/174857.png" 
               alt="LinkedIn" width="26" style="vertical-align: middle;">
        </a>
        <a href="https://www.facebook.com/rixilab" target="_blank" style="margin: 0 10px;">
          <img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" 
               alt="Facebook" width="26" style="vertical-align: middle;">
        </a>
      </p>

      <p style="font-size: 12px; color: #888; text-align: center; margin-top: 20px;">
        © 2025 Rixi Lab | <a href="https://rixilab.tech" style="color:#3498db; text-decoration:none;">www.rixilab.tech</a>
      </p>
    </div>
  </body>
</html>
       
      `;

      const encodedMail = makeBody(email, process.env.EMAIL, subject, body);
      await gmail.users.messages.send({
        userId: 'me',
        resource: {
          raw: encodedMail
        }
      });

      await User.findOneAndUpdate({ intern_id }, { completionSent: true });

      // console.log(`✅ Completion mail sent to ${email}`);
      return { status: "fulfilled", email };
    } catch (err) {
      // console.error(`❌ Completion mail failed for ${intern.email}:`, err.message);
      return { status: "rejected", email: intern.email, reason: err.message };
    }
  });

  return Promise.all(sendPromises);
}

// ==============================
// ROUTE: Send Completion Mail
// ==============================
router.post("/send-completion-mail", async (req, res) => {
  try {
    const interns = req.body.interns; // array of intern_id

    if (!interns || interns.length === 0) {
      req.flash("error", "No interns selected for completion mail.");
      return res.redirect("/superAdmin");
    }

    const internDocs = await User.find({ intern_id: { $in: interns } });
    const results = await sendBulkCompletionMails(internDocs);

    const success = results.filter(r => r.status === "fulfilled").length;
    const failed = results.filter(r => r.status === "rejected").length;

    if (failed === 0) {
      req.flash("success", `✅ ${success} completion mails sent successfully.`);
    } else {
      req.flash("error", `⚠️ ${success} sent, ${failed} failed. Check logs.`);
    }

    res.redirect("/superAdmin");
  } catch (err) {
    // console.error("Error in completion route:", err);
    req.flash("error", "Server error while sending completion mails.");
    res.redirect("/superAdmin");
  }
});

module.exports = router;

router.get("/test-completion-mail", async (req, res) => {
  try {
    const testIntern = [
      {
        intern_id: "RL26010112",
        name: "Anunay Anand",
        email: "anunayanand2@gmail.com",
        domain: "Web Development"
      }
    ];

    const result = await sendBulkCompletionMails(testIntern);

    console.log(result);
    res.send("✅ Test completion mail sent. Check inbox.");

  } catch (err) {
    console.error(err);
    res.send("❌ Failed to send test mail.");
  }
});
