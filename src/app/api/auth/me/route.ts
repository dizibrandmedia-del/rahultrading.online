import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('rjtc_session')?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const payload = verifySessionToken(token);
    if (!payload || !payload.userId) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        businesses: {
          include: {
            business: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const primaryBusinessUser = user.businesses[0];

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: primaryBusinessUser?.role || 'OWNER',
        businessId: primaryBusinessUser?.businessId || null,
        businessName: primaryBusinessUser?.business?.name || 'RAHUL JEE TRADING COMPANY',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ authenticated: false, user: null });
  }
}
