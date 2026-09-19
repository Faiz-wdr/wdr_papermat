import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { InvoicePDFDocument } from '../components/pdf/InvoicePDFDocument';

/**
 * Generate a PDF Blob for the given invoice data
 */
export async function generateInvoicePDFBlob(invoice, items, businessSettings) {
  const doc = React.createElement(InvoicePDFDocument, {
    invoice,
    items,
    businessSettings,
  });
  return await pdf(doc).toBlob();
}

/**
 * Trigger an on-demand download of the invoice PDF
 * Named Invoice-{invoice_number}.pdf
 */
export async function downloadInvoicePDF(invoice, items, businessSettings) {
  const blob = await generateInvoicePDFBlob(invoice, items, businessSettings);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const fileName = `Invoice-${invoice?.invoice_number || 'document'}.pdf`;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up object URL after a short delay
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1500);

  return fileName;
}
