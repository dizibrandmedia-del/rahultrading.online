import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateDefaultBusiness } from '@/lib/seed-helper';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || undefined;
    const businessId = searchParams.get('businessId') || undefined;

    const parties = await prisma.party.findMany({
      where: {
        ...(businessId ? { businessId } : {}),
        ...(type ? { type } : {}),
      },
      include: {
        sales: { take: 5, orderBy: { invoiceDate: 'desc' } },
        purchases: { take: 5, orderBy: { billDate: 'desc' } },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, parties });
  } catch (error: any) {
    console.error('Error fetching parties:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      businessId,
      name,
      type = 'CUSTOMER',
      phone,
      email,
      gstin,
      pan,
      state = 'Delhi',
      stateCode = '07',
      city,
      pincode,
      address,
      openingBalance = 0,
      creditLimit = 0,
      creditDays = 30,
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

    const party = await prisma.party.create({
      data: {
        businessId: business.id,
        name,
        type,
        phone,
        email,
        gstin,
        pan,
        state,
        stateCode,
        city,
        pincode,
        address,
        openingBalance: Number(openingBalance) || 0,
        currentBalance: Number(openingBalance) || 0,
        creditLimit: Number(creditLimit) || 0,
        creditDays: Number(creditDays) || 30,
        notes,
      },
    });

    return NextResponse.json({ success: true, party });
  } catch (error: any) {
    console.error('Error creating party:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
