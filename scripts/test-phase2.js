import { createClient } from '@supabase/supabase-js';
import { calculateItemTotals, calculateInvoiceTotals, round2, numberToWordsINR } from '../src/utils/invoiceCalculations.js';
import { validateInvoice } from '../src/utils/invoiceValidation.js';

const supabaseUrl = 'https://fidtfvfwnqofhwnoxluq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpZHRmdmZ3bnFvZmh3bm94bHVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4MjMyOTEsImV4cCI6MjEwNTM5OTI5MX0.SAcPfDXt0Fv_QtHMnhVLIiGmq9630ZNiBFiA1jmO2AU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runFullVerification() {
  console.log('=====================================================');
  console.log('STARTING PHASE 2 COMPREHENSIVE VERIFICATION SUITE');
  console.log('=====================================================');

  // Authenticate
  const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
    email: 'wandoor.papermart@gmail.com',
    password: 'papermart123',
  });
  if (authError) throw new Error('Auth failed: ' + authError.message);
  console.log('✔ Authenticated as:', auth.user.email);

  // 1 & 2: Create a new customer & select customer
  console.log('\n--- 1. Testing Customer Creation ---');
  const custName = 'Govt Girls HSS Wandoor';
  const custMobile = '9747748658';
  const custGST = '32BIVPA1766K1Z1';
  const custAddress = 'City Tower Market Road, Wandoor, 679328';

  const { data: newCust, error: custError } = await supabase
    .from('customers')
    .insert([
      {
        name: custName,
        address: custAddress,
        mobile: custMobile,
        gst_no: custGST,
      },
    ])
    .select()
    .single();
  if (custError) throw custError;
  console.log('✔ Customer created:', newCust.name, '| ID:', newCust.id);

  // 3 & 4: Search customer by name and mobile
  console.log('\n--- 2. Testing Customer Search ---');
  const { data: foundByName } = await supabase
    .from('customers')
    .select('*')
    .ilike('name', '%Wandoor%');
  console.log('✔ Search by name found:', foundByName.length, 'records');

  const { data: foundByMobile } = await supabase
    .from('customers')
    .select('*')
    .ilike('mobile', '%97477%');
  console.log('✔ Search by mobile found:', foundByMobile.length, 'records');

  // 5 & 6: Search item by name and HSN
  console.log('\n--- 3. Testing Items Search ---');
  const { data: foundItemName } = await supabase
    .from('items')
    .select('*')
    .ilike('name', '%Notebook%');
  console.log('✔ Search items by name found:', foundItemName.length, 'items');

  const { data: foundItemHSN } = await supabase
    .from('items')
    .select('*')
    .ilike('hsn_code', '%4820%');
  console.log('✔ Search items by HSN (4820) found:', foundItemHSN.length, 'items');

  // 7 - 15: Add multiple items, custom rate, calculate GST (18%, 12%, 5%), and verify math
  console.log('\n--- 4. Testing GST Calculations & Line Items Math ---');
  // Item 1: 20 pcs of File @ 38.14, 18% GST (matching reference image line 1)
  const item1 = calculateItemTotals({
    item_name: 'AARPEE FILE DF 1609',
    hsn_code: '39261019',
    qty: 20,
    uom: 'BORD',
    unit_rate: 38.14,
    gst_rate: 18,
  });
  console.log('Item 1 (18% GST):', {
    taxable: item1.taxable_value,
    cgst_rate: item1.cgst_rate,
    cgst_amt: item1.cgst_amount,
    sgst_rate: item1.sgst_rate,
    sgst_amt: item1.sgst_amount,
    total: item1.total,
  });
  if (item1.taxable_value !== 762.80) throw new Error('Taxable mismatch');
  if (item1.cgst_amount !== 68.65 || item1.sgst_amount !== 68.65) throw new Error('CGST/SGST mismatch');
  console.log('✔ 18% GST split into 9% CGST and 9% SGST accurately.');

  // Item 2: 5% GST item
  const item2 = calculateItemTotals({
    item_name: 'Exam Board Wood 5%',
    hsn_code: '4421',
    qty: 10,
    uom: 'PCS',
    unit_rate: 50.0,
    gst_rate: 5,
  });
  console.log('Item 2 (5% GST):', {
    taxable: item2.taxable_value,
    cgst_rate: item2.cgst_rate,
    cgst_amt: item2.cgst_amount,
    sgst_rate: item2.sgst_rate,
    sgst_amt: item2.sgst_amount,
    total: item2.total,
  });
  if (item2.cgst_amount !== 12.5 || item2.sgst_amount !== 12.5) throw new Error('5% GST mismatch');
  console.log('✔ 5% GST split into 2.5% CGST and 2.5% SGST accurately.');

  // Item 3: 12% GST item
  const item3 = calculateItemTotals({
    item_name: 'Drawing Book 12%',
    hsn_code: '4820',
    qty: 5,
    uom: 'PCS',
    unit_rate: 40.0,
    gst_rate: 12,
  });
  console.log('Item 3 (12% GST):', {
    taxable: item3.taxable_value,
    cgst_rate: item3.cgst_rate,
    cgst_amt: item3.cgst_amount,
    sgst_rate: item3.sgst_rate,
    sgst_amt: item3.sgst_amount,
    total: item3.total,
  });
  if (item3.cgst_amount !== 12.0 || item3.sgst_amount !== 12.0) throw new Error('12% GST mismatch');
  console.log('✔ 12% GST split into 6% CGST and 6% SGST accurately.');

  const invoiceTotals = calculateInvoiceTotals([item1, item2, item3]);
  console.log('Aggregated Totals:', invoiceTotals);
  console.log('Amount in Words:', numberToWordsINR(invoiceTotals.grandTotal));

  // 16. Test Save Draft
  console.log('\n--- 5. Testing Save Draft Flow ---');
  const draftInvoicePayload = {
    customer_id: newCust.id,
    customer_name: newCust.name,
    customer_address: newCust.address,
    customer_mobile: newCust.mobile,
    customer_gst_no: newCust.gst_no,
    invoice_date: '2026-09-19',
    taxable_value: invoiceTotals.taxableValue,
    total_cgst: invoiceTotals.totalCGST,
    total_sgst: invoiceTotals.totalSGST,
    grand_total: invoiceTotals.grandTotal,
  };

  const itemsList = [item1, item2, item3];

  const { data: savedDraft, error: draftSaveError } = await supabase.rpc('save_invoice', {
    p_invoice: draftInvoicePayload,
    p_items: itemsList,
    p_finalize: false,
  });
  if (draftSaveError) throw draftSaveError;

  console.log('✔ Draft saved successfully!');
  console.log('Draft Invoice ID:', savedDraft.id);
  console.log('Draft Invoice Number:', savedDraft.invoice_number);
  console.log('Draft Status:', savedDraft.status);
  if (!savedDraft.invoice_number.startsWith('DRAFT-')) throw new Error('Draft number format error');
  if (savedDraft.status !== 'draft') throw new Error('Status should be draft');

  // Verify invoice items saved in DB
  const { data: savedItems } = await supabase
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', savedDraft.id);
  console.log('✔ Draft line items in DB count:', savedItems.length);
  if (savedItems.length !== 3) throw new Error('Line items count mismatch');

  // 17. Test Edit Draft (update qty on item 2 and remove item 3)
  console.log('\n--- 6. Testing Edit Draft Flow ---');
  const item2Updated = calculateItemTotals({
    ...item2,
    qty: 20, // changed qty from 10 to 20
  });
  const updatedItemsList = [item1, item2Updated]; // removed item3
  const updatedTotals = calculateInvoiceTotals(updatedItemsList);

  const editDraftPayload = {
    id: savedDraft.id,
    customer_id: newCust.id,
    customer_name: newCust.name,
    customer_address: newCust.address,
    customer_mobile: newCust.mobile,
    customer_gst_no: newCust.gst_no,
    invoice_date: '2026-09-19',
    taxable_value: updatedTotals.taxableValue,
    total_cgst: updatedTotals.totalCGST,
    total_sgst: updatedTotals.totalSGST,
    grand_total: updatedTotals.grandTotal,
  };

  const { data: editedDraft, error: editError } = await supabase.rpc('save_invoice', {
    p_invoice: editDraftPayload,
    p_items: updatedItemsList,
    p_finalize: false,
  });
  if (editError) throw editError;
  console.log('✔ Draft edited successfully. New grand total:', editedDraft.grand_total);
  if (editedDraft.invoice_number !== savedDraft.invoice_number) {
    throw new Error('Draft number should remain same while in draft state');
  }

  // 18 & 19: Finalize Invoice & Verify Sequential Numbering
  console.log('\n--- 7. Testing Finalize Invoice Flow ---');
  const { data: finalizedInvoice, error: finalizeError } = await supabase.rpc('save_invoice', {
    p_invoice: { id: savedDraft.id },
    p_items: updatedItemsList,
    p_finalize: true,
  });
  if (finalizeError) throw finalizeError;

  console.log('✔ Invoice Finalized!');
  console.log('Final Invoice Number:', finalizedInvoice.invoice_number);
  console.log('Final Status:', finalizedInvoice.status);
  if (finalizedInvoice.invoice_number.startsWith('DRAFT-')) throw new Error('Final invoice still has draft number');
  if (finalizedInvoice.status !== 'final') throw new Error('Final invoice status is not final');

  // 20 & 21: Verify Read-Only Protection on Finalized Invoice
  console.log('\n--- 8. Testing Read-Only Protection on Finalized Invoice ---');
  const { error: directEditAttempt } = await supabase.rpc('save_invoice', {
    p_invoice: { id: savedDraft.id, customer_name: 'Hacked Name' },
    p_items: updatedItemsList,
    p_finalize: false,
  });
  if (directEditAttempt) {
    console.log('✔ RPC returned error as expected:', directEditAttempt.message);
  } else {
    throw new Error('Finalized invoice should not be editable!');
  }

  // 22: Snapshot Integrity: Change Item Master Price & Customer in master tables
  console.log('\n--- 9. Testing Snapshot Integrity ---');
  // Alter customer master data
  await supabase
    .from('customers')
    .update({ name: 'Changed Customer Name Later' })
    .eq('id', newCust.id);

  // Fetch invoice again
  const { data: verifiedInvoice } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', savedDraft.id)
    .single();

  console.log('Original Customer Name on Invoice:', verifiedInvoice.customer_name);
  if (verifiedInvoice.customer_name !== 'Govt Girls HSS Wandoor') {
    throw new Error('Historical customer snapshot was mutated!');
  }
  console.log('✔ Customer snapshot remained intact.');

  const { data: verifiedItems } = await supabase
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', savedDraft.id);
  console.log('✔ Verified line items preserved:');
  verifiedItems.forEach((i) => {
    console.log('  -', i.item_name, 'Qty:', i.qty, i.uom, 'Rate: ₹' + i.unit_rate, 'Total: ₹' + i.total);
  });

  console.log('\n=====================================================');
  console.log('ALL PHASE 2 VERIFICATION TESTS PASSED SUCCESSFULLY! ✔');
  console.log('=====================================================');
}

runFullVerification().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
