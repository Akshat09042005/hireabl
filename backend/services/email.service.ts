import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'test@example.com',
    pass: process.env.EMAIL_PASS || 'password',
  },
})

export async function sendManagerVerificationEmail(
  targetEmail: string,
  employeeName: string,
  managerRole: string = 'manager'
) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('[email.service] EMAIL_USER or EMAIL_PASS not set in .env. Skipping email sending.')
    return { success: false, reason: 'Credentials not configured' }
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
  const verificationLink = `${frontendUrl}/employer/onboarding`

  const mailOptions = {
    from: `"Hireabl Administrator" <${process.env.EMAIL_USER}>`,
    to: targetEmail,
    subject: `Action Required: Verify your employee ${employeeName} on Hireabl`,
    text: `Hello,\n\nYour employee ${employeeName} has registered on Hireabl and mentioned you as their ${managerRole}.\n\nPlease click the link below to verify their account and complete your employer onboarding:\n${verificationLink}\n\nThanks,\nThe Hireabl Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #111827; margin-top: 0;">Hireabl Verification Request</h2>
        <p style="color: #374151;">Hello,</p>
        <p style="color: #374151;">Your employee, <strong>${employeeName}</strong>, has registered on Hireabl and mentioned you as their ${managerRole}.</p>
        <p style="color: #374151;">Please click the button below to verify their account and claim your company:</p>
        <div style="margin: 30px 0;">
          <a href="${verificationLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Employee</a>
        </div>
        <p style="color: #6b7280; font-size: 13px; border-top: 1px solid #e5e7eb; padding-top: 15px; margin-bottom: 0;">
          Thanks,<br>The Hireabl Team
        </p>
      </div>
    `,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log(`[email.service] Email sent to ${targetEmail}: ${info.response}`)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error(`[email.service] Error sending email to ${targetEmail}:`, error)
    return { success: false, error }
  }
}
