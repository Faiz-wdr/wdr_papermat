import React, { useState, useEffect, useRef } from 'react';
import { Search, UserPlus, X, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { CustomerModal } from './CustomerModal';

export function CustomerSelector({
  customerData,
  onChange,
  disabled = false,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState([]);
  const [matchingCustomers, setMatchingCustomers] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const containerRef = useRef(null);

  useEffect(() => {
    fetchCustomers();

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCustomers = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');
      if (!error && data) {
        setCustomers(data);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);

    if (!val.trim()) {
      setMatchingCustomers([]);
      setIsDropdownOpen(false);
      return;
    }

    const q = val.toLowerCase();
    const filtered = customers.filter((c) => {
      const name = (c.name || '').toLowerCase();
      const mobile = (c.mobile || '').toLowerCase();
      const gst = (c.gst_no || '').toLowerCase();
      return name.includes(q) || mobile.includes(q) || gst.includes(q);
    });

    setMatchingCustomers(filtered);
    setIsDropdownOpen(true);
  };

  const handleSelectCustomer = (customer) => {
    onChange({
      customer_id: customer.id,
      customer_name: customer.name || '',
      customer_address: customer.address || '',
      customer_mobile: customer.mobile || '',
      customer_gst_no: customer.gst_no || '',
    });
    setSearchTerm('');
    setIsDropdownOpen(false);
  };

  const handleCustomerCreated = (newCustomer) => {
    setCustomers((prev) => [...prev, newCustomer].sort((a, b) => a.name.localeCompare(b.name)));
    handleSelectCustomer(newCustomer);
  };

  const handleFieldChange = (field, value) => {
    onChange({
      ...customerData,
      [field]: value,
    });
  };

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E7EB]">
        <div>
          <h2 className="text-base font-semibold text-[#222222]">
            Details of Receiver (Billed To)
          </h2>
          <p className="text-xs text-[#6B7280]">
            Search existing customer or enter billing details
          </p>
        </div>

        {!disabled && (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="compact"
              icon={UserPlus}
              onClick={() => setIsModalOpen(true)}
            >
              New Customer
            </Button>
          </div>
        )}
      </div>

      {/* Autocomplete Search Bar */}
      {!disabled && (
        <div ref={containerRef} className="relative">
          <Input
            id="customer-search-input"
            label="Search Customer"
            placeholder="Search customer by name, mobile, or GSTIN..."
            value={searchTerm}
            onChange={handleSearchChange}
            onFocus={() => {
              if (searchTerm.trim() && matchingCustomers.length > 0) {
                setIsDropdownOpen(true);
              }
            }}
            icon={Search}
          />

          {/* Autocomplete Suggestions Dropdown */}
          {isDropdownOpen && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#E5E7EB] rounded-xl shadow-lg z-30 max-h-60 overflow-y-auto">
              {matchingCustomers.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#6B7280]">
                  No customers found matching &ldquo;{searchTerm}&rdquo;.
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setIsModalOpen(true);
                    }}
                    className="block mx-auto mt-2 text-[#358FFF] font-semibold hover:underline cursor-pointer"
                  >
                    + Add as New Customer
                  </button>
                </div>
              ) : (
                <ul className="divide-y divide-[#E5E7EB]" role="listbox">
                  {matchingCustomers.map((c) => (
                    <li
                      key={c.id}
                      role="option"
                      aria-selected="false"
                      onClick={() => handleSelectCustomer(c)}
                      className="p-3 hover:bg-[#EFF6FF] cursor-pointer transition-colors flex items-start justify-between gap-3"
                    >
                      <div>
                        <span className="font-semibold text-sm text-[#222222] block">
                          {c.name}
                        </span>
                        {c.address && (
                          <span className="text-xs text-[#6B7280] block truncate max-w-sm">
                            {c.address}
                          </span>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-[#6B7280]">
                          {c.mobile && <span>Mob: {c.mobile}</span>}
                          {c.gst_no && <span>GSTIN: {c.gst_no}</span>}
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-[#358FFF] shrink-0 mt-1">
                        Select
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {/* Editable Customer Details Fields (Populated automatically, but editable for invoice) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        <Input
          id="inv-customer-name"
          label="Customer Name"
          value={customerData.customer_name || ''}
          onChange={(e) => handleFieldChange('customer_name', e.target.value)}
          placeholder="Customer or School Name"
          required
          disabled={disabled}
          className="sm:col-span-2"
        />

        <Input
          id="inv-customer-address"
          label="Billing Address"
          value={customerData.customer_address || ''}
          onChange={(e) => handleFieldChange('customer_address', e.target.value)}
          placeholder="Address, Place, District"
          disabled={disabled}
          className="sm:col-span-2"
        />

        <Input
          id="inv-customer-mobile"
          label="Mobile Number"
          value={customerData.customer_mobile || ''}
          onChange={(e) => handleFieldChange('customer_mobile', e.target.value)}
          placeholder="e.g. 9747748658"
          disabled={disabled}
        />

        <Input
          id="inv-customer-gst"
          label="GSTIN (Optional)"
          value={customerData.customer_gst_no || ''}
          onChange={(e) => handleFieldChange('customer_gst_no', e.target.value.toUpperCase())}
          placeholder="e.g. 32BIVPA1766K1Z1"
          disabled={disabled}
        />
      </div>

      {/* New Customer Modal */}
      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCustomerCreated={handleCustomerCreated}
      />
    </div>
  );
}
