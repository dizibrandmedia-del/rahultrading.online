import { InvoiceItemDraft, GstCalculationResult } from '@/types';

export function calculateInvoiceGst(
  sellerStateCode: string,
  buyerStateCode: string,
  items: InvoiceItemDraft[]
): GstCalculationResult {
  const isInterState = sellerStateCode.trim() !== buyerStateCode.trim() && buyerStateCode.trim() !== '';
  
  let subTotal = 0;
  let discountTotal = 0;
  let taxableTotal = 0;
  let cgstTotal = 0;
  let sgstTotal = 0;
  let igstTotal = 0;
  let taxTotal = 0;

  const processedItems: InvoiceItemDraft[] = items.map(item => {
    const rawAmount = (item.unitPrice || 0) * (item.quantity || 0);
    const discAmount = (rawAmount * (item.discountPercent || 0)) / 100;
    const itemTaxable = Math.max(0, rawAmount - discAmount);
    
    const gstRate = item.gstRate || 0;
    let cgstRate = 0;
    let cgstAmount = 0;
    let sgstRate = 0;
    let sgstAmount = 0;
    let igstRate = 0;
    let igstAmount = 0;

    if (isInterState) {
      igstRate = gstRate;
      igstAmount = Number(((itemTaxable * igstRate) / 100).toFixed(2));
    } else {
      cgstRate = gstRate / 2;
      cgstAmount = Number(((itemTaxable * cgstRate) / 100).toFixed(2));
      sgstRate = gstRate / 2;
      sgstAmount = Number(((itemTaxable * sgstRate) / 100).toFixed(2));
    }

    const itemTax = isInterState ? igstAmount : (cgstAmount + sgstAmount);
    const totalAmount = Number((itemTaxable + itemTax).toFixed(2));

    subTotal += rawAmount;
    discountTotal += discAmount;
    taxableTotal += itemTaxable;
    cgstTotal += cgstAmount;
    sgstTotal += sgstAmount;
    igstTotal += igstAmount;
    taxTotal += itemTax;

    return {
      ...item,
      discountAmount: Number(discAmount.toFixed(2)),
      taxableAmount: Number(itemTaxable.toFixed(2)),
      cgstRate,
      cgstAmount,
      sgstRate,
      sgstAmount,
      igstRate,
      igstAmount,
      totalAmount
    };
  });

  const unroundedGrandTotal = taxableTotal + taxTotal;
  const roundedGrandTotal = Math.round(unroundedGrandTotal);
  const roundOff = Number((roundedGrandTotal - unroundedGrandTotal).toFixed(2));

  return {
    isInterState,
    subTotal: Number(subTotal.toFixed(2)),
    discountTotal: Number(discountTotal.toFixed(2)),
    taxableTotal: Number(taxableTotal.toFixed(2)),
    cgstTotal: Number(cgstTotal.toFixed(2)),
    sgstTotal: Number(sgstTotal.toFixed(2)),
    igstTotal: Number(igstTotal.toFixed(2)),
    taxTotal: Number(taxTotal.toFixed(2)),
    roundOff,
    grandTotal: roundedGrandTotal,
    items: processedItems
  };
}

/**
 * Validates 15-character Indian GSTIN format
 * Format: 2 digits (State code) + 5 letters (PAN) + 4 digits + 1 letter + 1 char (1-9/A-Z) + 'Z' + 1 check digit
 */
export function validateGSTIN(gstin: string): { isValid: boolean; stateCode?: string; message?: string } {
  if (!gstin) return { isValid: false, message: 'GSTIN is required' };
  const cleaned = gstin.trim().toUpperCase();
  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  
  if (!gstinRegex.test(cleaned)) {
    return { isValid: false, message: 'Invalid 15-character GSTIN format (e.g. 07AAAAA0000A1Z5)' };
  }
  
  const stateCode = cleaned.substring(0, 2);
  return { isValid: true, stateCode, message: 'Valid GSTIN' };
}
