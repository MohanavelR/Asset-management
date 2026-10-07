
const nodemailer = require("nodemailer");
const logger = require("../helpers/logger");
//========== Config ================ 
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD
  },
});


// =========== Sender Helper Function ============
async function sendEmail({ to, subject, text, html }) {
  try {
    const info = await transporter.sendMail({
      from: `"Test Email Service" <${process.env.EMAIL}>`,
      to,
      subject,
      text,
      html,
    });
    logger.debug("Email sent:", info.messageId);
    return info;
  } catch (err) {
    logger.error("Failed to send email:", err.message);
    throw err;
  }
}

module.exports ={
sendEmail ,transporter
} ;

