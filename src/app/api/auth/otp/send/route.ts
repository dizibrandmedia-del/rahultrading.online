import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateNumericOtp, hashToken, ensureOtpTable } from '@/lib/auth';
import { sendOtpEmail } from '@/lib/mailer';

export async function POST(req: Request) {
  try {
    await ensureOtpTable();
    const body = await req.json();
    const { email, type = 'LOGIN_OTP' } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Valid registered email address is required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user exists with this email
    const user = await prisma.user.findFirst({
      where: { email: cleanEmail },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No account found with this email address.' },
        { status: 404 }
      );
    }

    // Rate Limiting: Check if an OTP was generated within the last 60 seconds
    const recentOtp = await prisma.authOtp.findFirst({
      where: {
        identifier: cleanEmail,
        type,
        createdAt: {
          gte: new Date(Date.now() - 60 * 1000),
        },
      },
    });

    if (recentOtp) {
      const waitSeconds = Math.max(1, Math.ceil((recentOtp.createdAt.getTime() + 60 * 1000 - Date.now()) / 1000));
      return NextResponse.json(
        { success: false, error: `Please wait ${waitSeconds} seconds before requesting a new OTP.` },
        { status: 429 }
      );
    }

    // Delete any older active OTPs for this identifier/type
    await prisma.authOtp.deleteMany({
      where: {
        identifier: cleanEmail,
        type,
      },
    });

    // Generate fresh secure 6-digit OTP
    const otp = generateNumericOtp();
    const tokenHash = hashToken(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store hashed OTP in database
    await prisma.authOtp.create({
      data: {
        identifier: cleanEmail,
        type,
        tokenHash,
        expiresAt,
        attempts: 0,
      },
    });

    // Send email
    const sendResult = await sendOtpEmail(cleanEmail, otp, type);

    return NextResponse.json({
      success: true,
      message: sendResult.message || `OTP sent to ${cleanEmail}`,
      cooldownSeconds: 60,
    });
  } catch (err: any) {
    console.error('Send OTP error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to send OTP' },
      { status: 500 }
    );
  }
}
