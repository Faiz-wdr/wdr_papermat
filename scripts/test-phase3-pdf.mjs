import React from 'react';
import ReactPDF from '@react-pdf/renderer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { InvoicePDFDocument } from '../src/components/pdf/InvoicePDFDocument.jsx';
import { numberToWordsINR } from '../src/utils/invoiceCalculations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Test numberToWordsINR
console.log('Testing numberToWordsINR:');
console.log('3185.00 ->', numberToWordsINR(3185.00));
console.log('3185.50 ->', numberToWordsINR(3185.50));
console.log('105000.75 ->', numberToWordsINR(105000.75));
console.log('12500000 ->', numberToWordsINR(12500000));

// 2. Test single-page PDF rendering
const sampleInvoice = {
  id: 'test-inv-1',
  invoice_number: 'WPM/26-27/001',
  invoice_date: '2026-09-19',
  customer_name: 'AKG Memorial High School',
  customer_address: 'Wandoor P.O, Nilambur Taluk, Malappuram Dist, Kerala - 679328',
  customer_mobile: '9447123456',
  customer_gst_no: '32AABCA1234F1Z6',
  taxable_value: 2700.00,
  total_cgst: 242.75,
  total_sgst: 242.75,
  grand_total: 3185.50,
};

const sampleSettings = {
  business_name: 'Wandoor Paper Mart',
  address: 'Main Road, Near Bus Stand, Wandoor, Malappuram, Kerala - 679328',
  mobile: '9847123456',
  gst_no: '32ABCDE1234F1Z5',
  bank_name: 'State Bank of India',
  bank_branch: 'Wandoor Branch',
  account_number: '384729104928',
  ifsc_code: 'SBIN0070188',
};

const sampleItems = [
  {
    id: 'item-1',
    item_name: 'Classmate Notebook 200 Pgs Ruled',
    hsn_code: '4820',
    qty: 25,
    uom: 'PCS',
    unit_rate: 60.00,
    taxable_value: 1500.00,
    cgst_rate: 6,
    sgst_rate: 6,
    cgst_amount: 90.00,
    sgst_amount: 90.00,
    total: 1680.00,
  },
  {
    id: 'item-2',
    item_name: 'Reynolds Ballpoint Pens (Pack of 10)',
    hsn_code: '9608',
    qty: 10,
    uom: 'PKT',
    unit_rate: 90.00,
    taxable_value: 900.00,
    cgst_rate: 9,
    sgst_rate: 9,
    cgst_amount: 81.00,
    sgst_amount: 81.00,
    total: 1062.00,
  },
  {
    id: 'item-3',
    item_name: 'JK Copier A4 Paper 75 GSM (500 Sheets)',
    hsn_code: '4802',
    qty: 1,
    uom: 'RIM',
    unit_rate: 300.00,
    taxable_value: 300.00,
    cgst_rate: 6,
    sgst_rate: 6,
    cgst_amount: 18.00,
    sgst_amount: 18.00,
    total: 336.00,
  }
];

async function runTests() {
  const outDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const singlePagePath = path.join(outDir, 'single-page-test.pdf');
  console.log('\nRendering single-page PDF to:', singlePagePath);
  await ReactPDF.renderToFile(
    React.createElement(InvoicePDFDocument, {
      invoice: sampleInvoice,
      items: sampleItems,
      businessSettings: sampleSettings,
    }),
    singlePagePath
  );
  console.log('Single-page PDF created successfully! Size:', fs.statSync(singlePagePath).size, 'bytes');

  // Multi-page test with 25 items
  const multiItems = [];
  let currentTaxable = 0;
  let currentCgst = 0;
  let currentSgst = 0;
  let currentGrand = 0;
  for (let i = 1; i <= 25; i++) {
    const itemTax = 100 * i;
    const cgst = itemTax * 0.06;
    const sgst = itemTax * 0.06;
    const tot = itemTax + cgst + sgst;
    currentTaxable += itemTax;
    currentCgst += cgst;
    currentSgst += sgst;
    currentGrand += tot;
    multiItems.push({
      id: `item-${i}`,
      item_name: `School Stationery Supply Item #${i} - Standard Pack`,
      hsn_code: '4820',
      qty: i * 2,
      uom: 'PCS',
      unit_rate: 50.00,
      taxable_value: itemTax,
      cgst_rate: 6,
      sgst_rate: 6,
      cgst_amount: cgst,
      sgst_amount: sgst,
      total: tot,
    });
  }

  const multiInvoice = {
    ...sampleInvoice,
    invoice_number: 'WPM/26-27/002',
    taxable_value: currentTaxable,
    total_cgst: currentCgst,
    total_sgst: currentSgst,
    grand_total: currentGrand,
  };

  const multiPagePath = path.join(outDir, 'multi-page-test.pdf');
  console.log('\nRendering multi-page PDF to:', multiPagePath);
  await ReactPDF.renderToFile(
    React.createElement(InvoicePDFDocument, {
      invoice: multiInvoice,
      items: multiItems,
      businessSettings: sampleSettings,
    }),
    multiPagePath
  );
  console.log('Multi-page PDF created successfully! Size:', fs.statSync(multiPagePath).size, 'bytes');
  console.log('\nAll PDF verification tests passed cleanly!');
}

runTests().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
