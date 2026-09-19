import React, { useEffect, useState } from 'react';
import { Plus, Search, Package, Edit2, CheckCircle2, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCurrency, formatGSTRate } from '../utils/formatters';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { ItemModal } from '../components/items/ItemModal';
import { Alert } from '../components/ui/Alert';
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#222222]">
            Stationery Items
          </h1>
          <p className="text-sm text-[#6B7280] mt-0.5">
            Manage stationery products, HSN codes, UOM, and tax rates
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5 w-full sm:w-auto">
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
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
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
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="secondary"
                        size="compact"
                        icon={Edit2}
                        onClick={() => handleOpenEditModal(item)}
                        aria-label={`Edit ${item.name}`}
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <ItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveItem}
        item={editingItem}
      />
    </div>
  );
}
