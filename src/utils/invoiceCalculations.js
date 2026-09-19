/**
 * Precise 2-decimal monetary rounding to prevent floating-point inaccuracies
 */
export function round2(num) {
  const n = Number(num);
  if (isNaN(n)) return 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Calculate totals for an individual line item.
 * Supports intra-state GST (CGST + SGST).
 * Structured so IGST can be supported in future phases without redesign.
 */
export function calculateItemTotals(item) {
  const qty = Math.max(0, Number(item.qty) || 0);
  const unitRate = Math.max(0, Number(item.unit_rate) || 0);
  const gstRate = Math.max(0, Number(item.gst_rate) || 0);

  const taxableValue = round2(qty * unitRate);

  // Intra-state split: half to CGST, half to SGST
  const cgstRate = round2(gstRate / 2);
  const sgstRate = round2(gstRate / 2);

  const cgstAmount = round2((taxableValue * cgstRate) / 100);
  const sgstAmount = round2((taxableValue * sgstRate) / 100);

  const total = round2(taxableValue + cgstAmount + sgstAmount);

  return {
    ...item,
    qty,
    unit_rate: unitRate,
    gst_rate: gstRate,
    taxable_value: taxableValue,
    cgst_rate: cgstRate,
    sgst_rate: sgstRate,
    cgst_amount: cgstAmount,
    sgst_amount: sgstAmount,
    total: total,
  };
}

/**
 * Calculate aggregate invoice totals across all line items
 */
export function calculateInvoiceTotals(items = []) {
  let totalQty = 0;
  let taxableValue = 0;
  let totalCGST = 0;
  let totalSGST = 0;
  let grandTotal = 0;

  // Breakdown by GST rate if needed
  const gstBreakdown = {};

  items.forEach((item) => {
    const calculated = calculateItemTotals(item);
    totalQty += calculated.qty;
    taxableValue += calculated.taxable_value;
    totalCGST += calculated.cgst_amount;
    totalSGST += calculated.sgst_amount;
    grandTotal += calculated.total;

    const rateKey = calculated.gst_rate;
    if (!gstBreakdown[rateKey]) {
      gstBreakdown[rateKey] = {
        gstRate: rateKey,
        cgstRate: calculated.cgst_rate,
        sgstRate: calculated.sgst_rate,
        taxableValue: 0,
        cgstAmount: 0,
        sgstAmount: 0,
        total: 0,
      };
    }
    gstBreakdown[rateKey].taxableValue += calculated.taxable_value;
    gstBreakdown[rateKey].cgstAmount += calculated.cgst_amount;
    gstBreakdown[rateKey].sgstAmount += calculated.sgst_amount;
    gstBreakdown[rateKey].total += calculated.total;
  });

  return {
    totalQty: round2(totalQty),
    taxableValue: round2(taxableValue),
    totalCGST: round2(totalCGST),
    totalSGST: round2(totalSGST),
    grandTotal: round2(grandTotal),
    gstBreakdown,
  };
}

/**
/**
 * Convert numerical currency to words in Indian numbering system
 * Handles Thousands, Lakhs, Crores, and Paise accurately.
 * Examples:
 *  - 3185.00 -> "Three Thousand One Hundred Eighty-Five Rupees Only"
 *  - 3185.50 -> "Three Thousand One Hundred Eighty-Five Rupees and Fifty Paise Only"
 *  - 0.75 -> "Seventy-Five Paise Only"
 */
export function numberToWordsINR(amount) {
  const num = Number(amount) || 0;
  if (num === 0) return 'Zero Rupees Only';

  const rupees = Math.floor(Math.abs(num));
  const paise = Math.round((Math.abs(num) - rupees) * 100);

  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const b = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
  ];

  function convertHundreds(n) {
    let str = '';
    if (n > 99) {
      str += a[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n > 19) {
      str += b[Math.floor(n / 10)] + (n % 10 !== 0 ? '-' + a[n % 10] : '') + ' ';
    } else if (n > 0) {
      str += a[n] + ' ';
    }
    return str.trim();
  }

  function convertAmount(val) {
    if (val === 0) return '';
    const crores = Math.floor(val / 10000000);
    const lakhs = Math.floor((val % 10000000) / 100000);
    const thousands = Math.floor((val % 100000) / 1000);
    const remaining = val % 1000;

    let words = '';
    if (crores > 0) words += convertHundreds(crores) + ' Crore ';
    if (lakhs > 0) words += convertHundreds(lakhs) + ' Lakh ';
    if (thousands > 0) words += convertHundreds(thousands) + ' Thousand ';
    if (remaining > 0) words += convertHundreds(remaining);
    return words.trim();
  }

  const rupeePart = rupees > 0 ? convertAmount(rupees) + ' Rupees' : '';
  const paisePart = paise > 0 ? convertHundreds(paise) + ' Paise' : '';

  if (rupeePart && paisePart) {
    return (rupeePart + ' and ' + paisePart + ' Only').replace(/\s+/g, ' ');
  } else if (rupeePart) {
    return (rupeePart + ' Only').replace(/\s+/g, ' ');
  } else if (paisePart) {
    return (paisePart + ' Only').replace(/\s+/g, ' ');
  }

  return 'Zero Rupees Only';
}
