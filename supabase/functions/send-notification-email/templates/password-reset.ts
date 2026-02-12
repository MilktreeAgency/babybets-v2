import { getEmailLayout } from './layout.ts'

export function getPasswordResetHTML(name: string, data: Record<string, unknown>): string {
  const expiryHours = data.expiryHours || 24
  const content = `
    <h2>Reset Your Password</h2>
    <p>Hi ${name},</p>
    <p>We received a request to reset your password for your BabyBets account.</p>

    <div class="info-box">
      <p style="margin: 0 0 12px 0; color: #09090b; font-weight: 600;">Click the button below to create a new password:</p>
      <a href="${data.resetUrl || '#'}" class="button" style="display: inline-block; margin: 12px 0;">Reset Password</a>
      <p style="margin: 12px 0 0 0; font-size: 13px; color: #71717a;">
        This link will expire in <strong>${expiryHours} hours</strong>.
      </p>
    </div>

    <div style="background-color: #fffbeb; border: 1px solid #fef3c7; padding: 20px; margin: 24px 0; border-radius: 8px;">
      <p style="margin: 0; font-size: 14px; color: #78350f; line-height: 1.6;">
        <strong>Didn't request this?</strong><br>
        If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
      </p>
    </div>

    <p style="font-size: 13px; color: #71717a; line-height: 1.6;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="${data.resetUrl || '#'}" style="color: #3f3f46; word-break: break-all;">${data.resetUrl || '#'}</a>
    </p>

    <p style="margin-top: 24px; color: #09090b; font-weight: 600;">The BabyBets Team</p>
  `
  return getEmailLayout('Reset Your Password', content)
}

export function getPasswordResetText(name: string, data: Record<string, unknown>): string {
  const expiryHours = data.expiryHours || 24
  return `
Reset Your Password

Hi ${name},

We received a request to reset your password for your BabyBets account.

Click the link below to create a new password:
${data.resetUrl || '#'}

This link will expire in ${expiryHours} hours.

Didn't request this?
If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

The BabyBets Team
  `
}
