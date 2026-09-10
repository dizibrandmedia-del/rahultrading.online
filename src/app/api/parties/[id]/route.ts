import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const party = await prisma.party.findUnique({
      where: { id },
      include: {
        sales: { take: 10, orderBy: { invoiceDate: 'desc' } },
        nonGstInvoices: { take: 10, orderBy: { invoiceDate: 'desc' } },
        purchases: { take: 10, orderBy: { billDate: 'desc' } },
        payments: { take: 10, orderBy: { paymentDate: 'desc' } },
      },
    });

    if (!party) {
      return NextResponse.json(
        { success: false, error: 'Party not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, party });
  } catch (error: any) {
    console.error('Error fetching party:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
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
      openingBalance,
      creditLimit,
      creditDays,
      notes,
    } = body;

    const existingParty = await prisma.party.findUnique({
      where: { id },
    });

    if (!existingParty) {
      return NextResponse.json(
        { success: false, error: 'Party not found' },
        { status: 404 }
      );
    }

    // Recalculate currentBalance if openingBalance was modified
    let newCurrentBalance = existingParty.currentBalance;
    if (openingBalance !== undefined) {
      const oldOpen = Number(existingParty.openingBalance || 0);
      const newOpen = Number(openingBalance || 0);
      newCurrentBalance = existingParty.currentBalance - oldOpen + newOpen;
    }

    const updated = await prisma.party.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(type ? { type } : {}),
        phone: phone !== undefined ? phone : existingParty.phone,
        email: email !== undefined ? email : existingParty.email,
        gstin: gstin !== undefined ? gstin : existingParty.gstin,
        pan: pan !== undefined ? pan : existingParty.pan,
        state: state || existingParty.state,
        stateCode: stateCode || existingParty.stateCode,
        city: city !== undefined ? city : existingParty.city,
        pincode: pincode !== undefined ? pincode : existingParty.pincode,
        address: address !== undefined ? address : existingParty.address,
        openingBalance: openingBalance !== undefined ? Number(openingBalance) : existingParty.openingBalance,
        currentBalance: newCurrentBalance,
        creditLimit: creditLimit !== undefined ? Number(creditLimit) : existingParty.creditLimit,
        creditDays: creditDays !== undefined ? Number(creditDays) : existingParty.creditDays,
        notes: notes !== undefined ? notes : existingParty.notes,
      },
    });

    return NextResponse.json({ success: true, party: updated });
  } catch (error: any) {
    console.error('Error updating party:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const party = await prisma.party.findUnique({
      where: { id },
      include: {
        sales: { select: { id: true }, take: 1 },
        nonGstInvoices: { select: { id: true }, take: 1 },
        purchases: { select: { id: true }, take: 1 },
        payments: { select: { id: true }, take: 1 },
      },
    });

    if (!party) {
      return NextResponse.json(
        { success: false, error: 'Party not found' },
        { status: 404 }
      );
    }

    const hasTx =
      party.sales.length > 0 ||
      party.nonGstInvoices.length > 0 ||
      party.purchases.length > 0 ||
      party.payments.length > 0;

    if (hasTx) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Cannot delete party with existing transactions. You can settle the balance or edit details instead.',
        },
        { status: 400 }
      );
    }

    await prisma.party.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting party:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
