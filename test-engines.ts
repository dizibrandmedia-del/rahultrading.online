import { calculateInvoiceGst, validateGSTIN } from './src/lib/gst-engine';
import { formatINR, numberToWordsINR } from './src/lib/currency';

console.log('=== BUSINESSOS GST & CALCULATION ENGINE VERIFICATION ===\n');

// Test 1: Intra-State GST Calculation (Delhi -> Delhi)
const intraResult = calculateInvoiceGst('07', '07', [
  {
    productName: 'Tata Tea Gold 500g',
    hsnCode: '0902',
    quantity: 2,
    unit: 'PKT',
    unitPrice: 500, // 2 x 500 = 1000
    discountPercent: 0,
    discountAmount: 0,
    taxableAmount: 0,
    gstRate: 18,
    cgstRate: 0,
    cgstAmount: 0,
    sgstRate: 0,
    sgstAmount: 0,
    igstRate: 0,
    igstAmount: 0,
    totalAmount: 0,
  },
]);

console.log('Test 1: Intra-State GST (CGST + SGST):');
console.log(`- Subtotal: ${intraResult.subTotal}`);
console.log(`- Taxable: ${intraResult.taxableTotal}`);
console.log(`- CGST (9%): ${intraResult.cgstTotal} (Expected: 90.00)`);
console.log(`- SGST (9%): ${intraResult.sgstTotal} (Expected: 90.00)`);
console.log(`- IGST: ${intraResult.igstTotal} (Expected: 0.00)`);
console.log(`- Grand Total: ${intraResult.grandTotal} (Expected: 1180.00)`);
if (intraResult.cgstTotal === 90 && intraResult.sgstTotal === 90 && intraResult.grandTotal === 1180) {
  console.log('✔ PASS: Intra-State GST Engine verified.\n');
} else {
  console.error('❌ FAIL: Intra-State GST Calculation mismatch.\n');
  process.exit(1);
}

// Test 2: Inter-State GST Calculation (Delhi -> Haryana)
const interResult = calculateInvoiceGst('07', '06', [
  {
    productName: 'boAt Cable',
    hsnCode: '8544',
    quantity: 1,
    unit: 'PCS',
    unitPrice: 1000,
    discountPercent: 0,
    discountAmount: 0,
    taxableAmount: 0,
    gstRate: 18,
    cgstRate: 0,
    cgstAmount: 0,
    sgstRate: 0,
    sgstAmount: 0,
    igstRate: 0,
    igstAmount: 0,
    totalAmount: 0,
  },
]);

console.log('Test 2: Inter-State GST (IGST):');
console.log(`- CGST: ${interResult.cgstTotal} (Expected: 0.00)`);
console.log(`- SGST: ${interResult.sgstTotal} (Expected: 0.00)`);
console.log(`- IGST (18%): ${interResult.igstTotal} (Expected: 180.00)`);
console.log(`- Grand Total: ${interResult.grandTotal} (Expected: 1180.00)`);
if (interResult.igstTotal === 180 && interResult.cgstTotal === 0 && interResult.grandTotal === 1180) {
  console.log('✔ PASS: Inter-State IGST Engine verified.\n');
} else {
  console.error('❌ FAIL: Inter-State GST Calculation mismatch.\n');
  process.exit(1);
}

// Test 3: Currency & Number to Words
console.log('Test 3: Indian Rupee Formatting & Words:');
const formatted1 = formatINR(123456.78);
console.log(`- 123456.78 -> ${formatted1}`);
const words1 = numberToWordsINR(150000);
console.log(`- 150000 -> "${words1}"`);
if (words1.includes('One Lakh Fifty Thousand Rupees Only')) {
  console.log('✔ PASS: Indian Currency Words formatting verified.\n');
} else {
  console.error('❌ FAIL: Words conversion failed.\n');
  process.exit(1);
}

// Test 4: GSTIN Validator
console.log('Test 4: GSTIN Verification:');
const gstinTest = validateGSTIN('07AAAAA0000A1Z5');
console.log(`- 07AAAAA0000A1Z5 -> Valid: ${gstinTest.isValid}, State Code: ${gstinTest.stateCode}`);
if (gstinTest.isValid && gstinTest.stateCode === '07') {
  console.log('✔ PASS: GSTIN validation verified.\n');
} else {
  console.error('❌ FAIL: GSTIN validator failed.\n');
  process.exit(1);
}

console.log('ALL CORE BUSINESS ENGINES VERIFIED SUCCESSFULLY!');
