import nodemailer from 'nodemailer';

// Helper function to create the email content (HTML and plain text)
function createEmailContent(email, resetUrl) {
  const subject = 'Password Reset Request - EasySharer';
  
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 300;">EasySharer</h1>
          <p style="color: #ffffff; margin: 10px 0 0 0; opacity: 0.9;">Secure File Sharing</p>
        </div>
        
        <div style="padding: 40px 30px;">
          <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px; font-weight: 400;">Password Reset Request</h2>
          
          <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
            We received a request to reset your password. Click the button below to create a new password:
          </p>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="${resetUrl}" 
                style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px;
                      font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
              Reset My Password
            </a>
          </div>
          
          <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 30px 0; border-radius: 4px;">
            <p style="margin: 0; color: #856404; font-weight: 600;">
              ⚠️ Security Notice
            </p>
            <p style="margin: 5px 0 0 0; color: #856404; font-size: 14px;">
              This link will expire in 15 minutes for your security.
            </p>
          </div>
          
          <p style="color: #999999; font-size: 14px; line-height: 1.5; margin: 30px 0 0 0;">
            If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
          </p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px 30px; border-top: 1px solid #e9ecef;">
          <p style="color: #6c757d; font-size: 12px; margin: 0 0 10px 0;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="color: #007bff; font-size: 12px; word-break: break-all; margin: 0;">
            ${resetUrl}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textBody = `
EasySharer - Password Reset Request

We received a request to reset your password.

Please visit the following link to reset your password:
${resetUrl}

This link will expire in 15 minutes for your security.

If you didn't request this password reset, please ignore this email.

---
EasySharer Team
  `;

  return { subject, htmlBody, textBody, destination: email };
}


export async function sendPasswordResetEmail(email, resetToken, env) {
  try {
    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const emailContent = createEmailContent(email, resetUrl);

    // 1. Create a Nodemailer transporter configured for SES SMTP
    // Using port 465 with secure: true for implicit SSL/TLS
    // You could also use port 587 with secure: false and requireTLS: true for STARTTLS
    const transporter = nodemailer.createTransport({
      host: `email-smtp.${env.AWS_REGION}.amazonaws.com`, // SES SMTP endpoint
      port: 465, 
      secure: true, // Use SSL/TLS
      auth: {
        user: env.AWS_ACCESS_KEY_ID, // Your SES SMTP Username (e.g., AKIA...)
        pass: env.AWS_SECRET_ACCESS_KEY, // Your SES SMTP Password (the long string you copied)
      },
      // Optional: Add timeouts if you experience connection issues.
      // socketTimeout: 10000, // 10 seconds
      // connectionTimeout: 10000, // 10 seconds
    });

    // 2. Send the email using the transporter
    const info = await transporter.sendMail({
      from: env.SENDER_EMAIL, // This MUST be a VERIFIED email identity in your AWS SES account
      to: emailContent.destination,
      subject: emailContent.subject,
      html: emailContent.htmlBody,
      text: emailContent.textBody,
    });

    return true;
  } catch (error) {
    // In production, consider using a logging service instead of console.error
    console.error('Email sending error (SMTP):', error);
    throw error;
  }
}