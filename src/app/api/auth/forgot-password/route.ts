import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateNumericOtp, hashToken, ensureOtpTable } from '@/lib/auth';
import { sendOtpEmail } from '@/lib/mailer';

export async function POST(req: Request) {
  try {
    await ensureOtpTable();
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Registered email address is required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user exists
    const user = await prisma.user.findFirst({
      where: { email: cleanEmail },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No account registered with this email address.' },
        { status: 404 }
      );
    }

    // Rate Limiting: 60-second cooldown
    const recentOtp = await prisma.authOtp.findFirst({
      where: {
        identifier: cleanEmail,
        type: 'PASSWORD_RESET',
        createdAt: {
          gte: new Date(Date.now() - 60 * 1000),
        },
      },
    });

    if (recentOtp) {
      const waitSeconds = Math.max(1, Math.ceil((recentOtp.createdAt.getTime() + 60 * 1000 - Date.now()) / 1000));
      return NextResponse.json(
        { success: false, error: `Please wait ${waitSeconds} seconds before requesting another reset code.` },
        { status: 429 }
      );
    }

    // Clear old reset OTPs
    await prisma.authOtp.deleteMany({
      where: {
        identifier: cleanEmail,
        type: 'PASSWORD_RESET',
      },
    });

    // Generate fresh OTP
    const otp = generateNumericOtp();
    const tokenHash = hashToken(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await prisma.authOtp.create({
      data: {
        identifier: cleanEmail,
        type: 'PASSWORD_RESET',
        tokenHash,
        expiresAt,
        attempts: 0,
      },
    });

    // Send email
    const sendResult = await sendOtpEmail(cleanEmail, otp, 'PASSWORD_RESET');

    return NextResponse.json({
      success: true,
      message: 'Password reset code sent to your registered email.',
      cooldownSeconds: 60,
    });
  } catch (err: any) {
    console.error('Forgot password error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to initiate password reset' },
      { status: 500 }
    );
  }
}
