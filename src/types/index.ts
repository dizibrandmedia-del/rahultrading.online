export type BusinessType = 'Retail' | 'Wholesale' | 'Distributor' | 'Manufacturing' | 'Pharmacy' | 'Services';
export type GstScheme = 'REGULAR' | 'COMPOSITION' | 'UNREGISTERED';
export type PartyType = 'CUSTOMER' | 'SUPPLIER' | 'BOTH';
export type PaymentStatus = 'PAID' | 'PARTIAL' | 'UNPAID';
export type PaymentMode = 'UNPAID' | 'CASH' | 'UPI' | 'CARD' | 'BANK' | 'CREDIT' | 'CHEQUE' | 'SPLIT';
export type UserRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'ACCOUNTANT' | 'SALESMAN' | 'CASHIER';

export interface IndianState {
  code: string;
  name: string;
}

export const INDIAN_STATES: IndianState[] = [
  { code: '01', name: 'Jammu and Kashmir' },
  { code: '02', name: 'Himachal Pradesh' },
  { code: '03', name: 'Punjab' },
  { code: '04', name: 'Chandigarh' },
  { code: '05', name: 'Uttarakhand' },
  { code: '06', name: 'Haryana' },
  { code: '07', name: 'Delhi' },
  { code: '08', name: 'Rajasthan' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '10', name: 'Bihar' },
  { code: '11', name: 'Sikkim' },
  { code: '12', name: 'Arunachal Pradesh' },
  { code: '13', name: 'Nagaland' },
  { code: '14', name: 'Manipur' },
  { code: '15', name: 'Mizoram' },
  { code: '16', name: 'Tripura' },
  { code: '17', name: 'Meghalaya' },
  { code: '18', name: 'Assam' },
  { code: '19', name: 'West Bengal' },
  { code: '20', name: 'Jharkhand' },
  { code: '21', name: 'Odisha' },
  { code: '22', name: 'Chhattisgarh' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '24', name: 'Gujarat' },
  { code: '27', name: 'Maharashtra' },
  { code: '29', name: 'Karnataka' },
  { code: '30', name: 'Goa' },
  { code: '32', name: 'Kerala' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '36', name: 'Telangana' },
  { code: '37', name: 'Andhra Pradesh' },
];

export interface InvoiceItemDraft {
  id?: string;
  productId?: string;
  productName: string;
  hsnCode: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  taxableAmount: number;
  gstRate: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  isTaxInclusive?: boolean;
  totalAmount: number;
}

export interface GstCalculationResult {
  isInterState: boolean;
  subTotal: number;
  discountTotal: number;
  taxableTotal: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  taxTotal: number;
  roundOff: number;
  grandTotal: number;
  items: InvoiceItemDraft[];
}

export interface NonGstInvoiceItemDraft {
  id?: string;
  productId?: string;
  productName: string;
  description?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  totalAmount: number;
}

export interface NonGstCalculationResult {
  subTotal: number;
  discountTotal: number;
  extraCharges: number;
  extraChargeName: string;
  grandTotal: number;
  paidAmount: number;
  balanceAmount: number;
  items: NonGstInvoiceItemDraft[];
}

