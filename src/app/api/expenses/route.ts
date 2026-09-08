import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateDefaultBusiness } from '@/lib/seed-helper';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId') || undefined;

    const expenses = await prisma.expense.findMany({
      where: businessId ? { businessId } : undefined,
      include: {
        category: true,
      },
      orderBy: { expenseDate: 'desc' },
      take: 100,
    });

    const categories = await prisma.expenseCategory.findMany({
      where: businessId ? { businessId } : undefined,
    });

    return NextResponse.json({ success: true, expenses, categories });
  } catch (error: any) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      businessId,
      categoryId,
      title,
      amount,
      gstRate = 0,
      paymentMode = 'CASH',
      vendorName,
      vendorGstin,
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

    const expAmount = Number(amount) || 0;
    const rate = Number(gstRate) || 0;
    const taxAmount = rate > 0 ? Number(((expAmount * rate) / (100 + rate)).toFixed(2)) : 0;

    const expense = await prisma.expense.create({
      data: {
        businessId: business.id,
        categoryId: categoryId || null,
        title,
        amount: expAmount,
        taxAmount,
        gstRate: rate,
        paymentMode,
        vendorName,
        vendorGstin,
        notes,
      },
    });

    return NextResponse.json({ success: true, expense });
  } catch (error: any) {
    console.error('Error creating expense:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
