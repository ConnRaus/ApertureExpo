import nodemailer from "nodemailer";

class EmailService {
  constructor() {
    // Create transporter - using environment variables for SMTP configuration
    // For production, you'll need to set these in your .env file
    if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
      const port = parseInt(process.env.SMTP_PORT || "465");
      const secure = process.env.SMTP_SECURE !== "false"; // Default to true (SSL) for port 465

      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtppro.zoho.com",
        port: port,
        secure: secure, // true for 465 (SSL), false for 587 (TLS)
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
        // Connection timeout settings to prevent socket close errors
        connectionTimeout: 60000, // 60 seconds
        greetingTimeout: 30000, // 30 seconds
        socketTimeout: 60000, // 60 seconds
        // For SSL connections (port 465)
        ...(secure && {
          tls: {
            rejectUnauthorized: false, // Allow self-signed certificates if needed
          },
        }),
      });
    } else {
      console.warn(
        "SMTP credentials not configured. Email service will not be available."
      );
      this.transporter = null;
    }
  }

  /**
   * Send a photo report email
   * @param {Object} reportData - Report information
   * @param {string} reportData.photoId - ID of the reported photo
   * @param {string} reportData.photoUrl - URL to the photo
   * @param {string} reportData.reason - Reason for the report
   * @param {string} reportData.customReason - Custom reason if reason is "custom"
   * @param {string} reportData.contestId - Contest ID if photo is in a contest
   * @param {string} reportData.contestTitle - Contest title if photo is in a contest
   * @param {string} reportData.reporterId - ID of the user reporting
   * @param {string} reportData.reporterEmail - Email of the user reporting
   * @param {string} reportData.photoOwnerId - ID of the photo owner
   */
  async sendPhotoReport(reportData) {
    if (!this.transporter) {
      console.error(
        "Email service not configured. Cannot send photo report email."
      );
      throw new Error("Email service is not configured");
    }

    try {
      const {
        photoId,
        photoUrl,
        reason,
        customReason,
        contestId,
        contestTitle,
        reporterId,
        reporterEmail,
        photoOwnerId,
      } = reportData;

      // Build the reason text
      let reasonText = reason;
      if (reason === "other" && customReason) {
        reasonText = `Other: ${customReason}`;
      } else {
        // Map reason codes to readable labels
        const reasonLabels = {
          off_topic: "Off Topic",
          inappropriate: "Inappropriate",
          spam: "Spam",
          copyright: "Copyright Violation",
          other: "Other",
        };
        reasonText = reasonLabels[reason] || reason;
      }

      // Build contest information
      let contestInfo = "Not in a contest";
      if (contestId && contestTitle) {
        contestInfo = `Contest: ${contestTitle} (ID: ${contestId})`;
      }

      // Build email content
      const subject = `Photo Report - Photo ID: ${photoId}`;
      const htmlContent = `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2>Photo Report</h2>
            <p>A photo has been reported on ApertureExpo.</p>
            
            <h3>Report Details</h3>
            <ul>
              <li><strong>Photo ID:</strong> ${photoId}</li>
              <li><strong>Photo URL:</strong> <a href="${photoUrl}">${photoUrl}</a></li>
              <li><strong>Reason:</strong> ${reasonText}</li>
              <li><strong>${contestInfo}</strong></li>
            </ul>
            
            <h3>Reporter Information</h3>
            <ul>
              <li><strong>Reporter ID:</strong> ${reporterId}</li>
              <li><strong>Reporter Email:</strong> ${
                reporterEmail || "Not provided"
              }</li>
            </ul>
            
            <h3>Photo Owner</h3>
            <ul>
              <li><strong>Owner ID:</strong> ${photoOwnerId}</li>
            </ul>
            
            <hr>
            <p style="color: #666; font-size: 12px;">
              This is an automated email from ApertureExpo. Please review the reported photo and take appropriate action.
            </p>
          </body>
        </html>
      `;

      const textContent = `
Photo Report

A photo has been reported on ApertureExpo.

Report Details:
- Photo ID: ${photoId}
- Photo URL: ${photoUrl}
- Reason: ${reasonText}
- ${contestInfo}

Reporter Information:
- Reporter ID: ${reporterId}
- Reporter Email: ${reporterEmail || "Not provided"}

Photo Owner:
- Owner ID: ${photoOwnerId}

This is an automated email from ApertureExpo. Please review the reported photo and take appropriate action.
      `;

      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: "support@apertureexpo.com",
        subject: subject,
        text: textContent,
        html: htmlContent,
        priority: "high",
        headers: {
          "X-Priority": "1", // 1 = High priority
          "X-MSMail-Priority": "High",
          Importance: "high",
        },
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log("Photo report email sent:", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("Error sending photo report email:", error);
      throw new Error(`Failed to send report email: ${error.message}`);
    }
  }
}

export default new EmailService();
