import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      name,
      legalName,
      type,
      gstin,
      pan,
      state,
      stateCode,
      address,
      phone,
      email,
    } = body;

    const updated = await prisma.business.update({
      where: { id },
      data: {
        name,
        legalName: legalName || null,
        type: type || 'Retail',
        gstin: gstin || null,
        pan: pan || null,
        state: state || 'Delhi',
        stateCode: stateCode || '07',
        address: address || null,
        phone: phone || null,
        email: email || null,
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_BUSINESS',
        entityType: 'BUSINESS',
        entityId: id,
        newValues: JSON.stringify({ name, type, gstin, state }),
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, business: updated });
  } catch (error: any) {
    console.error('Error updating business in admin:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Check count of sales / items
    const salesCount = await prisma.sale.count({ where: { businessId: id } });
    if (salesCount > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete business with existing sales records.' },
        { status: 400 }
      );
    }

    await prisma.business.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        action: 'DELETE_BUSINESS',
        entityType: 'BUSINESS',
        entityId: id,
        newValues: JSON.stringify({ deletedId: id }),
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, message: 'Business deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting business in admin:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
