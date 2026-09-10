import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashToken, hashPassword } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, otp, newPassword } = body;

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Email, OTP, and new password are required' },
        { status: 400 }
      );
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'New password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.toString().trim();

    // Find active PASSWORD_RESET OTP
    const otpRecord = await prisma.authOtp.findFirst({
      where: {
        identifier: cleanEmail,
        type: 'PASSWORD_RESET',
      },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { success: false, error: 'No active password reset request found. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check expiration
    if (new Date() > otpRecord.expiresAt) {
      await prisma.authOtp.delete({ where: { id: otpRecord.id } });
      return NextResponse.json(
        { success: false, error: 'Reset code has expired. Please request a new code.' },
        { status: 400 }
      );
    }

    // Check attempts limit
    if (otpRecord.attempts >= 5) {
      await prisma.authOtp.delete({ where: { id: otpRecord.id } });
      return NextResponse.json(
        { success: false, error: 'Too many incorrect attempts. Please request a new reset code.' },
        { status: 429 }
      );
    }

    // Verify hash
    const computedHash = hashToken(cleanOtp);
    if (computedHash !== otpRecord.tokenHash) {
      await prisma.authOtp.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });
      const remaining = 5 - (otpRecord.attempts + 1);
      return NextResponse.json(
        { success: false, error: `Invalid reset code. ${remaining} attempts remaining.` },
        { status: 400 }
      );
    }

    // Valid OTP - remove it
    await prisma.authOtp.delete({ where: { id: otpRecord.id } });

    // Hash the new password with salted PBKDF2
    const hashedPassword = hashPassword(newPassword);

    // Update user password in database
    const updatedUser = await prisma.user.updateMany({
      where: { email: cleanEmail },
      data: { passwordHash: hashedPassword },
    });

    if (updatedUser.count === 0) {
      return NextResponse.json(
        { success: false, error: 'User account not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully! You can now log in with your new password.',
    });
  } catch (err: any) {
    console.error('Reset password error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to reset password' },
      { status: 500 }
    );
  }
}
