/**
 * Formats a number according to Indian Currency standard (e.g. ₹ 1,23,456.78)
 */
export function formatINR(amount: number | null | undefined, showSymbol: boolean = true): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return showSymbol ? '₹0.00' : '0.00';
  }
  
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  
  const parts = absAmount.toFixed(2).split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];
  
  // Indian numbering format: last 3 digits, then groups of 2 digits
  if (integerPart.length > 3) {
    const last3 = integerPart.substring(integerPart.length - 3);
    const otherNumbers = integerPart.substring(0, integerPart.length - 3);
    integerPart = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
  }
  
  const formatted = `${integerPart}.${decimalPart}`;
  const prefix = isNegative ? '-' : '';
  return showSymbol ? `${prefix}₹${formatted}` : `${prefix}${formatted}`;
}

/**
 * Converts a number to Words in Indian English (e.g. 1500 -> "One Thousand Five Hundred Rupees Only")
 */
export function numberToWordsINR(amount: number): string {
  if (!amount || amount === 0) return 'Zero Rupees Only';
  
  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];
  
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  function convertGroup(num: number): string {
    let groupStr = '';
    if (num >= 100) {
      groupStr += ones[Math.floor(num / 100)] + ' Hundred ';
      num %= 100;
    }
    if (num >= 20) {
      groupStr += tens[Math.floor(num / 10)] + ' ';
      num %= 10;
    }
    if (num > 0) {
      groupStr += ones[num] + ' ';
    }
    return groupStr.trim();
  }
  
  const isNegative = amount < 0;
  amount = Math.abs(amount);
  
  const integerPart = Math.floor(amount);
  const paise = Math.round((amount - integerPart) * 100);
  
  let result = '';
  
  const crore = Math.floor(integerPart / 10000000);
  const lakh = Math.floor((integerPart % 10000000) / 100000);
  const thousand = Math.floor((integerPart % 100000) / 1000);
  const remaining = integerPart % 1000;
  
  if (crore > 0) {
    result += convertGroup(crore) + ' Crore ';
  }
  if (lakh > 0) {
    result += convertGroup(lakh) + ' Lakh ';
  }
  if (thousand > 0) {
    result += convertGroup(thousand) + ' Thousand ';
  }
  if (remaining > 0) {
    result += convertGroup(remaining) + ' ';
  }
  
  result = result.trim() + ' Rupees';
  
  if (paise > 0) {
    result += ' and ' + convertGroup(paise) + ' Paise';
  }
  
  result += ' Only';
  return (isNegative ? 'Minus ' : '') + result;
}
