import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId') || undefined;

    const users = await prisma.user.findMany({
      include: {
        businesses: {
          include: {
            business: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedUsers = users.map((u) => {
      const primaryBusinessUser = u.businesses[0];
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        avatar: u.avatar,
        createdAt: u.createdAt,
        businessUserId: primaryBusinessUser?.id || null,
        businessId: primaryBusinessUser?.businessId || null,
        businessName: primaryBusinessUser?.business?.name || 'Platform Level',
        role: primaryBusinessUser?.role || 'VIEWER',
        permissions: primaryBusinessUser?.permissions ? JSON.parse(primaryBusinessUser.permissions) : [],
      };
    });

    return NextResponse.json({ success: true, users: formattedUsers });
  } catch (error: any) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      phone,
      role = 'SALESMAN',
      businessId,
      permissions = [],
    } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { success: false, error: 'Name and Phone number are required' },
        { status: 400 }
      );
    }

    // Default business if not passed
    let targetBusinessId = businessId;
    if (!targetBusinessId) {
      const b = await prisma.business.findFirst();
      targetBusinessId = b?.id;
    }

    if (!targetBusinessId) {
      return NextResponse.json(
        { success: false, error: 'No business found to attach user to' },
        { status: 404 }
      );
    }

    // Upsert User
    const user = await prisma.user.upsert({
      where: { phone },
      update: {
        name,
        email: email || undefined,
      },
      create: {
        name,
        phone,
        email: email || null,
        passwordHash: 'user_hash_2026',
      },
    });

    // Create or Update BusinessUser role
    const businessUser = await prisma.businessUser.upsert({
      where: {
        businessId_userId: {
          businessId: targetBusinessId,
          userId: user.id,
        },
      },
      update: {
        role,
        permissions: JSON.stringify(permissions),
      },
      create: {
        businessId: targetBusinessId,
        userId: user.id,
        role,
        permissions: JSON.stringify(permissions),
      },
    });

    // Record Audit Log
    await prisma.auditLog.create({
      data: {
        businessId: targetBusinessId,
        userId: user.id,
        action: 'CREATE_USER',
        entityType: 'USER',
        entityId: user.id,
        newValues: JSON.stringify({ name, phone, role, permissions }),
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: businessUser.role,
        permissions,
      },
    });
  } catch (error: any) {
    console.error('Error creating admin user:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { userId, businessId, role, permissions } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    let targetBusinessId = businessId;
    if (!targetBusinessId) {
      const b = await prisma.business.findFirst();
      targetBusinessId = b?.id;
    }

    if (!targetBusinessId) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
    }

    const updated = await prisma.businessUser.upsert({
      where: {
        businessId_userId: {
          businessId: targetBusinessId,
          userId,
        },
      },
      update: {
        role: role || undefined,
        permissions: permissions ? JSON.stringify(permissions) : undefined,
      },
      create: {
        businessId: targetBusinessId,
        userId,
        role: role || 'VIEWER',
        permissions: permissions ? JSON.stringify(permissions) : JSON.stringify([]),
      },
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        businessId: targetBusinessId,
        userId,
        action: 'UPDATE_ROLE',
        entityType: 'USER',
        entityId: userId,
        newValues: JSON.stringify({ role: updated.role, permissions }),
      },
    });

    return NextResponse.json({ success: true, businessUser: updated });
  } catch (error: any) {
    console.error('Error updating user role:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const businessId = searchParams.get('businessId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID required' }, { status: 400 });
    }

    if (businessId) {
      await prisma.businessUser.deleteMany({
        where: { businessId, userId },
      });
    } else {
      await prisma.businessUser.deleteMany({
        where: { userId },
      });
      await prisma.user.delete({
        where: { id: userId },
      });
    }

    return NextResponse.json({ success: true, message: 'User removed successfully' });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
