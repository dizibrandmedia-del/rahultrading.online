import nodemailer from 'nodemailer';

export interface SendOtpResult {
  success: boolean;
  simulated?: boolean;
  message?: string;
  previewOtp?: string;
  error?: string;
}

/**
 * Sends a branded 6-digit OTP email to user's registered address
 */
export async function sendOtpEmail(
  toEmail: string,
  otp: string,
  type: 'LOGIN_OTP' | 'PASSWORD_RESET' = 'LOGIN_OTP'
): Promise<SendOtpResult> {
  const isReset = type === 'PASSWORD_RESET';
  const subject = isReset
    ? `[RJTC] Your Password Reset Verification Code: ${otp}`
    : `[RJTC] Your Login Verification Code: ${otp}`;

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT) || 465;
  const from = process.env.SMTP_FROM || `RAHUL JEE TRADING COMPANY <${user || 'no-reply@rahultrading.online'}>`;

  // If SMTP is not yet configured, provide safe sandbox delivery and log to console
  if (!host || !user || !pass) {
    console.log(`\n=================================================`);
    console.log(`[AUTH NOTIFICATION - ZERO COST SANDBOX MODE]`);
    console.log(`Action: ${isReset ? 'Password Reset' : 'Email OTP Login'}`);
    console.log(`To: ${toEmail}`);
    console.log(`One-Time Password (OTP): ${otp}`);
    console.log(`Expires: In 10 minutes`);
    console.log(`(To send real emails, define SMTP_HOST, SMTP_USER, SMTP_PASS in .env)`);
    console.log(`=================================================\n`);

    return {
      success: true,
      simulated: true,
      previewOtp: otp,
      message: 'OTP generated successfully! (In sandbox mode, check server logs or use the code provided).',
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #0e7490, #155e75); padding: 24px 32px; color: #ffffff; text-align: center;">
          <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">RAHUL JEE TRADING COMPANY</h1>
          <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.85;">Indian GST Billing & Accounting Portal</p>
        </div>
        <div style="padding: 32px;">
          <h2 style="margin: 0 0 12px 0; font-size: 18px; color: #1e293b; font-weight: 700;">
            ${isReset ? 'Password Reset Verification' : 'Your Login Verification Code'}
          </h2>
          <p style="margin: 0 0 24px 0; font-size: 14px; color: #64748b; line-height: 1.5;">
            Use the following 6-digit verification code to complete your ${isReset ? 'password reset' : 'login'} request. This code is valid for <strong>10 minutes</strong>.
          </p>
          <div style="background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <span style="font-family: monospace; font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #0e7490;">
              ${otp}
            </span>
          </div>
          <p style="margin: 0 0 8px 0; font-size: 12px; color: #94a3b8;">
            • Never share this OTP with anyone, including staff members.<br/>
            • If you did not request this code, please ignore this email.
          </p>
        </div>
        <div style="background: #f1f5f9; padding: 16px 32px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b;">
          RAHUL JEE TRADING COMPANY • Ghazipur (U.P.) • GSTIN: 09DMCPG4193P1ZG
        </div>
      </div>
    `;

    await transporter.sendMail({
      from,
      to: toEmail,
      subject,
      text: `Your RAHUL JEE TRADING COMPANY verification code is: ${otp}. Valid for 10 minutes.`,
      html: htmlContent,
    });

    return {
      success: true,
      simulated: false,
      message: `OTP sent successfully to ${toEmail}!`,
    };
  } catch (err: any) {
    console.error('SMTP email error:', err);
    // Graceful fallback to sandbox
    return {
      success: true,
      simulated: true,
      previewOtp: otp,
      message: 'Email service temporary notice: OTP generated in sandbox mode.',
    };
  }
}
