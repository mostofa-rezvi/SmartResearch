const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

/**
 * Email Service — Nodemailer wrapper for transactional emails.
 * Reads credentials from environment variables:
 *   SMTP_HOST  — e.g. smtp.gmail.com
 *   SMTP_PORT  — e.g. 587
 *   SMTP_USER  — Gmail address or SMTP username
 *   SMTP_PASS  — Gmail app password or SMTP password
 *   EMAIL_FROM — Display "From" address
 */

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    // Only build the transporter once (lazy singleton)
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      logger.warn('[EMAIL] SMTP_USER or SMTP_PASS not set — email sending disabled');
      return null;
    }

    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for others
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
};

/**
 * Send a transactional email.
 * @param {string} to      — Recipient email address
 * @param {string} subject — Email subject line
 * @param {string} html    — HTML email body
 */
const sendMail = async (to, subject, html) => {
  const mailer = getTransporter();
  if (!mailer) {
    logger.warn(`[EMAIL] Skipping email to ${to} — SMTP not configured`);
    return;
  }

  try {
    const info = await mailer.sendMail({
      from: process.env.EMAIL_FROM || `"ResearchBridge" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    logger.info(`[EMAIL] Sent to ${to} | MessageId: ${info.messageId}`);
    return info;
  } catch (err) {
    logger.error(`[EMAIL] Failed to send to ${to}:`, err.message);
    // Non-throwing — email failure should not break the main request flow
  }
};

/**
 * Pre-built email templates for common notification types.
 */
const templates = {
  mentorshipRequest: (menteeName) => ({
    subject: `New mentorship request from ${menteeName} on ResearchBridge`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 24px;">
        <h2 style="color: #4F46E5;">New Mentorship Request</h2>
        <p><strong>${menteeName}</strong> has requested you as a mentor on <strong>ResearchBridge</strong>.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/notifications"
           style="display:inline-block;padding:12px 24px;background:#4F46E5;color:#fff;border-radius:8px;text-decoration:none;margin-top:16px;">
          View Request
        </a>
        <p style="color:#888;margin-top:24px;font-size:12px;">ResearchBridge — Smart Research Collaboration Platform</p>
      </div>
    `,
  }),

  connectionRequest: (fromName) => ({
    subject: `${fromName} wants to connect on ResearchBridge`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 24px;">
        <h2 style="color: #4F46E5;">New Connection Request</h2>
        <p><strong>${fromName}</strong> has sent you a connection request on <strong>ResearchBridge</strong>.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/notifications"
           style="display:inline-block;padding:12px 24px;background:#4F46E5;color:#fff;border-radius:8px;text-decoration:none;margin-top:16px;">
          View Request
        </a>
        <p style="color:#888;margin-top:24px;font-size:12px;">ResearchBridge — Smart Research Collaboration Platform</p>
      </div>
    `,
  }),

  connectionAccepted: (fromName) => ({
    subject: `${fromName} accepted your connection on ResearchBridge`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 24px;">
        <h2 style="color: #10B981;">Connection Accepted!</h2>
        <p><strong>${fromName}</strong> has accepted your connection request.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/discovery"
           style="display:inline-block;padding:12px 24px;background:#10B981;color:#fff;border-radius:8px;text-decoration:none;margin-top:16px;">
          View Profile
        </a>
        <p style="color:#888;margin-top:24px;font-size:12px;">ResearchBridge — Smart Research Collaboration Platform</p>
      </div>
    `,
  }),

  mentorshipAccepted: (mentorName) => ({
    subject: `Your mentorship request was accepted by ${mentorName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 24px;">
        <h2 style="color: #F59E0B;">Mentorship Confirmed!</h2>
        <p><strong>${mentorName}</strong> has accepted your mentorship request on <strong>ResearchBridge</strong>.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/profile"
           style="display:inline-block;padding:12px 24px;background:#F59E0B;color:#fff;border-radius:8px;text-decoration:none;margin-top:16px;">
          View in Profile
        </a>
        <p style="color:#888;margin-top:24px;font-size:12px;">ResearchBridge — Smart Research Collaboration Platform</p>
      </div>
    `,
  }),

  forumReply: (replierName, postTitle) => ({
    subject: `${replierName} replied to your post on ResearchBridge`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 24px;">
        <h2 style="color: #6366F1;">New Reply on Your Post</h2>
        <p><strong>${replierName}</strong> replied to your post: <em>"${postTitle}"</em></p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/community"
           style="display:inline-block;padding:12px 24px;background:#6366F1;color:#fff;border-radius:8px;text-decoration:none;margin-top:16px;">
          View Reply
        </a>
        <p style="color:#888;margin-top:24px;font-size:12px;">ResearchBridge — Smart Research Collaboration Platform</p>
      </div>
    `,
  }),
};

module.exports = { sendMail, templates };
