import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Package } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatCurrency, formatGSTRate } from '../../utils/formatters';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export function ItemSearchAutocomplete({ onSelectItem, onAddCustomItem }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [allItems, setAllItems] = useState([]);
  const [matchingItems, setMatchingItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const containerRef = useRef(null);

  useEffect(() => {
    fetchItems();

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchItems = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (!error && data) {
        setAllItems(data);
      }
    } catch (err) {
      console.error('Error fetching items for autocomplete:', err);
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);

    if (!val.trim()) {
      setMatchingItems([]);
      setIsOpen(false);
      return;
    }

    const q = val.toLowerCase();
    const filtered = allItems.filter((item) => {
      const name = (item.name || '').toLowerCase();
      const hsn = (item.hsn_code || '').toLowerCase();
      return name.includes(q) || hsn.includes(q);
    });

    setMatchingItems(filtered);
    setIsOpen(true);
  };

  const handleSelect = (item) => {
    onSelectItem({
      item_id: item.id,
      item_name: item.name,
      hsn_code: item.hsn_code || '',
      uom: item.uom || 'PCS',
      unit_rate: Number(item.unit_rate) || 0,
      gst_rate: Number(item.gst_rate) || 0,
      qty: 1,
    });
    setSearchTerm('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
      <div className="flex-1 relative">
        <Input
          id="item-autocomplete-search"
          label="Add Stationery Item"
          placeholder="Type item name or HSN code (e.g. Notebook, A4, 4820)..."
          value={searchTerm}
          onChange={handleSearchChange}
          onFocus={() => {
            if (searchTerm.trim() && matchingItems.length > 0) setIsOpen(true);
          }}
          icon={Search}
        />

        {isOpen && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#E5E7EB] rounded-xl shadow-lg z-30 max-h-64 overflow-y-auto">
            {matchingItems.length === 0 ? (
              <div className="p-4 text-center text-xs text-[#6B7280]">
                No stationery items found matching &ldquo;{searchTerm}&rdquo;.
                <button
                  type="button"
                  onClick={() => {
                    onAddCustomItem(searchTerm);
                    setSearchTerm('');
                    setIsOpen(false);
                  }}
                  className="block mx-auto mt-2 text-[#358FFF] font-semibold hover:underline cursor-pointer"
                >
                  + Add &ldquo;{searchTerm}&rdquo; as custom item
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-[#E5E7EB]" role="listbox">
                {matchingItems.map((item) => (
                  <li
                    key={item.id}
                    role="option"
                    aria-selected="false"
                    onClick={() => handleSelect(item)}
                    className="p-3 hover:bg-[#EFF6FF] cursor-pointer transition-colors flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-sm text-[#222222] block truncate">
                        {item.name}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-[#6B7280]">
                        {item.hsn_code && <span>HSN: {item.hsn_code}</span>}
                        <span>·</span>
                        <span className="font-medium text-[#222222]">{formatCurrency(item.unit_rate)}</span>
                        <span>·</span>
                        <span>GST {formatGSTRate(item.gst_rate)}</span>
                        <span>·</span>
                        <span className="bg-gray-100 px-1.5 py-0.2 rounded text-[11px] font-medium">{item.uom}</span>
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      size="compact"
                      icon={Plus}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(item);
                      }}
                    >
                      Add
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <Button
        variant="secondary"
        size="normal"
        icon={Plus}
        onClick={() => onAddCustomItem('')}
        className="shrink-0"
      >
        Add
      </Button>
    </div>
  );
}
