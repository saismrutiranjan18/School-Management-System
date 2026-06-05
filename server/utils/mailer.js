const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

// Send absence alert email to parent
const sendAbsenceAlert = async ({ parentEmail, parentName, studentName, subjectName, date }) => {
  if (!parentEmail) return // skip if no email on record

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: parentEmail,
    subject: `Attendance Alert — ${studentName} was absent`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;">
        <h2 style="color: #2563eb;">Attendance Alert</h2>
        <p>Dear <strong>${parentName || 'Parent/Guardian'}</strong>,</p>
        <p>
          This is to inform you that your ward <strong>${studentName}</strong>
          was marked <strong style="color: #dc2626;">Absent</strong>
          in <strong>${subjectName}</strong> on <strong>${date}</strong>.
        </p>
        <p>If you have any questions, please contact the school.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="font-size: 12px; color: #9ca3af;">
          This is an automated message from the School Management System.
        </p>
      </div>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`📧 Absence alert sent to ${parentEmail}`)
  } catch (err) {
    // Don't crash the request if email fails
    console.error('Email send failed:', err.message)
  }
}

// Send announcement email to a list of recipients
const sendAnnouncementEmail = async ({ recipients, title, body, priority }) => {
  if (!recipients || recipients.length === 0) return

  const priorityLabel = priority === 'urgent'
    ? '🚨 URGENT'
    : priority === 'high'
      ? '⚠️ Important'
      : '📢 Notice'

  const mailOptions = {
    from:    process.env.EMAIL_FROM,
    bcc:     recipients.join(','),   // BCC so recipients don't see each other
    subject: `${priorityLabel}: ${title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <div style="background: #2563eb; padding: 20px 24px; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0; font-size: 18px;">
            ${priorityLabel}: ${title}
          </h2>
        </div>
        <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="color: #1e293b; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${body}</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #94a3b8;">
            This is an automated message from School Management System.
          </p>
        </div>
      </div>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`📧 Announcement email sent to ${recipients.length} recipient(s)`)
  } catch (err) {
    console.error('Announcement email failed:', err.message)
  }
}

module.exports = { sendAbsenceAlert, sendAnnouncementEmail }