import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateDefaultBusiness } from '@/lib/seed-helper';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || undefined;
    const businessId = searchParams.get('businessId') || undefined;

    const payments = await prisma.payment.findMany({
      where: {
        ...(businessId ? { businessId } : {}),
        ...(type ? { type } : {}),
      },
      include: {
        party: true,
        allocations: {
          include: {
            sale: true,
            purchase: true,
          },
        },
      },
      orderBy: { paymentDate: 'desc' },
      take: 100,
    });

    return NextResponse.json({ success: true, payments });
  } catch (error: any) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      businessId,
      type = 'PAYMENT_IN', // PAYMENT_IN, PAYMENT_OUT
      partyId,
      partyName,
      amount,
      paymentMode = 'CASH',
      referenceNumber,
      notes,
    } = body;

    let business = await prisma.business.findFirst({
      where: businessId ? { id: businessId } : undefined,
    });

    if (!business) {
      business = await getOrCreateDefaultBusiness();
    }

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
    }

    const payAmount = Number(amount) || 0;
    const paymentNumber = `PAY-${Date.now().toString().slice(-6)}`;

    const payment = await prisma.$transaction(async (tx) => {
      const p = await tx.payment.create({
        data: {
          businessId: business.id,
          paymentNumber,
          type,
          partyId: partyId || null,
          partyName: partyName || 'Cash Party',
          amount: payAmount,
          paymentMode,
          referenceNumber,
          notes,
        },
      });

      // Update party balance
      if (partyId) {
        if (type === 'PAYMENT_IN') {
          // Reduces customer receivable balance
          await tx.party.update({
            where: { id: partyId },
            data: { currentBalance: { decrement: payAmount } },
          });
        } else {
          // Reduces supplier payable balance
          await tx.party.update({
            where: { id: partyId },
            data: { currentBalance: { increment: payAmount } },
          });
        }
      }

      return p;
    });

    return NextResponse.json({ success: true, payment });
  } catch (error: any) {
    console.error('Error recording payment:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
