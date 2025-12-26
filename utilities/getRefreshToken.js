const { google } = require("googleapis");

const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);
const authUrl = oAuth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: ["https://www.googleapis.com/auth/gmail.send"]
});

console.log(authUrl);

// // console.log("Open this URL:\n", authUrl);
// async function getRefreshToken() {
//   const { tokens } = await oAuth2Client.getToken(CODE);

//   console.log("\n===============================");
//   console.log("🔥 REFRESH TOKEN (SAVE THIS)");
//   console.log("===============================\n");

//   console.log(tokens.refresh_token);

//   console.log("\n===============================");
// }

// getRefreshToken().catch(console.error);