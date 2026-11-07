import React, { useEffect, useState, useRef } from 'react';
import { Plus, Search, Package, Edit2, CheckCircle2, RefreshCw, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCurrency, formatGSTRate } from '../utils/formatters';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { ItemModal } from '../components/items/ItemModal';
import { Alert } from '../components/ui/Alert';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../context/ToastContext';

export function Items() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Delete State & Selection (Long-press management)
  const [selectedIds, setSelectedIds] = useState([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activePressId, setActivePressId] = useState(null);

  const longPressTimer = useRef(null);
  const isLongPressTriggered = useRef(false);
  const touchStartPos = useRef({ x: 0, y: 0 });

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map((item) => item.id));
    }
  };

  const startPressTimer = (item) => {
    isLongPressTriggered.current = false;
    setActivePressId(item.id);
    if (longPressTimer.current) clearTimeout(longPressTimer.current);

    longPressTimer.current = setTimeout(() => {
      isLongPressTriggered.current = true;
      setActivePressId(null);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(50);
        } catch {
          // ignore
        }
      }
      // Row is selected upon long-press; popup only opens via header delete button
      toggleSelect(item.id);
    }, 550);
  };

  const cancelPressTimer = () => {
    setActivePressId(null);
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTouchStart = (item, e) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    startPressTimer(item);
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

  const handleMouseDown = (item, e) => {
    if (e.button === 0) {
      startPressTimer(item);
    }
  };

  const handleMouseUp = () => {
    cancelPressTimer();
  };

  const handleMouseLeave = () => {
    cancelPressTimer();
  };

  const handleContextMenu = (item, e) => {
    e.preventDefault();
    cancelPressTimer();
    isLongPressTriggered.current = true;
    toggleSelect(item.id);
  };

  const handleRowClick = (item) => {
    if (isLongPressTriggered.current) {
      isLongPressTriggered.current = false;
      return;
    }
    // If in multi-select mode, clicking row toggles its selection
    if (selectedIds.length > 0) {
      toggleSelect(item.id);
      return;
    }
    handleOpenEditModal(item);
  };

  const handleConfirmDelete = async () => {
    if (selectedIds.length === 0) return;

    try {
      setDeleting(true);
      if (!supabase) throw new Error('Supabase client is not connected.');

      const { error: delError } = await supabase
        .from('items')
        .delete()
        .in('id', selectedIds);

      if (delError) throw delError;

      const count = selectedIds.length;
      setItems((prev) => prev.filter((it) => !selectedIds.includes(it.id)));
      setSelectedIds([]);
      setIsDeleteModalOpen(false);
      toast.success(
        count > 1
          ? `${count} items deleted successfully.`
          : 'Item deleted successfully.'
      );
    } catch (err) {
      console.error('Failed to delete items:', err);
      toast.error(err.message || 'Failed to delete items. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data, error: itemsError } = await supabase
        .from('items')
        .select('*')
        .order('name', { ascending: true });

      if (itemsError) throw itemsError;

      setItems(data || []);
    } catch (err) {
      console.error('Error loading items:', err);
      setError('Unable to load items. Please refresh or check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSaveItem = async (payload, itemId) => {
    if (!supabase) {
      throw new Error('Supabase is not connected');
    }

    if (itemId) {
      // Update existing item
      const { data, error: updateError } = await supabase
        .from('items')
        .update(payload)
        .eq('id', itemId)
        .select()
        .single();

      if (updateError) throw updateError;

      setItems((prev) =>
        prev.map((it) => (it.id === itemId ? data : it))
      );
      toast.success(`Item "${data.name}" updated successfully.`);
    } else {
      // Create new item
      const { data, error: insertError } = await supabase
        .from('items')
        .insert([payload])
        .select()
        .single();

      if (insertError) throw insertError;

      setItems((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      toast.success(`Item "${data.name}" added successfully.`);
    }
  };

  const filteredItems = items.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const name = (item.name || '').toLowerCase();
    const hsn = (item.hsn_code || '').toLowerCase();
    return name.includes(query) || hsn.includes(query);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-[#222222]">
          Stationery Items
        </h1>

        <div className="flex items-center justify-end gap-2.5">
          <Button
            variant="secondary"
            size="iconCompact"
            onClick={fetchItems}
            aria-label="Refresh items"
            icon={RefreshCw}
            disabled={loading}
          />
          <Button
            variant="primary"
            size="normal"
            icon={Plus}
            onClick={handleOpenAddModal}
          >
            Add Item
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Search Input */}
      <div className="bg-white p-3 rounded-xl border border-[#E5E7EB]">
        <Input
          id="search-items"
          placeholder="Search items by name or HSN code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          icon={Search}
          className="max-w-md"
        />
      </div>

      {/* Table Container */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-sm text-[#6B7280]">
            <div className="w-8 h-8 border-2 border-[#358FFF] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            Loading items...
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 sm:p-12">
            <EmptyState
              icon={Package}
              title="No items added yet"
              description="Add your first stationery item to configure your store's inventory and billing prices."
              actionLabel="Add Item"
              actionIcon={Plus}
              onAction={handleOpenAddModal}
            />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#6B7280]">
            <p className="font-medium text-[#222222] mb-1">No items found</p>
            <p>No products match &ldquo;{searchQuery}&rdquo;. Try another search term.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm" aria-label="Stationery items list">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-gray-50/50 text-[#6B7280] text-xs font-semibold uppercase tracking-wider">
                  <th scope="col" className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      {selectedIds.length > 0 && (
                        <input
                          type="checkbox"
                          checked={filteredItems.length > 0 && selectedIds.length === filteredItems.length}
                          onChange={handleToggleSelectAll}
                          className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500 cursor-pointer shrink-0"
                          title={selectedIds.length === filteredItems.length ? "Deselect all" : "Select all"}
                          aria-label="Select all items"
                        />
                      )}
                      <span>Item Name</span>
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3">HSN Code</th>
                  <th scope="col" className="px-6 py-3">UOM</th>
                  <th scope="col" className="px-6 py-3">GST Rate</th>
                  <th scope="col" className="px-6 py-3 text-right">Unit Rate</th>
                  <th scope="col" className="px-6 py-3 text-center">Status</th>
                  <th scope="col" className="px-6 py-3 text-right">
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
                      'Action'
                    )}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filteredItems.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  const isBeingPressed = activePressId === item.id;

                  return (
                    <tr
                      key={item.id}
                      onClick={() => handleRowClick(item)}
                      onTouchStart={(e) => handleTouchStart(item, e)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      onMouseDown={(e) => handleMouseDown(item, e)}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseLeave}
                      onContextMenu={(e) => handleContextMenu(item, e)}
                      className={`transition-colors cursor-pointer select-none ${
                        isBeingPressed
                          ? 'bg-red-100/70 ring-1 ring-inset ring-red-300'
                          : isSelected
                          ? 'bg-red-50/70 ring-1 ring-inset ring-red-200'
                          : 'hover:bg-gray-50/50'
                      }`}
                    >
                      <td className="px-6 py-4 font-semibold text-[#222222]">
                        <div className="flex items-center gap-3">
                          {selectedIds.length > 0 && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleSelect(item.id);
                              }}
                              className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500 cursor-pointer shrink-0"
                              aria-label={`Select item ${item.name}`}
                            />
                          )}
                          <span>{item.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[#6B7280] font-mono text-xs">
                        {item.hsn_code || '-'}
                      </td>
                      <td className="px-6 py-4 text-[#222222]">
                        <span className="inline-block px-2 py-0.5 bg-gray-100 rounded text-xs font-medium">
                          {item.uom}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[#6B7280]">
                        {formatGSTRate(item.gst_rate)}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-[#222222]">
                        {formatCurrency(item.unit_rate)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant={item.is_active ? 'active' : 'inactive'}>
                          {item.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="secondary"
                            size="compact"
                            icon={Edit2}
                            onClick={() => handleOpenEditModal(item)}
                            aria-label={`Edit ${item.name}`}
                          >
                            Edit
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Item Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen && selectedIds.length > 0}
        onClose={() => !deleting && setIsDeleteModalOpen(false)}
        title={selectedIds.length > 1 ? `Delete ${selectedIds.length} Items` : 'Delete Item'}
        subtitle="This action cannot be undone."
      >
        {selectedIds.length > 0 && (() => {
          const selectedItemsList = items.filter((it) => selectedIds.includes(it.id));
          const singleItem = selectedItemsList[0];
          const isMultiple = selectedIds.length > 1;

          return (
            <div className="space-y-4">
              {isMultiple ? (
                <div className="p-4 bg-red-50/60 border border-red-100 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-red-700">
                      {selectedIds.length} Items Selected
                    </span>
                  </div>
                  <div className="text-xs text-[#4B5563] max-h-24 overflow-y-auto pt-1 border-t border-red-100/70 flex flex-wrap gap-1">
                    {selectedItemsList.map((it) => (
                      <span key={it.id} className="px-2 py-0.5 bg-white border border-red-200 rounded text-[11px] text-red-800 font-medium">
                        {it.name}
                      </span>
                    ))}
                  </div>
                </div>
              ) : singleItem ? (
                <div className="p-4 bg-red-50/60 border border-red-100 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-red-700">
                      {singleItem.hsn_code ? `HSN: ${singleItem.hsn_code}` : 'Item'}
                    </span>
                    <Badge variant={singleItem.is_active ? 'active' : 'inactive'}>
                      {singleItem.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  <div className="text-sm font-semibold text-[#222222]">
                    {singleItem.name}
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#6B7280] pt-1 border-t border-red-100/70">
                    <span>Unit: {singleItem.uom} | GST: {formatGSTRate(singleItem.gst_rate)}</span>
                    <span className="font-bold text-[#222222]">
                      {formatCurrency(singleItem.unit_rate)}
                    </span>
                  </div>
                </div>
              ) : null}

              <p className="text-sm text-[#4B5563]">
                {isMultiple
                  ? `Are you sure you want to permanently delete these ${selectedIds.length} stationery items? Existing invoices containing these items will keep their saved record.`
                  : 'Are you sure you want to permanently delete this stationery item? Existing invoices containing this item will keep their saved record.'}
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
                  {isMultiple ? `Delete All (${selectedIds.length})` : 'Delete Item'}
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Add / Edit Modal */}
      <ItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveItem}
        onDelete={(item) => {
          setSelectedIds([item.id]);
          setIsDeleteModalOpen(true);
        }}
        item={editingItem}
      />
    </div>
  );
}
