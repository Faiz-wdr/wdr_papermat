/**
 * Validates invoice payload before saving as Draft or Finalizing
 */
export function validateInvoice(invoiceData, items = [], isFinalizing = false) {
  const errors = [];

  // Customer validation
  if (!invoiceData.customer_name || !invoiceData.customer_name.trim()) {
    errors.push('Customer Name is required.');
  }

  // Invoice Date validation
  if (!invoiceData.invoice_date) {
    errors.push('Invoice Date is required.');
  }

  // Items validation
  if (!items || items.length === 0) {
    errors.push('Please add at least one item to the invoice.');
  } else {
    items.forEach((item, index) => {
      const rowNum = index + 1;
      if (!item.item_name || !item.item_name.trim()) {
        errors.push(`Row ${rowNum}: Item description is required.`);
      }

      const qty = Number(item.qty);
      if (isNaN(qty) || qty <= 0) {
        errors.push(`Row ${rowNum} (${item.item_name || 'Item'}): Quantity must be greater than 0.`);
      }

      const rate = Number(item.unit_rate);
      if (isNaN(rate) || rate < 0) {
        errors.push(`Row ${rowNum} (${item.item_name || 'Item'}): Unit rate cannot be negative.`);
      }

      const gst = Number(item.gst_rate);
      if (isNaN(gst) || gst < 0) {
        errors.push(`Row ${rowNum} (${item.item_name || 'Item'}): Valid GST rate is required.`);
      }
    });
  }

  // Mobile format validation (optional, but if provided, must be reasonable)
  if (invoiceData.customer_mobile && invoiceData.customer_mobile.trim()) {
    const cleaned = invoiceData.customer_mobile.replace(/[^0-9+]/g, '');
    if (cleaned.length < 8) {
      errors.push('Please provide a valid contact mobile number.');
    }
  }

  // GST Number format validation (optional, but if provided, check length)
  if (invoiceData.customer_gst_no && invoiceData.customer_gst_no.trim()) {
    const gstCleaned = invoiceData.customer_gst_no.trim();
    if (gstCleaned.length !== 15 && isFinalizing) {
      // Warning or soft error: GSTIN is 15 characters
      // We can allow or warn
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
