import { Client } from 'pg';
import React from 'react';
import ReactPDF from '@react-pdf/renderer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { InvoicePDFDocument } from '../src/components/pdf/InvoicePDFDocument.jsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({
  connectionString: 'postgresql://postgres:papermart123%40@db.fidtfvfwnqofhwnoxluq.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  const inv = (await client.query("SELECT * FROM invoices WHERE id = '03bc5e0e-1b06-4ba4-bb0a-2eba97a65dba';")).rows[0];
  const items = (await client.query("SELECT * FROM invoice_items WHERE invoice_id = '03bc5e0e-1b06-4ba4-bb0a-2eba97a65dba' ORDER BY sort_order;")).rows;
  const settings = (await client.query("SELECT * FROM business_settings LIMIT 1;")).rows[0];
  await client.end();

  const outDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outPath = path.join(outDir, 'Invoice-0701.pdf');
  await ReactPDF.renderToFile(
    React.createElement(InvoicePDFDocument, {
      invoice: inv,
      items: items,
      businessSettings: settings
    }),
    outPath
  );
  console.log('Rendered Invoice-0701.pdf successfully! File size:', fs.statSync(outPath).size, 'bytes');
}

run().catch(console.error);
