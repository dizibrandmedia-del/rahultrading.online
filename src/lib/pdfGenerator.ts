'use client';

import React from 'react';
import { createRoot } from 'react-dom/client';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { formatINR } from './currency';
import { InvoiceA4Template } from '@/components/printing/InvoiceA4Template';
import { NonGstInvoiceTemplate } from '@/components/printing/NonGstInvoiceTemplate';
import { PurchaseBillA4Template } from '@/components/printing/PurchaseBillA4Template';

export interface BusinessInfo {
  name: string;
  legalName?: string | null;
  gstin?: string | null;
  pan?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  stateCode?: string | null;
  pincode?: string | null;
  phone?: string | null;
  email?: string | null;
  logo?: string | null;
  bankName?: string | null;
  bankAccountNo?: string | null;
  bankIfsc?: string | null;
  bankBranch?: string | null;
  upiId?: string | null;
  upiName?: string | null;
  termsAndConditions?: string | null;
}

export interface GstSaleItem {
  id?: string;
  productName: string;
  hsnCode?: string | null;
  quantity: number;
  unit?: string;
  unitPrice: number;
  discountAmount?: number;
  discountPercent?: number;
  taxableAmount: number;
  gstRate: number;
  cgstRate?: number;
  cgstAmount?: number;
  sgstRate?: number;
  sgstAmount?: number;
  igstRate?: number;
  igstAmount?: number;
  totalAmount: number;
}

export interface GstSaleInvoice {
  invoiceNumber: string;
  invoiceDate: Date | string;
  dueDate?: Date | string | null;
  partyName: string;
  partyGstin?: string | null;
  partyPhone?: string | null;
  partyAddress?: string | null;
  partyState?: string | null;
  partyStateCode?: string | null;
  isInterState?: boolean;
  subTotal: number;
  discountTotal: number;
  taxableTotal: number;
  cgstTotal?: number;
  sgstTotal?: number;
  igstTotal?: number;
  taxTotal?: number;
  roundOff?: number;
  grandTotal: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus?: string;
  paymentMode?: string;
  notes?: string | null;
  terms?: string | null;
  items: GstSaleItem[];
}

export interface NonGstInvoiceItem {
  id?: string;
  productName: string;
  description?: string | null;
  quantity: number;
  unit?: string;
  unitPrice: number;
  discountAmount?: number;
  discountPercent?: number;
  totalAmount: number;
}

export interface NonGstInvoice {
  fromName?: string | null;
  fromPhone?: string | null;
  fromAddress?: string | null;
  invoiceNumber: string;
  invoiceDate: Date | string;
  dueDate?: Date | string | null;
  partyName: string;
  partyPhone?: string | null;
  partyAddress?: string | null;
  billingAddress?: string | null;
  partyState?: string | null;
  subTotal: number;
  discountTotal: number;
  extraCharges?: number;
  extraChargeName?: string | null;
  grandTotal: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus?: string;
  paymentMode?: string;
  notes?: string | null;
  terms?: string | null;
  items: NonGstInvoiceItem[];
}

/**
 * Renders any React invoice template offscreen in standard A4 dimensions (794px width @ 96DPI)
 * and captures it at 2.5x high-DPI resolution to create a pixel-perfect, crisp A4 PDF.
 */
