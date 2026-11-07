import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, ReceiptText, RefreshCw, Eye, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { Alert } from '../components/ui/Alert';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../context/ToastContext';

export function Invoices() {
  const navigate = useNavigate();
  const toast = useToast();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Delete State & Long-press management
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [enabledDeleteIds, setEnabledDeleteIds] = useState([]);
  const [activePressId, setActivePressId] = useState(null);

  const longPressTimer = useRef(null);
  const isLongPressTriggered = useRef(false);
  const touchStartPos = useRef({ x: 0, y: 0 });

  const startPressTimer = (inv) => {
    isLongPressTriggered.current = false;
    setActivePressId(inv.id);
    if (longPressTimer.current) clearTimeout(longPressTimer.current);

    longPressTimer.current = setTimeout(() => {
      isLongPressTriggered.current = true;
      setActivePressId(null);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(50);
        } catch {
          // ignore vibration errors
        }
      }
      setEnabledDeleteIds((prev) => (prev.includes(inv.id) ? prev : [...prev, inv.id]));
      setInvoiceToDelete(inv);
    }, 550);
  };

  const cancelPressTimer = () => {
    setActivePressId(null);
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTouchStart = (inv, e) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    startPressTimer(inv);
  };

  const handleTouchMove = (e) => {
    if (!longPressTimer.current) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartPos.current.x);
    const dy = Math.abs(touch.clientY - touchStartPos.current.y);
    if (dx > 10 || dy > 10) {
      cancelPressTimer();
    }
  };

  const handleTouchEnd = () => {
    cancelPressTimer();
  };

  const handleMouseDown = (inv, e) => {
    if (e.button === 0) {
      startPressTimer(inv);
    }
  };

  const handleMouseUp = () => {
    cancelPressTimer();
  };

  const handleMouseLeave = () => {
    cancelPressTimer();
  };

  const handleContextMenu = (inv, e) => {
    e.preventDefault();
    cancelPressTimer();
    isLongPressTriggered.current = true;
    setEnabledDeleteIds((prev) => (prev.includes(inv.id) ? prev : [...prev, inv.id]));
    setInvoiceToDelete(inv);
  };

  const handleRowClick = (inv) => {
    if (isLongPressTriggered.current) {
      isLongPressTriggered.current = false;
      return;
    }
    navigate(`/invoices/${inv.id}`);
  };

  const handleConfirmDelete = async () => {
    if (!invoiceToDelete) return;

    try {
      setDeleting(true);
      if (!supabase) throw new Error('Supabase client is not connected.');

      // 1. Delete associated invoice items
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', invoiceToDelete.id);

      if (itemsError) throw itemsError;

      // 2. Delete the invoice record
      const { error: invError } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceToDelete.id);

      if (invError) throw invError;

      // 3. Update state
      setInvoices((prev) => prev.filter((it) => it.id !== invoiceToDelete.id));
      setEnabledDeleteIds((prev) => prev.filter((id) => id !== invoiceToDelete.id));
      toast.success(`Invoice #${invoiceToDelete.invoice_number} deleted successfully.`);
      setInvoiceToDelete(null);
    } catch (err) {
      console.error('Failed to delete invoice:', err);
      toast.error(err.message || 'Failed to delete invoice. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data, error: invError } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (invError) throw invError;

      setInvoices(data || []);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError('Unable to load invoices. Please check your network or try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const invNum = (inv.invoice_number || '').toLowerCase();
    const custName = (inv.customer_name || '').toLowerCase();
    const custMobile = (inv.customer_mobile || '').toLowerCase();
    return invNum.includes(query) || custName.includes(query) || custMobile.includes(query);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-[#222222]">
          Invoices
        </h1>

        <div className="flex items-center justify-end gap-2.5">
          <Button
            variant="secondary"
            size="iconCompact"
            onClick={fetchInvoices}
            aria-label="Refresh invoices list"
            icon={RefreshCw}
            disabled={loading}
          />
          <div className="hidden sm:inline-flex">
            <Button
              variant="primary"
              size="normal"
              icon={Plus}
              onClick={() => navigate('/invoices/new')}
            >
              Create Invoice
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Search Bar: Search by number, customer, mobile */}
      <div className="bg-white p-3 rounded-xl border border-[#E5E7EB]">
        <Input
          id="search-invoices"
          placeholder="Search by invoice number, customer name, or mobile..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          icon={Search}
          className="max-w-md"
        />
      </div>

      {/* Main Table / State Container */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-sm text-[#6B7280]">
            <div className="w-8 h-8 border-2 border-[#358FFF] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            Loading invoices...
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-8 sm:p-12">
            <EmptyState
              icon={ReceiptText}
              title="No invoices yet"
              description="Create your first invoice to get started."
              actionLabel="Create Invoice"
              actionIcon={Plus}
              onAction={() => navigate('/invoices/new')}
            />
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#6B7280]">
            <p className="font-medium text-[#222222] mb-1">No invoices found</p>
            <p>No invoices match &ldquo;{searchQuery}&rdquo;. Try another search term.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm" aria-label="Invoices list">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-gray-50/50 text-[#6B7280] text-xs font-semibold uppercase tracking-wider">
                  <th scope="col" className="px-6 py-3">Invoice Number</th>
                  <th scope="col" className="px-6 py-3">Customer</th>
                  <th scope="col" className="px-6 py-3">Date</th>
                  <th scope="col" className="px-6 py-3 text-right">Amount</th>
                  <th scope="col" className="px-6 py-3 text-center">Status</th>
                  <th scope="col" className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filteredInvoices.map((inv) => {
                  const isDraft = inv.status === 'draft';
                  const isDeleteEnabled = enabledDeleteIds.includes(inv.id);
                  const isBeingPressed = activePressId === inv.id;

                  return (
                    <tr
                      key={inv.id}
                      onClick={() => handleRowClick(inv)}
                      onTouchStart={(e) => handleTouchStart(inv, e)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      onMouseDown={(e) => handleMouseDown(inv, e)}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseLeave}
                      onContextMenu={(e) => handleContextMenu(inv, e)}
                      className={`transition-colors cursor-pointer select-none ${
                        isBeingPressed
                          ? 'bg-red-50/80 ring-1 ring-inset ring-red-300'
                          : isDeleteEnabled
                          ? 'bg-red-50/25 hover:bg-red-50/50'
                          : 'hover:bg-gray-50/75'
                      }`}
                    >
                      <td className="px-6 py-4 font-semibold text-[#222222]">
                        {inv.invoice_number}
                      </td>
                      <td className="px-6 py-4 text-[#222222]">
                        <div className="font-medium">{inv.customer_name}</div>
                        {inv.customer_mobile && (
                          <div className="text-xs text-[#6B7280]">{inv.customer_mobile}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-[#6B7280]">
                        {formatDate(inv.invoice_date)}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-[#222222]">
                        {formatCurrency(inv.grand_total)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant={isDraft ? 'draft' : 'paid'}>
                          {isDraft ? 'Draft' : 'Final'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="secondary"
                            size="iconCompact"
                            icon={Eye}
                            title="View Invoice"
                            aria-label={`View invoice ${inv.invoice_number}`}
                            onClick={() => navigate(`/invoices/${inv.id}`)}
                          />

                          {isDraft && (
                            <Button
                              variant="secondary"
                              size="iconCompact"
                              icon={Edit2}
                              title="Edit Draft"
                              aria-label={`Edit draft ${inv.invoice_number}`}
                              onClick={() => navigate(`/invoices/${inv.id}/edit`)}
                            />
                          )}

                          {isDeleteEnabled && (
                            <Button
                              variant="danger"
                              size="iconCompact"
                              icon={Trash2}
                              title="Delete Invoice"
                              aria-label={`Delete invoice ${inv.invoice_number}`}
                              onClick={() => setInvoiceToDelete(inv)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="px-6 py-2.5 bg-gray-50/50 border-t border-[#E5E7EB] text-xs text-[#6B7280] flex items-center justify-between">
              <span>Tip: Press and hold any row to delete the invoice.</span>
              {enabledDeleteIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setEnabledDeleteIds([])}
                  className="text-xs text-[#358FFF] hover:underline font-medium cursor-pointer"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete Invoice Confirmation Modal */}
      <Modal
        isOpen={Boolean(invoiceToDelete)}
        onClose={() => !deleting && setInvoiceToDelete(null)}
        title="Delete Invoice"
        subtitle="This action cannot be undone."
      >
        {invoiceToDelete && (
          <div className="space-y-4">
            <div className="p-4 bg-red-50/60 border border-red-100 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-red-700">
                  Invoice #{invoiceToDelete.invoice_number}
                </span>
                <Badge variant={invoiceToDelete.status === 'draft' ? 'draft' : 'paid'}>
                  {invoiceToDelete.status === 'draft' ? 'Draft' : 'Final'}
                </Badge>
              </div>

              <div className="text-sm font-semibold text-[#222222]">
                {invoiceToDelete.customer_name}
              </div>

              <div className="flex items-center justify-between text-xs text-[#6B7280] pt-1 border-t border-red-100/70">
                <span>Date: {formatDate(invoiceToDelete.invoice_date)}</span>
                <span className="font-bold text-[#222222]">
                  {formatCurrency(invoiceToDelete.grand_total)}
                </span>
              </div>
            </div>

            <p className="text-sm text-[#4B5563]">
              Are you sure you want to permanently delete this invoice and all of its line items?
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E7EB]">
              <Button
                variant="secondary"
                size="normal"
                onClick={() => setInvoiceToDelete(null)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="normal"
                icon={Trash2}
                loading={deleting}
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white border-transparent"
              >
                Delete Invoice
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Mobile Fixed Bottom Create Invoice Button */}
      <div className="sm:hidden fixed bottom-[calc(4rem+12px+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 z-40 no-print">
        <Button
          variant="primary"
          size="normal"
          icon={Plus}
          onClick={() => navigate('/invoices/new')}
          className="shadow-lg shadow-black/20 rounded-full px-5 py-2.5 font-semibold text-sm whitespace-nowrap active:scale-95 transition-transform"
        >
          Create Invoice
        </Button>
      </div>
    </div>
  );
}
