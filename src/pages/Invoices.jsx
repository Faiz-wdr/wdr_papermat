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

  // Delete State & Selection (Long-press management)
  const [selectedIds, setSelectedIds] = useState([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activePressId, setActivePressId] = useState(null);

  const touchStartTime = useRef(0);
  const touchStartPos = useRef({ x: 0, y: 0 });
  const longPressTimer = useRef(null);
  const longPressTriggeredAt = useRef(0);
  const longPressId = useRef(null);
  const lastTouchToggleAt = useRef(0);
  const lastTouchToggleId = useRef(null);

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredInvoices.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredInvoices.map((inv) => inv.id));
    }
  };

  const startPressTimer = (inv) => {
    if (selectedIds.length > 0) return;

    setActivePressId(inv.id);
    if (longPressTimer.current) clearTimeout(longPressTimer.current);

    longPressTimer.current = setTimeout(() => {
      longPressTriggeredAt.current = Date.now();
      longPressId.current = inv.id;
      setActivePressId(null);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(50);
        } catch {
          // ignore
        }
      }
      toggleSelect(inv.id);
    }, 400); // 400ms crisp mobile long-press
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
    touchStartTime.current = Date.now();

    // If not yet in selection mode, start long-press timer
    if (selectedIds.length === 0) {
      startPressTimer(inv);
    }
  };

  const handleTouchMove = (e) => {
    if (!longPressTimer.current) return;
    const touch = e.touches[0];
    const dist = Math.hypot(
      touch.clientX - touchStartPos.current.x,
      touch.clientY - touchStartPos.current.y
    );
    // If movement > 15px (e.g. scrolling), cancel long-press
    if (dist > 15) {
      cancelPressTimer();
    }
  };

  const handleTouchEnd = (inv, e) => {
    cancelPressTimer();
    const elapsed = Date.now() - touchStartTime.current;
    const touch = e.changedTouches ? e.changedTouches[0] : null;
    const dist = touch
      ? Math.hypot(
          touch.clientX - touchStartPos.current.x,
          touch.clientY - touchStartPos.current.y
        )
      : 0;

    // IN SELECTION MODE: any quick tap (< 350ms, < 15px movement) directly toggles selection on mobile!
    if (selectedIds.length > 0 && elapsed < 350 && dist < 15) {
      lastTouchToggleAt.current = Date.now();
      lastTouchToggleId.current = inv.id;
      toggleSelect(inv.id);
    }
  };

  const handleTouchCancel = () => {
    cancelPressTimer();
  };

  const handleMouseDown = (inv, e) => {
    if (selectedIds.length > 0) return;
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
    longPressTriggeredAt.current = Date.now();
    longPressId.current = inv.id;
    toggleSelect(inv.id);
  };

  const handleRowClick = (inv) => {
    // 1. If click fired right after long-press on this exact row, ignore it
    const timeSinceLongPress = Date.now() - longPressTriggeredAt.current;
    if (timeSinceLongPress < 500 && longPressId.current === inv.id) {
      longPressId.current = null;
      return;
    }

    // 2. If click was already handled by touchEnd on mobile, ignore duplicate synthetic click
    const timeSinceTouchToggle = Date.now() - lastTouchToggleAt.current;
    if (timeSinceTouchToggle < 500 && lastTouchToggleId.current === inv.id) {
      lastTouchToggleId.current = null;
      return;
    }

    // 3. Desktop mouse click toggle while in selection mode
    if (selectedIds.length > 0) {
      toggleSelect(inv.id);
      return;
    }

    navigate(`/invoices/${inv.id}`);
  };

  const handleConfirmDelete = async () => {
    if (selectedIds.length === 0) return;

    try {
      setDeleting(true);
      if (!supabase) throw new Error('Supabase client is not connected.');

      // 1. Delete associated invoice items for all selected invoices
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .delete()
        .in('invoice_id', selectedIds);

      if (itemsError) throw itemsError;

      // 2. Delete the invoice records
      const { error: invError } = await supabase
        .from('invoices')
        .delete()
        .in('id', selectedIds);

      if (invError) throw invError;

      const count = selectedIds.length;
      // 3. Update state
      setInvoices((prev) => prev.filter((it) => !selectedIds.includes(it.id)));
      setSelectedIds([]);
      setIsDeleteModalOpen(false);
      toast.success(
        count > 1
          ? `${count} invoices deleted successfully.`
          : 'Invoice deleted successfully.'
      );
    } catch (err) {
      console.error('Failed to delete invoices:', err);
      toast.error(err.message || 'Failed to delete. Please try again.');
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
        {/* Mobile & Desktop Sticky Top Selection Bar */}
        {selectedIds.length > 0 && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-3 flex items-center justify-between gap-3 animate-in fade-in duration-150 sticky top-0 z-20">
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={filteredInvoices.length > 0 && selectedIds.length === filteredInvoices.length}
                onChange={handleToggleSelectAll}
                className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500 cursor-pointer shrink-0"
                title={selectedIds.length === filteredInvoices.length ? "Deselect all" : "Select all"}
                aria-label="Select all invoices"
              />
              <span className="text-xs sm:text-sm font-semibold text-red-900">
                {selectedIds.length} {selectedIds.length === 1 ? 'invoice selected' : 'invoices selected'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="compact"
                onClick={() => setSelectedIds([])}
                className="text-xs font-medium"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="compact"
                icon={Trash2}
                onClick={() => setIsDeleteModalOpen(true)}
                className="bg-red-600 hover:bg-red-700 text-white border-transparent text-xs font-semibold whitespace-nowrap shadow-xs"
              >
                {selectedIds.length > 1 ? `Delete All (${selectedIds.length})` : 'Delete (1)'}
              </Button>
            </div>
          </div>
        )}

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
                  <th scope="col" className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      {selectedIds.length > 0 && (
                        <input
                          type="checkbox"
                          checked={filteredInvoices.length > 0 && selectedIds.length === filteredInvoices.length}
                          onChange={handleToggleSelectAll}
                          className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500 cursor-pointer shrink-0"
                          title={selectedIds.length === filteredInvoices.length ? "Deselect all" : "Select all"}
                          aria-label="Select all invoices"
                        />
                      )}
                      <span>Invoice Number</span>
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3">Customer</th>
                  <th scope="col" className="px-6 py-3">Date</th>
                  <th scope="col" className="px-6 py-3 text-right">Amount</th>
                  <th scope="col" className="px-6 py-3 text-center">Status</th>
                  <th scope="col" className="px-6 py-3 text-right sticky right-0 bg-gray-50/95 z-10 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)]">
                    {selectedIds.length > 0 ? (
                      <div className="flex items-center justify-end gap-1.5 normal-case tracking-normal">
                        <Button
                          type="button"
                          variant="secondary"
                          size="compact"
                          onClick={() => setSelectedIds([])}
                          className="text-xs font-medium"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="compact"
                          icon={Trash2}
                          onClick={() => setIsDeleteModalOpen(true)}
                          className="bg-red-600 hover:bg-red-700 text-white border-transparent text-xs font-semibold whitespace-nowrap"
                        >
                          {selectedIds.length > 1 ? `Delete All (${selectedIds.length})` : 'Delete (1)'}
                        </Button>
                      </div>
                    ) : (
                      'Actions'
                    )}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filteredInvoices.map((inv) => {
                  const isDraft = inv.status === 'draft';
                  const isSelected = selectedIds.includes(inv.id);
                  const isBeingPressed = activePressId === inv.id;
                  const isSelectionMode = selectedIds.length > 0;

                  return (
                    <tr
                      key={inv.id}
                      onClick={() => handleRowClick(inv)}
                      onTouchStart={(e) => handleTouchStart(inv, e)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={(e) => handleTouchEnd(inv, e)}
                      onTouchCancel={handleTouchCancel}
                      onMouseDown={(e) => handleMouseDown(inv, e)}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseLeave}
                      onContextMenu={(e) => handleContextMenu(inv, e)}
                      style={{
                        WebkitTouchCallout: 'none',
                        WebkitUserSelect: 'none',
                        userSelect: 'none',
                        touchAction: 'pan-y'
                      }}
                      className={`transition-colors cursor-pointer select-none ${
                        isBeingPressed
                          ? 'bg-red-100/70 ring-1 ring-inset ring-red-300'
                          : isSelected
                          ? 'bg-red-50/80 ring-1 ring-inset ring-red-200'
                          : isSelectionMode
                          ? 'hover:bg-red-50/30'
                          : 'hover:bg-gray-50/75'
                      }`}
                    >
                      <td className="px-6 py-4 font-semibold text-[#222222]">
                        <div className="flex items-center gap-3">
                          {isSelectionMode && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleSelect(inv.id);
                              }}
                              className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500 cursor-pointer shrink-0"
                              aria-label={`Select invoice ${inv.invoice_number}`}
                            />
                          )}
                          <span>{inv.invoice_number}</span>
                        </div>
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
                      <td
                        className={`px-6 py-4 text-right sticky right-0 z-10 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)] ${
                          isSelected ? 'bg-red-50/80' : 'bg-white'
                        }`}
                        onClick={(e) => {
                          if (isSelectionMode) {
                            // In selection mode, clicking action cell also toggles row selection
                            return;
                          }
                          e.stopPropagation();
                        }}
                      >
                        {isSelectionMode ? (
                          <div className="flex items-center justify-end">
                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium transition-colors ${
                              isSelected
                                ? 'bg-red-100 text-red-700 font-semibold'
                                : 'bg-gray-100 text-gray-500'
                            }`}>
                              {isSelected ? 'Selected' : 'Select'}
                            </span>
                          </div>
                        ) : (
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
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Invoices Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen && selectedIds.length > 0}
        onClose={() => !deleting && setIsDeleteModalOpen(false)}
        title={selectedIds.length > 1 ? `Delete ${selectedIds.length} Invoices` : 'Delete Invoice'}
        subtitle="This action cannot be undone."
      >
        {selectedIds.length > 0 && (() => {
          const selectedInvoicesList = invoices.filter((inv) => selectedIds.includes(inv.id));
          const singleInv = selectedInvoicesList[0];
          const isMultiple = selectedIds.length > 1;

          return (
            <div className="space-y-4">
              {isMultiple ? (
                <div className="p-4 bg-red-50/60 border border-red-100 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-red-700">
                      {selectedIds.length} Invoices Selected
                    </span>
                    <span className="text-xs font-bold text-[#222222]">
                      Total: {formatCurrency(selectedInvoicesList.reduce((sum, inv) => sum + Number(inv.grand_total || 0), 0))}
                    </span>
                  </div>
                  <div className="text-xs text-[#4B5563] max-h-24 overflow-y-auto pt-1 border-t border-red-100/70 flex flex-wrap gap-1">
                    {selectedInvoicesList.map((inv) => (
                      <span key={inv.id} className="px-2 py-0.5 bg-white border border-red-200 rounded font-mono text-[11px] text-red-800">
                        #{inv.invoice_number}
                      </span>
                    ))}
                  </div>
                </div>
              ) : singleInv ? (
                <div className="p-4 bg-red-50/60 border border-red-100 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-red-700">
                      Invoice #{singleInv.invoice_number}
                    </span>
                    <Badge variant={singleInv.status === 'draft' ? 'draft' : 'paid'}>
                      {singleInv.status === 'draft' ? 'Draft' : 'Final'}
                    </Badge>
                  </div>

                  <div className="text-sm font-semibold text-[#222222]">
                    {singleInv.customer_name}
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#6B7280] pt-1 border-t border-red-100/70">
                    <span>Date: {formatDate(singleInv.invoice_date)}</span>
                    <span className="font-bold text-[#222222]">
                      {formatCurrency(singleInv.grand_total)}
                    </span>
                  </div>
                </div>
              ) : null}

              <p className="text-sm text-[#4B5563]">
                {isMultiple
                  ? `Are you sure you want to permanently delete these ${selectedIds.length} invoices and all of their line items?`
                  : 'Are you sure you want to permanently delete this invoice and all of its line items?'}
              </p>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E7EB]">
                <Button
                  variant="secondary"
                  size="normal"
                  onClick={() => setIsDeleteModalOpen(false)}
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
                  {isMultiple ? `Delete All (${selectedIds.length})` : 'Delete Invoice'}
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Mobile Fixed Bottom Create Invoice Button (hidden in selection mode) */}
      {selectedIds.length === 0 && (
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
      )}
    </div>
  );
}