async function renderTemplateToPdfBlob(element: React.ReactElement): Promise<Blob> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('PDF generation requires a browser environment');
  }

  // Create isolated off-screen container matching exact standard A4 width
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '794px';
  container.style.backgroundColor = '#ffffff';
  container.style.zIndex = '-9999';
  container.style.overflow = 'visible';
  container.style.boxSizing = 'border-box';
  document.body.appendChild(container);

  let root: any = null;
  try {
    root = createRoot(container);
    root.render(element);

    // Allow React commit, QR code generation, image loading & fonts ready
    await new Promise((resolve) => setTimeout(resolve, 350));
    if (document.fonts && document.fonts.ready) {
      try {
        await document.fonts.ready;
      } catch (e) {
        // ignore font errors
      }
    }

    const targetEl = (container.firstElementChild as HTMLElement) || container;

    // Capture with high-DPI scaling (2.5x) for ultra-clear typography and numbers
    const canvas = await (html2canvas as any)(targetEl, {
      scale: 2.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: 794,
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4',
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth(); // 595.28 pt
    const pageHeight = pdf.internal.pageSize.getHeight(); // 841.89 pt

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    let heightLeft = imgHeight;
    let position = 0;

    // First page
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    // If multi-page content
    while (heightLeft > 10) {
      position = position - pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    return pdf.output('blob');
  } finally {
    if (root) {
      try {
        root.unmount();
      } catch (e) {}
    }
    if (container && container.parentNode) {
      try {
        document.body.removeChild(container);
      } catch (e) {}
    }
  }
}

/**
 * Generates an ultra-clear GST Tax Invoice PDF Blob matching the panel view 1:1
 */
export async function generateGstInvoicePdfBlob(
  sale: any,
  business: any
): Promise<Blob> {
  const businessData = {
    name: business?.name || 'RAHUL JEE TRADING COMPANY',
    legalName: business?.legalName || business?.name || 'RAHUL JEE TRADING COMPANY',
    gstin: business?.gstin || '09DMCPG4193P1ZG',
    pan: business?.pan || 'DMCPG4193P',
    address: business?.address || 'Allahabad Bank Road, Yusufpur, Mohammadabad, Dist- Ghazipur (U.P.) - 233227',
    state: business?.state || 'Uttar Pradesh',
    stateCode: business?.stateCode || '09',
    phone: business?.phone || '8887754821',
    email: business?.email || 'rahuljee1217@gmail.com',
    bankName: business?.bankName || 'HDFC Bank Ltd',
    bankAccountNo: business?.bankAccountNo || null,
    bankIfsc: business?.bankIfsc || null,
    bankBranch: business?.bankBranch || 'Mohammadabad, Ghazipur',
    upiId: business?.upiId || '8887754821@upi',
    termsAndConditions: business?.termsAndConditions || null,
  };

  const saleData = {
    invoiceNumber: sale.invoiceNumber || 'INV-001',
    invoiceDate: sale.invoiceDate || new Date(),
    dueDate: sale.dueDate || null,
    partyName: sale.partyName || sale.customerName || 'Cash Customer',
    partyGstin: sale.partyGstin || sale.party?.gstin || null,
    partyPhone: sale.partyPhone || sale.party?.phone || null,
    partyState: sale.partyState || sale.party?.state || businessData.state,
    isInterState: sale.isInterState ?? false,
    subTotal: Number(sale.subTotal) || 0,
    discountTotal: Number(sale.discountTotal) || 0,
    taxableTotal: Number(sale.taxableTotal) || 0,
    cgstTotal: Number(sale.cgstTotal) || 0,
    sgstTotal: Number(sale.sgstTotal) || 0,
    igstTotal: Number(sale.igstTotal) || 0,
    taxTotal: Number(sale.taxTotal) || 0,
    roundOff: Number(sale.roundOff) || 0,
    grandTotal: Number(sale.grandTotal) || 0,
    paidAmount: Number(sale.paidAmount) || 0,
    balanceAmount: Number(sale.balanceAmount) || 0,
    paymentMode: sale.paymentMode || 'CASH',
    paymentStatus: sale.paymentStatus || (Number(sale.balanceAmount) <= 0 ? 'PAID' : Number(sale.paidAmount) > 0 ? 'PARTIAL' : 'UNPAID'),
    notes: sale.notes || null,
    terms: sale.terms || null,
    items: (sale.items || []).map((it: any) => ({
      id: it.id,
      productName: it.productName || it.product?.name || 'Item',
      hsnCode: it.hsnCode || it.product?.hsnCode || null,
      quantity: Number(it.quantity) || 1,
      unit: it.unit || it.product?.unit || 'PCS',
      unitPrice: Number(it.unitPrice) || 0,
      discountAmount: Number(it.discountAmount) || 0,
      taxableAmount: Number(it.taxableAmount) || 0,
      gstRate: Number(it.gstRate) || 0,
      cgstAmount: Number(it.cgstAmount) || 0,
      sgstAmount: Number(it.sgstAmount) || 0,
      igstAmount: Number(it.igstAmount) || 0,
      totalAmount: Number(it.totalAmount) || 0,
    })),
  };

  const element = React.createElement(InvoiceA4Template, {
    business: businessData,
    sale: saleData,
  });

  return renderTemplateToPdfBlob(element);
}

/**
 * Generates an ultra-clear Non-GST Invoice / Bill of Supply PDF Blob matching the panel view 1:1
 */
export async function generateNonGstInvoicePdfBlob(
  invoice: any,
  business: any
): Promise<Blob> {
  const businessData = {
    name: business?.name || 'RAHUL JEE TRADING COMPANY',
    legalName: business?.legalName || business?.name || 'RAHUL JEE TRADING COMPANY',
    address: business?.address || 'Allahabad Bank Road, Yusufpur, Mohammadabad, Dist- Ghazipur (U.P.) - 233227',
    state: business?.state || 'Uttar Pradesh',
    stateCode: business?.stateCode || '09',
    phone: business?.phone || '8887754821',
    email: business?.email || 'rahuljee1217@gmail.com',
    pan: business?.pan || 'DMCPG4193P',
    logo: business?.logo || null,
    bankName: business?.bankName || 'HDFC Bank Ltd',
    bankAccountNo: business?.bankAccountNo || null,
    bankIfsc: business?.bankIfsc || null,
    bankBranch: business?.bankBranch || 'Mohammadabad, Ghazipur',
    upiId: business?.upiId || '8887754821@upi',
    termsAndConditions: business?.termsAndConditions || null,
  };

  const invoiceData = {
    fromName: invoice.fromName || businessData.name,
    fromPhone: invoice.fromPhone || businessData.phone,
    fromAddress: invoice.fromAddress || businessData.address,
    invoiceNumber: invoice.invoiceNumber || 'INV-001',
    invoiceDate: invoice.invoiceDate || new Date(),
    dueDate: invoice.dueDate || null,
    partyName: invoice.partyName || 'Cash Customer',
    partyPhone: invoice.partyPhone || null,
    partyAddress: invoice.partyAddress || null,
    billingAddress: invoice.billingAddress || null,
    partyState: invoice.partyState || businessData.state,
    subTotal: Number(invoice.subTotal) || 0,
    discountTotal: Number(invoice.discountTotal) || 0,
    extraCharges: Number(invoice.extraCharges) || 0,
    extraChargeName: invoice.extraChargeName || 'Loading Charge',
    roundOff: Number(invoice.roundOff) || 0,
    grandTotal: Number(invoice.grandTotal) || 0,
    paidAmount: Number(invoice.paidAmount) || 0,
    balanceAmount: Number(invoice.balanceAmount) || 0,
    paymentMode: invoice.paymentMode || 'CASH',
    paymentStatus: invoice.paymentStatus || (Number(invoice.balanceAmount) <= 0 ? 'PAID' : Number(invoice.paidAmount) > 0 ? 'PARTIAL' : 'UNPAID'),
    notes: invoice.notes || null,
    terms: invoice.terms || null,
    items: (invoice.items || []).map((it: any) => ({
      id: it.id,
      productName: it.productName || 'Item',
      description: it.description || null,
      quantity: Number(it.quantity) || 1,
      unit: it.unit || 'PCS',
      unitPrice: Number(it.unitPrice) || 0,
      discountPercent: Number(it.discountPercent) || 0,
      discountAmount: Number(it.discountAmount) || 0,
      totalAmount: Number(it.totalAmount) || 0,
    })),
  };

  const element = React.createElement(NonGstInvoiceTemplate, {
    business: businessData,
    invoice: invoiceData,
  });

  return renderTemplateToPdfBlob(element);
}

/**
 * High-level helper to share an invoice with attached PDF on WhatsApp / Web Share
 */
export async function shareInvoiceWithPdf(
  invoiceData: any,
  businessData: any,
  isGst: boolean = true,
  onNotify?: (msg: string) => void
): Promise<{ success: boolean; method: string }> {
  const invNumber = invoiceData.invoiceNumber || 'INV';
  const partyName = invoiceData.partyName || 'Customer';
  const grandTotal = invoiceData.grandTotal || 0;
  const paidAmount = invoiceData.paidAmount || 0;
  const balanceAmount = invoiceData.balanceAmount || 0;
  const businessName = businessData?.name || 'RAHUL JEE TRADING COMPANY';

  // Format rich WhatsApp text message
  let text = '';
  if (isGst) {
    text = `Namaste ${partyName},\n\nYour GST Tax Invoice #${invNumber} for ${formatINR(
      grandTotal
    )} from ${businessName} has been generated.\n\n*Invoice Summary:*\n- Total Amount: ${formatINR(
      grandTotal
    )}\n- Paid Amount: ${formatINR(paidAmount)}\n- Balance Due: ${formatINR(
      balanceAmount
    )}\n- Status: ${invoiceData.paymentStatus || 'PAID'}\n\n📄 *Your PDF invoice document is attached below.*\n\nThank you for doing business with us!`;
  } else {
    text = `Namaste ${partyName},\n\nYour Non-GST Invoice #${invNumber} for ${formatINR(
      grandTotal
    )} from ${businessName} has been generated.\n\n*Invoice Summary:*\n- Subtotal: ${formatINR(
      invoiceData.subTotal || grandTotal
    )}\n- Paid Amount: ${formatINR(paidAmount)}\n- Balance Due: ${formatINR(
      balanceAmount
    )}\n- Status: ${invoiceData.paymentStatus || 'PAID'}\n\n📄 *Your PDF invoice document is attached below.*\n\nThank you for doing business with us!`;
  }

  if (onNotify) {
    onNotify('Generating crystal-clear invoice PDF...');
  }

  // Generate high-resolution PDF Blob
  const pdfBlob = isGst
    ? await generateGstInvoicePdfBlob(invoiceData, businessData || {})
    : await generateNonGstInvoicePdfBlob(invoiceData, businessData || {});

  const cleanInvNo = String(invNumber).replace(/[^a-zA-Z0-9-_]/g, '_');
  const fileName = `Invoice_${cleanInvNo}.pdf`;
  const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

  const phone = invoiceData.partyPhone ? invoiceData.partyPhone.replace(/[^0-9]/g, '') : '';
  const whatsappUrl = phone
    ? `https://wa.me/91${phone}?text=${encodeURIComponent(text)}`
    : `https://wa.me/?text=${encodeURIComponent(text)}`;

  // 1. Try Native Web Share API Level 2 (with direct PDF file attachment on mobile/desktop browsers)
  if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
    try {
      await navigator.share({
        title: `Invoice #${invNumber}`,
        text: text,
        files: [pdfFile],
      });
      if (onNotify) onNotify('Invoice PDF shared successfully!');
      return { success: true, method: 'web-share' };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: false, method: 'aborted' };
      }
      console.warn('Web Share with files not accepted, falling back to download + WhatsApp:', err);
    }
  }

  // 2. Fallback for Desktop/WhatsApp Web: Auto-download the PDF so user has it immediately ready to send in WhatsApp Web
  const blobUrl = URL.createObjectURL(pdfBlob);
  const downloadLink = document.createElement('a');
  downloadLink.href = blobUrl;
  downloadLink.download = fileName;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

  if (onNotify) {
    onNotify('Invoice PDF downloaded! Opening WhatsApp to attach and send...');
  }

  // Open WhatsApp in new tab with pre-filled message
  window.open(whatsappUrl, '_blank');

  return { success: true, method: 'download-and-whatsapp' };
}

