import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashToken, createSessionToken, ensureOtpTable } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    await ensureOtpTable();
    const body = await req.json();
    const { email, otp, type = 'LOGIN_OTP' } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: 'Email and 6-digit OTP are required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.toString().trim();

    // Find active OTP record
    const otpRecord = await prisma.authOtp.findFirst({
      where: {
        identifier: cleanEmail,
        type,
      },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { success: false, error: 'No active OTP found. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check expiration
    if (new Date() > otpRecord.expiresAt) {
      await prisma.authOtp.delete({ where: { id: otpRecord.id } });
      return NextResponse.json(
        { success: false, error: 'OTP has expired. Please request a new OTP.' },
        { status: 400 }
      );
    }

    // Check attempts limit (max 5)
    if (otpRecord.attempts >= 5) {
      await prisma.authOtp.delete({ where: { id: otpRecord.id } });
      return NextResponse.json(
        { success: false, error: 'Too many incorrect attempts. Please request a new OTP.' },
        { status: 429 }
      );
    }

    // Verify hash
    const computedHash = hashToken(cleanOtp);
    if (computedHash !== otpRecord.tokenHash) {
      // Increment attempt counter
      await prisma.authOtp.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });
      const remaining = 5 - (otpRecord.attempts + 1);
      return NextResponse.json(
        { success: false, error: `Invalid OTP. ${remaining} attempts remaining.` },
        { status: 400 }
      );
    }

    // OTP is valid! Delete it immediately to prevent reuse
    await prisma.authOtp.delete({ where: { id: otpRecord.id } });

    // Look up user
    const user = await prisma.user.findFirst({
      where: { email: cleanEmail },
      include: {
        businesses: {
          include: {
            business: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User account not found.' },
        { status: 404 }
      );
    }

    const primaryBusinessUser = user.businesses[0];
    const role = primaryBusinessUser?.role || 'OWNER';
    const businessId = primaryBusinessUser?.businessId || null;

    // Generate session JWT
    const token = createSessionToken({
      userId: user.id,
      phone: user.phone,
      email: user.email,
      name: user.name,
      role,
      businessId,
    });

    // Build response with cookie
    const response = NextResponse.json({
      success: true,
      message: 'OTP verified successfully. Logging in...',
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role,
        businessId,
        businessName: primaryBusinessUser?.business?.name || 'RAHUL JEE TRADING COMPANY',
      },
      token,
    });

    response.cookies.set({
      name: 'rjtc_session',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (err: any) {
    console.error('Verify OTP error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'OTP verification failed' },
      { status: 500 }
    );
  }
}
