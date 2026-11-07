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

  // Delete State & Long-press management
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [enabledDeleteIds, setEnabledDeleteIds] = useState([]);
  const [activePressId, setActivePressId] = useState(null);

  const longPressTimer = useRef(null);
  const isLongPressTriggered = useRef(false);
  const touchStartPos = useRef({ x: 0, y: 0 });

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
      setEnabledDeleteIds((prev) => (prev.includes(item.id) ? prev : [...prev, item.id]));
      setItemToDelete(item);
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
    setEnabledDeleteIds((prev) => (prev.includes(item.id) ? prev : [...prev, item.id]));
    setItemToDelete(item);
  };

  const handleRowClick = (item) => {
    if (isLongPressTriggered.current) {
      isLongPressTriggered.current = false;
      return;
    }
    handleOpenEditModal(item);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      setDeleting(true);
      if (!supabase) throw new Error('Supabase client is not connected.');

      const { error: delError } = await supabase
        .from('items')
        .delete()
        .eq('id', itemToDelete.id);

      if (delError) throw delError;

      setItems((prev) => prev.filter((it) => it.id !== itemToDelete.id));
      setEnabledDeleteIds((prev) => prev.filter((id) => id !== itemToDelete.id));
      toast.success(`Item "${itemToDelete.name}" deleted successfully.`);
      setItemToDelete(null);
    } catch (err) {
      console.error('Failed to delete item:', err);
      toast.error(err.message || 'Failed to delete item. Please try again.');
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
                  <th scope="col" className="px-6 py-3">Item Name</th>
                  <th scope="col" className="px-6 py-3">HSN Code</th>
                  <th scope="col" className="px-6 py-3">UOM</th>
                  <th scope="col" className="px-6 py-3">GST Rate</th>
                  <th scope="col" className="px-6 py-3 text-right">Unit Rate</th>
                  <th scope="col" className="px-6 py-3 text-center">Status</th>
                  <th scope="col" className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filteredItems.map((item) => {
                  const isDeleteEnabled = enabledDeleteIds.includes(item.id);
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
                          ? 'bg-red-50/80 ring-1 ring-inset ring-red-300'
                          : isDeleteEnabled
                          ? 'bg-red-50/25 hover:bg-red-50/50'
                          : 'hover:bg-gray-50/50'
                      }`}
                    >
                      <td className="px-6 py-4 font-semibold text-[#222222]">
                        {item.name}
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

                          {isDeleteEnabled && (
                            <Button
                              variant="danger"
                              size="iconCompact"
                              icon={Trash2}
                              title="Delete Item"
                              aria-label={`Delete item ${item.name}`}
                              onClick={() => setItemToDelete(item)}
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
              <span>Tip: Press and hold any row to delete the item.</span>
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

      {/* Delete Item Confirmation Modal */}
      <Modal
        isOpen={Boolean(itemToDelete)}
        onClose={() => !deleting && setItemToDelete(null)}
        title="Delete Item"
        subtitle="This action cannot be undone."
      >
        {itemToDelete && (
          <div className="space-y-4">
            <div className="p-4 bg-red-50/60 border border-red-100 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-red-700">
                  {itemToDelete.hsn_code ? `HSN: ${itemToDelete.hsn_code}` : 'Item'}
                </span>
                <Badge variant={itemToDelete.is_active ? 'active' : 'inactive'}>
                  {itemToDelete.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <div className="text-sm font-semibold text-[#222222]">
                {itemToDelete.name}
              </div>

              <div className="flex items-center justify-between text-xs text-[#6B7280] pt-1 border-t border-red-100/70">
                <span>Unit: {itemToDelete.uom} | GST: {formatGSTRate(itemToDelete.gst_rate)}</span>
                <span className="font-bold text-[#222222]">
                  {formatCurrency(itemToDelete.unit_rate)}
                </span>
              </div>
            </div>

            <p className="text-sm text-[#4B5563]">
              Are you sure you want to permanently delete this stationery item? Existing invoices containing this item will keep their saved record.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E7EB]">
              <Button
                variant="secondary"
                size="normal"
                onClick={() => setItemToDelete(null)}
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
                Delete Item
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add / Edit Modal */}
      <ItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveItem}
        onDelete={(item) => setItemToDelete(item)}
        item={editingItem}
      />
    </div>
  );
}