/**
 * Direct PDF download trigger helper
 */
export async function downloadInvoicePdf(
  invoiceData: any,
  businessData: any,
  isGst: boolean = true
): Promise<void> {
  const pdfBlob = isGst
    ? await generateGstInvoicePdfBlob(invoiceData, businessData || {})
    : await generateNonGstInvoicePdfBlob(invoiceData, businessData || {});

  const cleanInvNo = String(invoiceData.invoiceNumber || 'INV').replace(/[^a-zA-Z0-9-_]/g, '_');
  const fileName = `Invoice_${cleanInvNo}.pdf`;

  const blobUrl = URL.createObjectURL(pdfBlob);
  const downloadLink = document.createElement('a');
  downloadLink.href = blobUrl;
  downloadLink.download = fileName;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
}

/**
 * Generates an ultra-clear Purchase Bill / Inward Voucher PDF Blob matching the panel view 1:1
 */
export async function generatePurchaseBillPdfBlob(
  purchase: any,
  business: any
): Promise<Blob> {
  const businessData = {
    name: business?.name || 'RAHUL JEE TRADING COMPANY',
    legalName: business?.legalName || business?.name || 'RAHUL JEE TRADING COMPANY',
    gstin: business?.gstin || '09DMCPG4193P1ZG',
    pan: business?.pan || 'DMCPG4193P',
    address: business?.address || 'Allahabad Bank Road, Yusufpur, Mohammadabad, Dist- Ghazipur (U.P.) - 233227',
    state: business?.state || 'Uttar Pradesh',
    stateCode: business?.stateCode || '09',
    phone: business?.phone || '8887754821',
    email: business?.email || 'rahuljee1217@gmail.com',
    bankName: business?.bankName || 'HDFC Bank Ltd',
    bankAccountNo: business?.bankAccountNo || null,
    bankIfsc: business?.bankIfsc || null,
    bankBranch: business?.bankBranch || 'Mohammadabad, Ghazipur',
  };

  const purchaseData = {
    billNumber: purchase.billNumber || 'PUR-001',
    billDate: purchase.billDate || new Date(),
    dueDate: purchase.dueDate || null,
    partyName: purchase.partyName || purchase.party?.name || 'Supplier',
    partyGstin: purchase.partyGstin || purchase.party?.gstin || null,
    partyPhone: purchase.partyPhone || purchase.party?.phone || null,
    partyAddress: purchase.partyAddress || purchase.party?.address || null,
    partyState: purchase.partyState || purchase.party?.state || businessData.state,
    isInterState: purchase.isInterState ?? false,
    subTotal: Number(purchase.subTotal) || 0,
    discountTotal: Number(purchase.discountTotal) || 0,
    taxableTotal: Number(purchase.taxableTotal) || 0,
    cgstTotal: Number(purchase.cgstTotal) || 0,
    sgstTotal: Number(purchase.sgstTotal) || 0,
    igstTotal: Number(purchase.igstTotal) || 0,
    taxTotal: Number(purchase.taxTotal) || 0,
    roundOff: Number(purchase.roundOff) || 0,
    grandTotal: Number(purchase.grandTotal) || 0,
    paidAmount: Number(purchase.paidAmount) || 0,
    balanceAmount: Number(purchase.balanceAmount) || 0,
    paymentMode: purchase.paymentMode || 'BANK',
    paymentStatus: purchase.paymentStatus || (Number(purchase.balanceAmount) === 0 ? 'PAID' : 'UNPAID'),
    notes: purchase.notes || null,
    items: (purchase.items || []).map((it: any) => ({
      id: it.id,
      productName: it.productName || it.product?.name || 'Item',
      hsnCode: it.hsnCode || it.product?.hsnCode || null,
      quantity: Number(it.quantity) || 1,
      unit: it.unit || it.product?.unit || 'PCS',
      unitPrice: Number(it.unitPrice) || 0,
      discountAmount: Number(it.discountAmount) || 0,
      taxableAmount: Number(it.taxableAmount) || 0,
      gstRate: Number(it.gstRate) || 0,
      cgstAmount: Number(it.cgstAmount) || 0,
      sgstAmount: Number(it.sgstAmount) || 0,
      igstAmount: Number(it.igstAmount) || 0,
      totalAmount: Number(it.totalAmount) || 0,
    })),
  };

  const element = React.createElement(PurchaseBillA4Template, {
    business: businessData,
    purchase: purchaseData,
  });

  return renderTemplateToPdfBlob(element);
}

