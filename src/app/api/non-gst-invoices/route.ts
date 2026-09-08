import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateDefaultBusiness } from '@/lib/seed-helper';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;

    const whereClause: any = {};
    if (businessId) whereClause.businessId = businessId;
    if (status && status !== 'ALL') whereClause.paymentStatus = status;

    if (search) {
      whereClause.OR = [
        { invoiceNumber: { contains: search } },
        { partyName: { contains: search } },
        { partyPhone: { contains: search } },
      ];
    }

    const invoices = await prisma.nonGstInvoice.findMany({
      where: whereClause,
      include: {
        items: true,
        party: true,
        business: true,
      },
      orderBy: { invoiceDate: 'desc' },
      take: 100,
    });

    return NextResponse.json({ success: true, invoices });
  } catch (error: any) {
    console.error('Error fetching non-GST invoices:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      businessId,
      fromName,
      fromPhone,
      fromAddress,
      invoiceNumber: customInvoiceNumber,
      invoiceDate,
      dueDate,
      partyId,
      partyName = 'Walk-in Cash Customer',
      partyPhone,
      partyAddress,
      billingAddress,
      partyState = 'Uttar Pradesh',
      extraCharges = 0,
      extraChargeName = 'LOADING CHARGE',
      paymentMode = 'UNPAID',
      paidAmount = 0,
      notes,
      terms = 'Thanks for doing business with us!',
      items = [],
    } = body;

    // Fetch Business to get prefix and sequence
    let business = await prisma.business.findFirst({
      where: businessId ? { id: businessId } : undefined,
    });

    if (!business) {
      business = await getOrCreateDefaultBusiness();
    }

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
    }

    // Calculate Non-GST Invoice line items and totals
    let subTotal = 0;
    let discountTotal = 0;

    const processedItems = items.map((it: any) => {
      const qty = Number(it.quantity) || 1;
      const rate = Number(it.unitPrice) || 0;
      const discPercent = Number(it.discountPercent) || 0;
      let discAmount = Number(it.discountAmount) || 0;

      const gross = qty * rate;
      if (discPercent > 0 && discAmount === 0) {
        discAmount = (gross * discPercent) / 100;
      }
      const lineTotal = Math.max(0, gross - discAmount);

      subTotal += gross;
      discountTotal += discAmount;

      return {
        productId: it.productId || null,
        productName: it.productName || 'General Item',
        description: it.description || null,
        quantity: qty,
        unit: it.unit || 'PCS',
        unitPrice: rate,
        discountPercent: discPercent,
        discountAmount: discAmount,
        totalAmount: lineTotal,
      };
    });

    const parsedExtra = Number(extraCharges) || 0;
    const grandTotal = Math.max(0, subTotal - discountTotal + parsedExtra);
    const actualPaid = Number(paidAmount) || 0;
    const balance = Math.max(0, grandTotal - actualPaid);
    const paymentStatus = balance === 0 ? 'PAID' : actualPaid > 0 ? 'PARTIAL' : 'UNPAID';

    const generatedNumber = `${business.nonGstPrefix || 'NG-'}${String(business.nonGstNextNumber || 1).padStart(4, '0')}`;
    const finalInvoiceNumber = customInvoiceNumber?.trim() || generatedNumber;

    // Execute atomic transaction for NonGstInvoice + Items + Stock Decrement
    const invoice = await prisma.$transaction(async (tx) => {
      // 1. Create Non-GST Invoice
      const newInvoice = await tx.nonGstInvoice.create({
        data: {
          businessId: business.id,
          fromName: fromName || business.name || 'RAHUL JEE TRADING COMPANY',
          fromPhone: fromPhone || business.phone || null,
          fromAddress: fromAddress || business.address || null,
          invoiceNumber: finalInvoiceNumber,
          invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
          dueDate: dueDate ? new Date(dueDate) : null,
          partyId: partyId || null,
          partyName: partyName || 'Walk-in Cash Customer',
          partyPhone: partyPhone || null,
          partyAddress: partyAddress || null,
          billingAddress: billingAddress || partyAddress || null,
          partyState: partyState || 'Uttar Pradesh',
          subTotal,
          discountTotal,
          extraCharges: parsedExtra,
          extraChargeName: extraChargeName || 'LOADING CHARGE',
          grandTotal,
          paidAmount: actualPaid,
          balanceAmount: balance,
          paymentStatus,
          paymentMode,
          notes,
          terms,
          status: 'FINAL',
        },
      });

      // 2. Create Items & Optionally Decrement Inventory
      for (const item of processedItems) {
        await tx.nonGstInvoiceItem.create({
          data: {
            invoiceId: newInvoice.id,
            productId: item.productId,
            productName: item.productName,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            discountPercent: item.discountPercent,
            discountAmount: item.discountAmount,
            totalAmount: item.totalAmount,
          },
        });

        // Decrement Product Stock if connected to inventory
        if (item.productId) {
          const prod = await tx.product.findUnique({ where: { id: item.productId } });
          if (prod) {
            const newStock = prod.currentStock - item.quantity;
            await tx.product.update({
              where: { id: prod.id },
              data: {
                currentStock: newStock,
                stockValue: newStock * prod.purchasePrice,
              },
            });

            await tx.stockMovement.create({
              data: {
                businessId: business.id,
                productId: prod.id,
                type: 'SALE',
                quantity: -item.quantity,
                previousStock: prod.currentStock,
                newStock,
                unitPrice: item.unitPrice,
                referenceId: newInvoice.id,
                referenceType: 'INVOICE',
                notes: `Non-GST Invoice #${finalInvoiceNumber}`,
              },
            });
          }
        }
      }

      // 3. Increment Non-GST Invoice Sequence if default used
      if (!customInvoiceNumber || customInvoiceNumber.trim() === generatedNumber) {
        await tx.business.update({
          where: { id: business.id },
          data: { nonGstNextNumber: { increment: 1 } },
        });
      }

      return newInvoice;
    });

    return NextResponse.json({ success: true, invoice });
  } catch (error: any) {
    console.error('Error creating non-GST invoice:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
