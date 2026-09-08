import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateDefaultBusiness } from '@/lib/seed-helper';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId') || undefined;
    const search = searchParams.get('search') || undefined;

    const [products, categories, units] = await Promise.all([
      prisma.product.findMany({
        where: {
          ...(businessId ? { businessId } : {}),
          ...(search
            ? {
                OR: [
                  { name: { contains: search } },
                  { barcode: { contains: search } },
                  { sku: { contains: search } },
                  { hsnCode: { contains: search } },
                ],
              }
            : {}),
        },
        include: {
          category: true,
          unit: true,
        },
        orderBy: { name: 'asc' },
      }),
      prisma.category.findMany({
        where: businessId ? { businessId } : undefined,
        orderBy: { name: 'asc' },
      }),
      prisma.unit.findMany({
        where: businessId ? { businessId } : undefined,
        orderBy: { name: 'asc' },
      }),
    ]);

    return NextResponse.json({ success: true, products, categories, units });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      businessId,
      name,
      sku,
      barcode,
      hsnCode,
      categoryId,
      unitId,
      purchasePrice = 0,
      salePrice = 0,
      mrp = 0,
      wholesalePrice = 0,
      minStock = 5,
      maxStock = 1000,
      openingStock = 0,
      gstRate = 18,
      isInclusiveTax = false,
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

    const currentStock = Number(openingStock) || 0;
    const pPrice = Number(purchasePrice) || 0;
    const sPrice = Number(salePrice) || 0;

    const product = await prisma.$transaction(async (tx) => {
      const prod = await tx.product.create({
        data: {
          businessId: business.id,
          name,
          sku,
          barcode,
          hsnCode,
          categoryId: categoryId || null,
          unitId: unitId || null,
          purchasePrice: pPrice,
          salePrice: sPrice,
          mrp: Number(mrp) || sPrice,
          wholesalePrice: Number(wholesalePrice) || sPrice,
          minStock: Number(minStock) || 5,
          maxStock: Number(maxStock) || 1000,
          currentStock,
          stockValue: currentStock * pPrice,
          gstRate: Number(gstRate) || 18,
          isInclusiveTax: Boolean(isInclusiveTax),
        },
      });

      if (currentStock > 0) {
        await tx.stockMovement.create({
          data: {
            businessId: business.id,
            productId: prod.id,
            type: 'OPENING',
            quantity: currentStock,
            previousStock: 0,
            newStock: currentStock,
            unitPrice: pPrice,
            notes: 'Opening Stock Entry',
          },
        });
      }

      return prod;
    });

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
