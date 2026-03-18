const nodemailer = require("nodemailer");

// Create transporter with your email service
const createTransporter = () => {
  // Use Gmail or any other email service
  // For Gmail: You need to enable "Less secure app access" or use an app-specific password
  // For production, consider using SendGrid, AWS SES, or similar services
  
  if (process.env.EMAIL_SERVICE === "gmail") {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  // Default SMTP configuration
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "localhost",
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

const sendEmail = async ({ to, subject, html }) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER || "noreply@vikastelecom.com",
    to,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
    return true;
  } catch (error) {
    console.error("Error sending email:", error.message);
    throw new Error("Failed to send email");
  }
};

const sendPasswordResetEmail = async (email, resetLink) => {
  const subject = "Password Reset Request - Vikas Telecom";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
        <h1 style="color: #333; margin: 0;">Vikas Telecom</h1>
      </div>
      
      <div style="background-color: #fff; padding: 30px; border-radius: 8px; border: 1px solid #e9ecef;">
        <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
          We received a request to reset your password. If you didn't make this request, you can safely ignore this email.
        </p>
        
        <div style="margin: 30px 0;">
          <p style="color: #666; font-size: 14px;">Click the link below to reset your password (this link will expire in 30 minutes):</p>
          <a href="${resetLink}" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0;">
            Reset Password
          </a>
        </div>
        
        <p style="color: #999; font-size: 13px; border-top: 1px solid #e9ecef; padding-top: 20px; margin-top: 30px;">
          Or copy and paste this link in your browser:<br/>
          <code style="background-color: #f8f9fa; padding: 10px; display: block; margin-top: 10px; word-break: break-all;">
            ${resetLink}
          </code>
        </p>
        
        <p style="color: #666; font-size: 14px; margin-top: 20px;">
          If you have any questions, please contact our support team.
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>&copy; 2025 Vikas Telecom. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendEmail({ to: email, subject, html });
};

module.exports = { sendEmail, sendPasswordResetEmail };
