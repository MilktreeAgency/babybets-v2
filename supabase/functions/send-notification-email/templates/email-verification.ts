import { getEmailLayout } from './layout.ts'

export function getEmailVerificationHTML(name: string, data: Record<string, unknown>): string {
  const expiryHours = data.expiryHours || 24
  const content = `
    <h2>Verify Your Email Address</h2>
    <p>Hi ${name},</p>
    <p>Welcome to BabyBets! Please verify your email address to complete your registration and start entering competitions.</p>

    ${data.verificationCode ? `
    <div class="info-box" style="text-align: center;">
      <p style="margin: 0 0 12px 0; color: #71717a; font-size: 14px;">Your verification code:</p>
      <div style="font-size: 36px; font-weight: 700; color: #09090b; letter-spacing: 8px; margin: 16px 0; font-family: 'Courier New', monospace;">
        ${data.verificationCode}
      </div>
      <p style="margin: 12px 0 0 0; font-size: 13px; color: #71717a;">
        This code will expire in <strong>${expiryHours} hours</strong>.
      </p>
    </div>
    ` : ''}

    <div style="text-align: center; margin: 24px 0;">
      <a href="${data.verificationUrl || '#'}" class="button">Verify Email Address</a>
    </div>

    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; margin: 24px 0; border-radius: 8px;">
      <p style="margin: 0; font-size: 14px; color: #166534; line-height: 1.6;">
        <strong>Why verify your email?</strong><br>
        Email verification helps us keep your account secure and ensures you receive important notifications about your competitions and prizes.
      </p>
    </div>

    <p style="font-size: 13px; color: #71717a; line-height: 1.6;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="${data.verificationUrl || '#'}" style="color: #3f3f46; word-break: break-all;">${data.verificationUrl || '#'}</a>
    </p>

    <p style="margin-top: 24px; color: #09090b; font-weight: 600;">The BabyBets Team</p>
  `
  return getEmailLayout('Verify Your Email Address', content)
}

export function getEmailVerificationText(name: string, data: Record<string, unknown>): string {
  const expiryHours = data.expiryHours || 24
  return `
Verify Your Email Address

Hi ${name},

Welcome to BabyBets! Please verify your email address to complete your registration and start entering competitions.

${data.verificationCode ? `Your verification code: ${data.verificationCode}\n\nThis code will expire in ${expiryHours} hours.\n` : ''}

Verify your email address: ${data.verificationUrl || '#'}

Why verify your email?
Email verification helps us keep your account secure and ensures you receive important notifications about your competitions and prizes.

The BabyBets Team
  `
}