/**
 * Direct Purchase Bill PDF download trigger helper
 */
export async function downloadPurchaseBillPdf(
  purchaseData: any,
  businessData: any
): Promise<void> {
  const pdfBlob = await generatePurchaseBillPdfBlob(purchaseData, businessData || {});
  const cleanBillNo = String(purchaseData.billNumber || 'PUR').replace(/[^a-zA-Z0-9-_]/g, '_');
  const fileName = `Purchase_Bill_${cleanBillNo}.pdf`;

  const blobUrl = URL.createObjectURL(pdfBlob);
  const downloadLink = document.createElement('a');
  downloadLink.href = blobUrl;
  downloadLink.download = fileName;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
}

/**
 * Share Purchase Bill with attached PDF on WhatsApp / Web Share
 */
export async function sharePurchaseBillWithPdf(
  purchaseData: any,
  businessData: any,
  onNotify?: (msg: string) => void
): Promise<{ success: boolean; method: string }> {
  const billNumber = purchaseData.billNumber || 'PUR';
  const partyName = purchaseData.partyName || purchaseData.party?.name || 'Supplier';
  const grandTotal = purchaseData.grandTotal || 0;
  const paidAmount = purchaseData.paidAmount || 0;
  const balanceAmount = purchaseData.balanceAmount || 0;
  const businessName = businessData?.name || 'RAHUL JEE TRADING COMPANY';

  const text = `Namaste ${partyName},\n\nPurchase Inward Voucher #${billNumber} for ${formatINR(
    grandTotal
  )} has been verified and recorded at ${businessName}.\n\n*Purchase Bill Summary:*\n- Total Amount: ${formatINR(
    grandTotal
  )}\n- Paid Amount: ${formatINR(paidAmount)}\n- Balance Payable: ${formatINR(
    balanceAmount
  )}\n- Payment Mode: ${purchaseData.paymentMode || 'BANK'}\n- Status: ${purchaseData.paymentStatus || 'PAID'}\n\n📄 *Your Purchase Bill PDF voucher is attached below.*\n\nRAHUL JEE TRADING COMPANY — Inventory & Accounts Inward`;

  if (onNotify) {
    onNotify('Generating crystal-clear purchase bill PDF...');
  }

  const pdfBlob = await generatePurchaseBillPdfBlob(purchaseData, businessData || {});
  const cleanBillNo = String(billNumber).replace(/[^a-zA-Z0-9-_]/g, '_');
  const fileName = `Purchase_Bill_${cleanBillNo}.pdf`;
  const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

  const phone = purchaseData.partyPhone || purchaseData.party?.phone
    ? (purchaseData.partyPhone || purchaseData.party?.phone).replace(/[^0-9]/g, '')
    : '';
  const whatsappUrl = phone
    ? `https://wa.me/91${phone}?text=${encodeURIComponent(text)}`
    : `https://wa.me/?text=${encodeURIComponent(text)}`;

  // 1. Try Native Web Share API Level 2 (with direct PDF file attachment on mobile/desktop browsers)
  if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
    try {
      await navigator.share({
        title: `Purchase Bill #${billNumber}`,
        text: text,
        files: [pdfFile],
      });
      if (onNotify) onNotify('Purchase Bill PDF shared successfully!');
      return { success: true, method: 'web-share' };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: false, method: 'aborted' };
      }
      console.warn('Web Share not accepted, falling back to download + WhatsApp:', err);
    }
  }

  // 2. Fallback for Desktop/WhatsApp Web: Auto-download the PDF so user has it immediately ready
  const blobUrl = URL.createObjectURL(pdfBlob);
  const downloadLink = document.createElement('a');
  downloadLink.href = blobUrl;
  downloadLink.download = fileName;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

  if (onNotify) {
    onNotify('Purchase Bill PDF downloaded! Opening WhatsApp to attach and send...');
  }

  window.open(whatsappUrl, '_blank');
  return { success: true, method: 'download-and-whatsapp' };
}

