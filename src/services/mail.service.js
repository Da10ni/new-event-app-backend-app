import transporter from '../config/mail.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: `"Events Platform" <${config.mail.from}>`,
      to,
      subject,
      html,
    });
    logger.info(`Email sent to ${to}: ${subject}`);
  } catch (error) {
    logger.error(`Email failed to ${to}:`, error.message);
  }
};

export const sendOTPEmail = async (email, otp, purpose) => {
  const subjects = {
    email_verification: 'Verify Your Email - Events Platform',
    password_reset: 'Reset Your Password - Events Platform',
  };

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #044A1A;">Events Platform</h2>
      <p>Your OTP code is:</p>
      <h1 style="color: #222; letter-spacing: 8px; font-size: 36px;">${otp}</h1>
      <p>This code expires in ${config.otp.expiresInMinutes} minutes.</p>
      <p style="color: #717171; font-size: 12px;">If you didn't request this, please ignore this email.</p>
    </div>
  `;

  await sendEmail({ to: email, subject: subjects[purpose] || 'OTP Code', html });
};

export const sendVendorApprovalEmail = async (email, businessName) => {
  const providerPortalUrl = config.app?.providerPortalUrl || 'http://localhost:5174';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #044A1A; margin: 0;">Events Platform</h1>
      </div>

      <div style="background: linear-gradient(135deg, #044A1A 0%, #0D7C5F 100%); padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 30px;">
        <h2 style="color: #fff; margin: 0 0 10px 0;">Congratulations! 🎉</h2>
        <p style="color: #fff; opacity: 0.9; margin: 0;">Your vendor account has been approved</p>
      </div>

      <p style="color: #333; font-size: 16px; line-height: 1.6;">
        Dear <strong>${businessName}</strong>,
      </p>

      <p style="color: #333; font-size: 16px; line-height: 1.6;">
        Great news! Your vendor registration has been reviewed and approved by our admin team.
        You can now access your Provider Dashboard and start listing your services.
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${providerPortalUrl}/login"
           style="background: #044A1A; color: #fff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
          Go to Provider Dashboard
        </a>
      </div>

      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #044A1A; margin: 0 0 15px 0; font-size: 16px;">Next Steps:</h3>
        <ul style="color: #555; margin: 0; padding-left: 20px; line-height: 1.8;">
          <li>Log in to your Provider Dashboard</li>
          <li>Complete your business profile</li>
          <li>Add your first service listing</li>
          <li>Set your availability</li>
          <li>Start receiving booking requests!</li>
        </ul>
      </div>

      <p style="color: #717171; font-size: 14px; line-height: 1.6;">
        If you have any questions, feel free to contact our support team.
      </p>

      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

      <p style="color: #999; font-size: 12px; text-align: center;">
        © ${new Date().getFullYear()} Events Platform. All rights reserved.
      </p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: '🎉 Your Vendor Account is Approved - Events Platform',
    html
  });
};

export const sendVendorRejectionEmail = async (email, businessName, reason) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #044A1A; margin: 0;">Events Platform</h1>
      </div>

      <p style="color: #333; font-size: 16px; line-height: 1.6;">
        Dear <strong>${businessName}</strong>,
      </p>

      <p style="color: #333; font-size: 16px; line-height: 1.6;">
        Thank you for your interest in becoming a vendor on Events Platform.
        Unfortunately, we are unable to approve your registration at this time.
      </p>

      ${reason ? `
      <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
        <h4 style="color: #856404; margin: 0 0 10px 0;">Reason:</h4>
        <p style="color: #856404; margin: 0;">${reason}</p>
      </div>
      ` : ''}

      <p style="color: #333; font-size: 16px; line-height: 1.6;">
        You may address the issues mentioned above and reapply. If you believe this was a mistake or have questions,
        please contact our support team.
      </p>

      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

      <p style="color: #999; font-size: 12px; text-align: center;">
        © ${new Date().getFullYear()} Events Platform. All rights reserved.
      </p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: 'Vendor Registration Update - Events Platform',
    html
  });
};
