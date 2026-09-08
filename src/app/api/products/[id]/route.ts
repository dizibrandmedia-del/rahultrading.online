import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        unit: true,
      },
    });

    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, product });
  } catch (error: any) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      name,
      sku,
      barcode,
      hsnCode,
      categoryId,
      unitId,
      purchasePrice,
      salePrice,
      mrp,
      wholesalePrice,
      minStock,
      maxStock,
      currentStock,
      gstRate,
      isInclusiveTax,
      isActive,
    } = body;

    const existing = await prisma.product.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    const pPrice = purchasePrice !== undefined ? Number(purchasePrice) || 0 : existing.purchasePrice;
    const sPrice = salePrice !== undefined ? Number(salePrice) || 0 : existing.salePrice;
    const cStock = currentStock !== undefined ? Number(currentStock) || 0 : existing.currentStock;
    const newStockValue = cStock * pPrice;

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : existing.name,
        sku: sku !== undefined ? (sku ? sku.trim() : null) : existing.sku,
        barcode: barcode !== undefined ? (barcode ? barcode.trim() : null) : existing.barcode,
        hsnCode: hsnCode !== undefined ? (hsnCode ? hsnCode.trim() : null) : existing.hsnCode,
        categoryId: categoryId !== undefined ? (categoryId || null) : existing.categoryId,
        unitId: unitId !== undefined ? (unitId || null) : existing.unitId,
        purchasePrice: pPrice,
        salePrice: sPrice,
        mrp: mrp !== undefined ? Number(mrp) || sPrice : (existing.mrp || sPrice),
        wholesalePrice: wholesalePrice !== undefined ? Number(wholesalePrice) || sPrice : existing.wholesalePrice,
        minStock: minStock !== undefined ? Number(minStock) || 0 : existing.minStock,
        maxStock: maxStock !== undefined ? Number(maxStock) || 1000 : existing.maxStock,
        currentStock: cStock,
        stockValue: newStockValue,
        gstRate: gstRate !== undefined ? Number(gstRate) || 0 : existing.gstRate,
        isInclusiveTax: isInclusiveTax !== undefined ? Boolean(isInclusiveTax) : existing.isInclusiveTax,
        isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
      },
      include: {
        category: true,
        unit: true,
      },
    });

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const existing = await prisma.product.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    // Delete product (cascades stock movements & batches; sets null on invoice items)
    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Product deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
