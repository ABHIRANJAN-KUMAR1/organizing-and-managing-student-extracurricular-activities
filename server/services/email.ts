import nodemailer from "nodemailer";

// Email configuration
// In production, use environment variables
const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";

// Create transporter (configure for your email provider)
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: false,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

// Email templates
export const sendWelcomeEmail = async (email: string, name: string) => {
  const mailOptions = {
    from: '"Activity Hub Manager" <noreply@activityhub.com>',
    to: email,
    subject: "Welcome to Activity Hub Manager!",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Activity Hub Manager!</h1>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>Thank you for joining Activity Hub Manager! We're excited to have you as part of our community.</p>
              <p>With Activity Hub Manager, you can:</p>
              <ul>
                <li>Browse and join exciting activities</li>
                <li>Track your participation history</li>
                <li>Earn achievements and badges</li>
                <li>Connect with other students</li>
              </ul>
              <p>Start exploring activities today!</p>
              <a href="#" class="button">Browse Activities</a>
            </div>
            <div class="footer">
              <p>2024 Activity Hub Manager. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Failed to send welcome email:", error);
    return false;
  }
};

export const sendActivityReminder = async (
  email: string,
  name: string,
  activityTitle: string,
  activityDate: string,
  venue: string
) => {
  const mailOptions = {
    from: '"Activity Hub Manager" <noreply@activityhub.com>',
    to: email,
    subject: `Reminder: ${activityTitle} is coming up!`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Activity Reminder</h1>
            </div>
            <div class="content">
              <h2>Hi ${name},</h2>
              <p>This is a friendly reminder about an upcoming activity you're registered for:</p>
              <div class="details">
                <h3>${activityTitle}</h3>
                <p><strong>Date:</strong> ${activityDate}</p>
                <p><strong>Venue:</strong> ${venue}</p>
              </div>
              <p>Don't forget to mark your calendar and arrive on time!</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Failed to send reminder email:", error);
    return false;
  }
};

export const sendRegistrationConfirmation = async (
  email: string,
  name: string,
  activityTitle: string,
  activityDate: string
) => {
  const mailOptions = {
    from: '"Activity Hub Manager" <noreply@activityhub.com>',
    to: email,
    subject: `You're registered for ${activityTitle}!`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Registration Confirmed!</h1>
            </div>
            <div class="content">
              <h2>Hi ${name},</h2>
              <p>Great news! You're successfully registered for:</p>
              <h3>${activityTitle}</h3>
              <p><strong>Date:</strong> ${activityDate}</p>
              <p>We look forward to seeing you there!</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Failed to send confirmation email:", error);
    return false;
  }
};

export const sendAchievementNotification = async (
  email: string,
  name: string,
  achievementName: string,
  achievementDescription: string
) => {
  const mailOptions = {
    from: '"Activity Hub Manager" <noreply@activityhub.com>',
    to: email,
    subject: `You've earned a new badge: ${achievementName}!`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #8b5cf6, #6d28d9); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Achievement Unlocked!</h1>
            </div>
            <div class="content">
              <h2>Congratulations ${name}!</h2>
              <p>You've earned a new badge:</p>
              <h3>${achievementName}</h3>
              <p>${achievementDescription}</p>
              <p>Keep up the great work and earn more badges!</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Failed to send achievement email:", error);
    return false;
  }
};

export const sendBroadcastMessage = async (
  emails: string[],
  title: string,
  message: string
) => {
  const mailOptions = {
    from: '"Activity Hub Manager" <noreply@activityhub.com>',
    bcc: emails.join(","),
    subject: title,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${title}</h1>
            </div>
            <div class="content">
              <p>${message}</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Failed to send broadcast email:", error);
    return false;
  }
};

export const sendPasswordResetEmail = async (email: string, resetCode: string) => {
  const mailOptions = {
    from: '"Activity Hub Manager" <noreply@activityhub.com>',
    to: email,
    subject: "Password Reset Request",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .code { font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 20px; background: white; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset</h1>
            </div>
            <div class="content">
              <p>You requested to reset your password. Use the code below:</p>
              <div class="code">${resetCode}</div>
              <p>This code will expire in 10 minutes.</p>
              <p>If you didn't request this, please ignore this email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    return false;
  }
};

