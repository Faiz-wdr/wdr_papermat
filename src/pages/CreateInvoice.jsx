import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, CheckCircle, Calendar, Hash } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { calculateInvoiceTotals, calculateItemTotals } from '../utils/invoiceCalculations';
import { validateInvoice } from '../utils/invoiceValidation';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { CustomerSelector } from '../components/invoices/CustomerSelector';
import { ItemSearchAutocomplete } from '../components/invoices/ItemSearchAutocomplete';
import { InvoiceItemsTable } from '../components/invoices/InvoiceItemsTable';
import { InvoiceSummary } from '../components/invoices/InvoiceSummary';

export function CreateInvoice() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);

  // Invoice Header State
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceStatus, setInvoiceStatus] = useState('draft');
  const [nextInvoicePreview, setNextInvoicePreview] = useState('0702');

  // Customer State
  const [customerData, setCustomerData] = useState({
    customer_id: null,
    customer_name: '',
    customer_address: '',
    customer_mobile: '',
    customer_gst_no: '',
  });

  // Line Items State
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (isEditing) {
      loadExistingInvoice(id);
    } else {
      const fetchNextInvoiceNumber = async () => {
        try {
          if (!supabase) return;
          const { data, error: rpcErr } = await supabase.rpc('preview_next_invoice_number');
          if (!rpcErr && data) {
            setNextInvoicePreview(data);
          }
        } catch (err) {
          console.error('Failed to preview next invoice number:', err);
        }
      };
      fetchNextInvoiceNumber();
    }
  }, [id, isEditing]);

  const loadExistingInvoice = async (invoiceId) => {
    try {
      setLoading(true);
      setError(null);

      if (!supabase) return;

      const { data: invoice, error: invError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (invError) throw invError;
      if (!invoice) throw new Error('Invoice not found');

      setInvoiceDate(invoice.invoice_date || new Date().toISOString().split('T')[0]);
      setInvoiceNumber(invoice.invoice_number || '');
      setInvoiceStatus(invoice.status || 'draft');

      setCustomerData({
        customer_id: invoice.customer_id,
        customer_name: invoice.customer_name || '',
        customer_address: invoice.customer_address || '',
        customer_mobile: invoice.customer_mobile || '',
        customer_gst_no: invoice.customer_gst_no || '',
      });

      // Load items
      const { data: invItems, error: itemsError } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('sort_order', { ascending: true });

      if (itemsError) throw itemsError;

      const formattedItems = (invItems || []).map((it) => calculateItemTotals({
        item_id: it.item_id,
        item_name: it.item_name,
        hsn_code: it.hsn_code || '',
        qty: Number(it.qty) || 1,
        uom: it.uom || 'PCS',
        unit_rate: Number(it.unit_rate) || 0,
        gst_rate: Number(it.gst_rate) || 0,
      }));

      setItems(formattedItems);
    } catch (err) {
      console.error('Error loading invoice:', err);
      setError(err.message || 'Unable to load invoice details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectItem = (selectedItem) => {
    const itemWithTotals = calculateItemTotals(selectedItem);
    setItems((prev) => [...prev, itemWithTotals]);
  };

  const handleAddCustomItem = (name = '') => {
    const blankItem = calculateItemTotals({
      item_name: name,
      hsn_code: '',
      uom: 'PCS',
      qty: 1,
      unit_rate: 0,
      gst_rate: 18,
    });
    setItems((prev) => [...prev, blankItem]);
  };

  const handleSave = async (finalize = false) => {
    // Validate
    const validation = validateInvoice(
      {
        ...customerData,
        invoice_date: invoiceDate,
      },
      items,
      finalize
    );

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setValidationErrors([]);
    setSaving(true);
    setError(null);

    try {
      if (!supabase) throw new Error('Supabase client is not connected.');

      const totals = calculateInvoiceTotals(items);

      const invoicePayload = {
        id: isEditing ? id : undefined,
        invoice_date: invoiceDate,
        customer_id: customerData.customer_id,
        customer_name: customerData.customer_name.trim(),
        customer_address: customerData.customer_address?.trim() || null,
        customer_mobile: customerData.customer_mobile?.trim() || null,
        customer_gst_no: customerData.customer_gst_no?.trim() || null,
        taxable_value: totals.taxableValue,
        total_cgst: totals.totalCGST,
        total_sgst: totals.totalSGST,
        grand_total: totals.grandTotal,
      };

      const itemsPayload = items.map((it) => {
        const c = calculateItemTotals(it);
        return {
          item_id: c.item_id || null,
          item_name: c.item_name,
          hsn_code: c.hsn_code || null,
          qty: c.qty,
          uom: c.uom || 'PCS',
          unit_rate: c.unit_rate,
          gst_rate: c.gst_rate,
          cgst_rate: c.cgst_rate,
          sgst_rate: c.sgst_rate,
          taxable_value: c.taxable_value,
          cgst_amount: c.cgst_amount,
          sgst_amount: c.sgst_amount,
          total: c.total,
        };
      });

      const isAlreadyFinal = invoiceStatus === 'final';

      // Call safe PostgreSQL function save_invoice
      const { data: savedInvoice, error: rpcError } = await supabase.rpc('save_invoice', {
        p_invoice: invoicePayload,
        p_items: itemsPayload,
        p_finalize: finalize || isAlreadyFinal,
      });

      if (rpcError) throw rpcError;

      const targetId = savedInvoice?.id || id;
      navigate(`/invoices/${targetId}`, {
        state: {
          message: isAlreadyFinal
            ? `Invoice #${savedInvoice?.invoice_number} updated successfully!`
            : finalize
            ? `Invoice #${savedInvoice?.invoice_number} finalized successfully!`
            : `Invoice saved as draft (${savedInvoice?.invoice_number}).`,
        },
      });
    } catch (err) {
      console.error('Failed to save invoice:', err);
      setError(err.message || 'Failed to save invoice. Please check your data and try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-[#6B7280]">
        <div className="w-8 h-8 border-2 border-[#358FFF] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        Loading invoice...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="iconCompact"
            icon={ArrowLeft}
            onClick={() => navigate('/invoices')}
            aria-label="Back to Invoices"
          />
          <div>
            <h1 className="text-2xl font-semibold text-[#222222]">
              {isEditing
                ? (invoiceStatus === 'final' ? `Edit Invoice (#${invoiceNumber})` : `Edit Draft (${invoiceNumber || 'Draft'})`)
                : 'Create New Invoice'}
            </h1>
            <p className="text-xs text-[#6B7280]">
              Tax Invoice for school & office stationery sales
            </p>
          </div>
        </div>

        {/* Top Header Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 w-full sm:w-auto">
          <Button
            variant="secondary"
            size="normal"
            onClick={() => (id ? navigate(`/invoices/${id}`) : navigate('/invoices'))}
          >
            Cancel
          </Button>

          {invoiceStatus === 'final' ? (
            <Button
              variant="primary"
              size="normal"
              icon={Save}
              onClick={() => handleSave(true)}
              loading={saving}
              disabled={saving}
            >
              Save Changes
            </Button>
          ) : (
            <>
              <Button
                variant="secondary"
                size="icon"
                icon={Save}
                onClick={() => handleSave(false)}
                loading={saving}
                disabled={saving}
                title="Save Draft"
                aria-label="Save Draft"
              />

              <Button
                variant="primary"
                size="normal"
                icon={CheckCircle}
                onClick={() => handleSave(true)}
                loading={saving}
                disabled={saving}
              >
                Finalize Invoice
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Global Alerts */}
      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {validationErrors.length > 0 && (
        <Alert variant="error" title="Please review the following:" onClose={() => setValidationErrors([])}>
          <ul className="list-disc list-inside space-y-0.5 mt-1">
            {validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </Alert>
      )}

      {/* Invoice Meta Bar: Number & Date */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-[#222222] tracking-wide block mb-1.5">
            Invoice Number
          </label>
          <div className="h-10 px-3 flex items-center bg-gray-50 border border-[#E5E7EB] rounded-lg text-sm font-semibold text-[#222222]">
            <Hash size={16} className="text-[#6B7280] mr-2" aria-hidden="true" />
            <span>{invoiceNumber || nextInvoicePreview || '0702'}</span>
          </div>
        </div>

        <Input
          id="invoice-date"
          type="date"
          label="Invoice Date"
          value={invoiceDate}
          onChange={(e) => setInvoiceDate(e.target.value)}
          required
          icon={Calendar}
        />
      </div>

      {/* Customer Selection Section */}
      <CustomerSelector
        customerData={customerData}
        onChange={setCustomerData}
      />

      {/* Line Items Section */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E7EB]">
          <div>
            <h2 className="text-base font-semibold text-[#222222]">
              Invoice Line Items
            </h2>
            <p className="text-xs text-[#6B7280]">
              Add stationery items, adjust quantities, or provide special unit rates
            </p>
          </div>
        </div>

        {/* Search & Add Autocomplete */}
        <ItemSearchAutocomplete
          onSelectItem={handleSelectItem}
          onAddCustomItem={handleAddCustomItem}
        />

        {/* Responsive Table / Cards */}
        <InvoiceItemsTable
          items={items}
          onChangeItems={setItems}
        />
      </div>

      {/* Totals & Summary */}
      <div className="flex justify-end">
        <div className="w-full md:max-w-md lg:max-w-lg">
          <InvoiceSummary items={items} />
        </div>
      </div>
    </div>
  );
}
