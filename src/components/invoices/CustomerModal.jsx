import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';

export function CustomerModal({ isOpen, onClose, onCustomerCreated }) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [mobile, setMobile] = useState('');
  const [gstNo, setGstNo] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Customer Name is required.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        name: name.trim(),
        address: address.trim() || null,
        mobile: mobile.trim() || null,
        gst_no: gstNo.trim() || null,
      };

      const { data, error: insertError } = await supabase
        .from('customers')
        .insert([payload])
        .select()
        .single();

      if (insertError) throw insertError;

      // Reset form
      setName('');
      setAddress('');
      setMobile('');
      setGstNo('');

      onCustomerCreated(data);
      onClose();
    } catch (err) {
      console.error('Error creating customer:', err);
      setError(err.message || 'Failed to save customer. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Customer"
      subtitle="Save customer details for quick lookup and invoice generation"
      maxWidth="max-w-md"
    >
      {error && (
        <Alert variant="error" className="mb-4" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="customer-name"
          label="Customer / School / Business Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Govt Higher Secondary School, Wandoor"
          required
          autoFocus
        />

        <Input
          id="customer-address"
          label="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="e.g. Market Road, Wandoor"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            id="customer-mobile"
            label="Mobile Number"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder="e.g. 9876543210"
          />

          <Input
            id="customer-gst"
            label="GSTIN (Optional)"
            value={gstNo}
            onChange={(e) => setGstNo(e.target.value.toUpperCase())}
            placeholder="32ABCDE1234F1Z5"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E7EB] mt-5">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={saving}
          >
            Save & Select Customer
          </Button>
        </div>
      </form>
    </Modal>
  );
}
