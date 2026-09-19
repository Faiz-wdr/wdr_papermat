import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  CheckCircle,
  FileDown,
  Printer,
  Building2,
  Calendar,
  Hash,
  Landmark,
  AlertTriangle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCurrency, formatDate, formatGSTRate } from '../utils/formatters';
import { numberToWordsINR } from '../utils/invoiceCalculations';
import { downloadInvoicePDF } from '../utils/pdfGenerator';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';

export function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [invoice, setInvoice] = useState(null);
  const [items, setItems] = useState([]);
  const [businessSettings, setBusinessSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInvoiceData();
  }, [id]);

  useEffect(() => {
    if (location.state?.message) {
      toast.success(location.state.message);
      // Clear location state to prevent repeating on refresh
      window.history.replaceState({}, document.title);
    }
  }, []);

  const fetchInvoiceData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!supabase) return;

      // Fetch invoice header
      const { data: inv, error: invError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single();

      if (invError) throw invError;
      if (!inv) throw new Error('Invoice not found');
      setInvoice(inv);

      // Fetch line items
      const { data: lineItems, error: itemsError } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', id)
        .order('sort_order', { ascending: true });

      if (itemsError) throw itemsError;
      setItems(lineItems || []);

      // Fetch business settings
      const { data: settings, error: settingsError } = await supabase
        .from('business_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (!settingsError && settings) {
        setBusinessSettings(settings);
      }
    } catch (err) {
      console.error('Error loading invoice details:', err);
      setError(err.message || 'Unable to load invoice details.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (!window.confirm('Are you sure you want to finalize this invoice? Once finalized, it becomes a permanent legal record and cannot be modified.')) {
      return;
    }

    try {
      setActionLoading(true);
      setError(null);

      // Call save_invoice with p_finalize = true
      const { data: finalized, error: rpcError } = await supabase.rpc('save_invoice', {
        p_invoice: { id: invoice.id },
        p_items: items,
        p_finalize: true,
      });

      if (rpcError) throw rpcError;

      toast.success(`Invoice #${finalized?.invoice_number} finalized successfully!`);
      setInvoice(finalized);
      fetchInvoiceData();
    } catch (err) {
      console.error('Failed to finalize invoice:', err);
      toast.error(err.message || 'Failed to finalize invoice.');
      setError(err.message || 'Failed to finalize invoice.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setPdfLoading(true);
      setError(null);
      const fileName = await downloadInvoicePDF(invoice, items, businessSettings);
      toast.success(`Downloaded ${fileName} successfully!`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      toast.error('Failed to generate PDF: ' + (err.message || 'Unknown error'));
      setError('Failed to generate PDF: ' + (err.message || 'Unknown error'));
    } finally {
      setPdfLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-[#6B7280]">
        <div className="w-8 h-8 border-2 border-[#358FFF] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        Loading invoice #{id}...
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="max-w-xl mx-auto text-center py-16 space-y-4">
        <h2 className="text-xl font-bold text-[#222222]">Invoice Not Found</h2>
        <p className="text-sm text-[#6B7280]">The requested invoice could not be located.</p>
        <Button variant="primary" onClick={() => navigate('/invoices')}>
          Back to Invoices List
        </Button>
      </div>
    );
  }

  const isDraft = invoice.status === 'draft';
  const totalQty = items.reduce((acc, it) => acc + (Number(it.qty) || 0), 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Navigation and Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="iconCompact"
            icon={ArrowLeft}
            onClick={() => navigate('/invoices')}
            aria-label="Back to Invoices"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-[#222222]">
                Invoice {invoice.invoice_number}
              </h1>
              {isDraft && (
                <Badge variant="draft">
                  Draft
                </Badge>
              )}
            </div>
            <p className="text-xs text-[#6B7280]">
              Issued on {formatDate(invoice.invoice_date)}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-2.5 w-full sm:w-auto">
          {isDraft ? (
            <>
              <Button
                variant="secondary"
                size="icon"
                icon={Edit2}
                onClick={() => navigate(`/invoices/${id}/edit`)}
                title="Edit Draft"
                aria-label="Edit Draft"
              />

              <Button
                variant="secondary"
                size="icon"
                icon={FileDown}
                onClick={handleDownloadPDF}
                loading={pdfLoading}
                title="Download PDF"
                aria-label="Download PDF"
              />

              <Button
                variant="primary"
                size="normal"
                icon={CheckCircle}
                onClick={handleFinalize}
                loading={actionLoading}
              >
                Finalize Invoice
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="secondary"
                size="icon"
                icon={Edit2}
                onClick={() => navigate(`/invoices/${id}/edit`)}
                title="Edit Invoice"
                aria-label="Edit Invoice"
              />

              <Button
                variant="secondary"
                size="icon"
                icon={Printer}
                onClick={handlePrint}
                title="Print invoice on A4 paper"
                aria-label="Print Invoice"
              />

              <Button
                variant="primary"
                size="normal"
                icon={FileDown}
                onClick={handleDownloadPDF}
                loading={pdfLoading}
                title="Download A4 PDF document"
              >
                {pdfLoading ? 'Generating PDF...' : 'Download PDF'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Error Notification */}
      {error && (
        <div className="no-print">
          <Alert variant="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </div>
      )}

      {/* ========================================================================= */}
      {/* INVOICE DOCUMENT (Modeled faithfully after the attached Reference Image) */}
      {/* ========================================================================= */}
      <div className="invoice-document bg-white border border-[#222222] rounded-none shadow-sm overflow-hidden text-[#222222] font-sans">
        {/* 1. Header: Store Branding from Settings */}
        <div className="p-6 text-center border-b border-[#222222] space-y-1">
          <h2 className="text-2xl font-extrabold uppercase tracking-wide text-[#222222]">
            {businessSettings?.business_name || 'WANDOOR PAPER MART'}
          </h2>
          <p className="text-xs text-[#222222] max-w-lg mx-auto font-medium">
            {businessSettings?.address || 'Main Road, Near Bus Stand, Wandoor, Malappuram, Kerala - 679328'}
          </p>
          <div className="text-xs text-[#222222] flex items-center justify-center gap-4 font-medium pt-0.5">
            {businessSettings?.mobile && <span>Mobile: {businessSettings.mobile}</span>}
          </div>
        </div>

        {/* 2. Document Title Banner */}
        <div className="bg-gray-100 py-1.5 px-4 text-center border-b border-[#222222] font-bold text-sm tracking-wider uppercase">
          TAX INVOICE
        </div>

        {/* 3. Top Boxed Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 border-b border-[#222222] text-xs">
          {/* Left: Invoice Metadata */}
          <div className="p-4 border-b md:border-b-0 md:border-r border-[#222222] space-y-1.5">
            <div className="flex">
              <span className="font-bold w-28">GST No :</span>
              <span className="font-mono font-semibold">{businessSettings?.gst_no || '32ABCDE1234F1Z5'}</span>
            </div>
            <div className="flex">
              <span className="font-bold w-28">Invoice No :</span>
              <span className="font-semibold text-sm">{invoice.invoice_number}</span>
            </div>
            <div className="flex">
              <span className="font-bold w-28">Invoice Date :</span>
              <span>{formatDate(invoice.invoice_date)}</span>
            </div>
          </div>

          {/* Right: Supply Info */}
          <div className="p-4 space-y-1.5 bg-gray-50/40">
            <div className="font-bold text-[11px] uppercase tracking-wide text-[#6B7280] pb-1 border-b border-gray-200">
              Supply & Delivery Information
            </div>
            <div className="flex">
              <span className="text-[#6B7280] w-36">Place of Supply :</span>
              <span className="font-medium">Kerala (State Code: 32)</span>
            </div>
            <div className="flex">
              <span className="text-[#6B7280] w-36">Supply Category :</span>
              <span className="font-medium">Intra-State B2B / B2C</span>
            </div>
          </div>
        </div>

        {/* 4. Receiver (Billed To) Details Box */}
        <div className="p-4 border-b border-[#222222] bg-white text-xs">
          <div className="font-bold uppercase tracking-wider text-[11px] text-[#222222] mb-1.5 pb-1 border-b border-gray-200">
            Details Of Receiver (Billed To)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-6">
            <div>
              <span className="text-[#6B7280] mr-2">Name:</span>
              <span className="font-bold text-sm text-[#222222]">{invoice.customer_name}</span>
            </div>
            {invoice.customer_mobile && (
              <div>
                <span className="text-[#6B7280] mr-2">Mobile:</span>
                <span className="font-medium">{invoice.customer_mobile}</span>
              </div>
            )}
            {invoice.customer_address && (
              <div className="sm:col-span-2">
                <span className="text-[#6B7280] mr-2">Address:</span>
                <span>{invoice.customer_address}</span>
              </div>
            )}
            {invoice.customer_gst_no && (
              <div>
                <span className="text-[#6B7280] mr-2">GST No:</span>
                <span className="font-mono font-semibold">{invoice.customer_gst_no}</span>
              </div>
            )}
            <div>
              <span className="text-[#6B7280] mr-2">State / Code:</span>
              <span>Kerala (32)</span>
            </div>
          </div>
        </div>

        {/* 5. Main Line Items Table */}
        <div className="overflow-x-auto border-b border-[#222222]">
          <table className="w-full text-left text-xs border-collapse min-w-[700px] sm:min-w-full" aria-label="Tax invoice items table">
            <thead>
              <tr className="border-b border-[#222222] bg-gray-100 font-bold text-center">
                <th scope="col" className="p-2 border-r border-[#222222] w-8">No</th>
                <th scope="col" className="p-2 border-r border-[#222222] text-left min-w-[160px]">Description Of Goods</th>
                <th scope="col" className="p-2 border-r border-[#222222] w-20">HSN Code</th>
                <th scope="col" className="p-2 border-r border-[#222222] w-14">Qty</th>
                <th scope="col" className="p-2 border-r border-[#222222] w-14">UOM</th>
                <th scope="col" className="p-2 border-r border-[#222222] w-20 text-right">Unit Rate</th>
                <th scope="col" className="p-2 border-r border-[#222222] w-24 text-right">Taxable Value</th>
                <th scope="col" className="p-2 border-r border-[#222222] w-20 text-right">CGST</th>
                <th scope="col" className="p-2 border-r border-[#222222] w-20 text-right">SGST</th>
                <th scope="col" className="p-2 text-right w-24">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222222]">
              {items.map((item, index) => (
                <tr key={item.id || index} className="align-top">
                  <td className="p-2 border-r border-[#222222] text-center">{index + 1}</td>
                  <td className="p-2 border-r border-[#222222] font-semibold text-left">{item.item_name}</td>
                  <td className="p-2 border-r border-[#222222] text-center font-mono">{item.hsn_code || '-'}</td>
                  <td className="p-2 border-r border-[#222222] text-center font-bold">{item.qty}</td>
                  <td className="p-2 border-r border-[#222222] text-center">{item.uom}</td>
                  <td className="p-2 border-r border-[#222222] text-right">{Number(item.unit_rate).toFixed(2)}</td>
                  <td className="p-2 border-r border-[#222222] text-right font-medium">{Number(item.taxable_value).toFixed(2)}</td>
                  <td className="p-2 border-r border-[#222222] text-right">
                    <div>{Number(item.cgst_amount).toFixed(2)}</div>
                    <div className="text-[10px] text-[#6B7280]">({item.cgst_rate}%)</div>
                  </td>
                  <td className="p-2 border-r border-[#222222] text-right">
                    <div>{Number(item.sgst_amount).toFixed(2)}</div>
                    <div className="text-[10px] text-[#6B7280]">({item.sgst_rate}%)</div>
                  </td>
                  <td className="p-2 text-right font-bold">{Number(item.total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>

            {/* Table Totals Row */}
            <tfoot>
              <tr className="border-t-2 border-[#222222] bg-gray-50 font-bold text-xs">
                <td colSpan={3} className="p-2 text-center border-r border-[#222222] uppercase">
                  Total
                </td>
                <td className="p-2 text-center border-r border-[#222222]">
                  {totalQty}
                </td>
                <td className="p-2 border-r border-[#222222]"></td>
                <td className="p-2 border-r border-[#222222]"></td>
                <td className="p-2 text-right border-r border-[#222222]">
                  {Number(invoice.taxable_value).toFixed(2)}
                </td>
                <td className="p-2 text-right border-r border-[#222222]">
                  {Number(invoice.total_cgst).toFixed(2)}
                </td>
                <td className="p-2 text-right border-r border-[#222222]">
                  {Number(invoice.total_sgst).toFixed(2)}
                </td>
                <td className="p-2 text-right text-sm">
                  {Number(invoice.grand_total).toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* 6. Footer Section: Words, Bank Details, and Signatory */}
        <div className="invoice-footer-section grid grid-cols-1 md:grid-cols-2 text-xs">
          {/* Left Column */}
          <div className="p-4 border-b md:border-b-0 md:border-r border-[#222222] flex flex-col justify-between space-y-4">
            <div>
              <div className="font-semibold text-xs mb-1">Total Amount in Words:</div>
              <div className="font-bold italic text-sm text-[#222222] bg-gray-50 p-2 border border-gray-300">
                {numberToWordsINR(invoice.grand_total)}
              </div>
            </div>

            {/* Bank Details Box from Settings */}
            <div className="border border-[#222222] p-3 space-y-1 bg-white">
              <div className="font-bold uppercase tracking-wider text-[11px] pb-1 border-b border-gray-200">
                Bank Details
              </div>
              <div className="grid grid-cols-3 gap-1 pt-1">
                <span className="font-semibold text-[#6B7280]">Bank Name:</span>
                <span className="col-span-2 font-bold">{businessSettings?.bank_name || 'State Bank of India'}</span>
                
                <span className="font-semibold text-[#6B7280]">Branch:</span>
                <span className="col-span-2">{businessSettings?.bank_branch || 'Wandoor Branch'}</span>
                
                <span className="font-semibold text-[#6B7280]">Acc No:</span>
                <span className="col-span-2 font-mono font-bold">{businessSettings?.account_number || '384729104928'}</span>
                
                <span className="font-semibold text-[#6B7280]">IFSC Code:</span>
                <span className="col-span-2 font-mono">{businessSettings?.ifsc_code || 'SBIN0070188'}</span>
              </div>
            </div>

            <div className="text-[10px] text-[#6B7280] italic">
              Certified that the particulars given above are true and correct.
            </div>
          </div>

          {/* Right Column: Grand Total & Signature */}
          <div className="flex flex-col justify-between">
            {/* Calculation Breakdowns */}
            <div className="divide-y divide-[#222222] border-b border-[#222222]">
              <div className="flex justify-between p-2 font-medium">
                <span>Taxable Value:</span>
                <span>{formatCurrency(invoice.taxable_value)}</span>
              </div>
              <div className="flex justify-between p-2 font-medium">
                <span>Total CGST:</span>
                <span>{formatCurrency(invoice.total_cgst)}</span>
              </div>
              <div className="flex justify-between p-2 font-medium">
                <span>Total SGST:</span>
                <span>{formatCurrency(invoice.total_sgst)}</span>
              </div>
              <div className="flex justify-between p-3 font-extrabold text-base bg-gray-100">
                <span>Grand Total:</span>
                <span className="text-[#358FFF]">{formatCurrency(invoice.grand_total)}</span>
              </div>
            </div>

            {/* Authorised Signatory Box */}
            <div className="p-6 text-center flex flex-col items-center justify-end h-36">
              <div className="text-xs font-bold uppercase tracking-wider mb-8">
                For {businessSettings?.business_name || 'WANDOOR PAPER MART'}
              </div>
              <div className="border-t border-dashed border-gray-400 w-48 pt-1 text-xs text-[#6B7280]">
                Authorised Signatory
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
