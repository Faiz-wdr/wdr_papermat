import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';

const UOM_OPTIONS = [
  { value: 'PCS', label: 'PCS - Pieces' },
  { value: 'PKT', label: 'PKT - Packet' },
  { value: 'BOX', label: 'BOX - Box' },
  { value: 'DOZ', label: 'DOZ - Dozen' },
  { value: 'BNDL', label: 'BNDL - Bundle' },
  { value: 'SET', label: 'SET - Set' },
  { value: 'ROLL', label: 'ROLL - Roll' },
  { value: 'NOS', label: 'NOS - Numbers' },
  { value: 'MTR', label: 'MTR - Meter' },
  { value: 'KGS', label: 'KGS - Kilograms' },
];

const GST_RATE_OPTIONS = [
  { value: '0', label: '0% (Exempted / Nil)' },
  { value: '5', label: '5% GST' },
  { value: '12', label: '12% GST' },
  { value: '18', label: '18% GST (Standard)' },
  { value: '28', label: '28% GST' },
];

export function ItemModal({
  isOpen,
  onClose,
  onSave,
  item = null,
}) {
  const isEditing = Boolean(item && item.id);

  const [name, setName] = useState('');
  const [hsnCode, setHsnCode] = useState('');
  const [uom, setUom] = useState('PCS');
  const [unitRate, setUnitRate] = useState('');
  const [gstRate, setGstRate] = useState('12');
  const [isActive, setIsActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (item) {
      setName(item.name || '');
      setHsnCode(item.hsn_code || '');
      setUom(item.uom || 'PCS');
      setUnitRate(item.unit_rate != null ? String(item.unit_rate) : '');
      setGstRate(item.gst_rate != null ? String(Number(item.gst_rate)) : '12');
      setIsActive(item.is_active ?? true);
    } else {
      setName('');
      setHsnCode('');
      setUom('PCS');
      setUnitRate('');
      setGstRate('12');
      setIsActive(true);
    }
    setError(null);
  }, [item, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Item Name is required.');
      return;
    }

    const rateNum = parseFloat(unitRate);
    if (isNaN(rateNum) || rateNum < 0) {
      setError('Please enter a valid unit rate greater than or equal to 0.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        name: name.trim(),
        hsn_code: hsnCode.trim() || null,
        uom: uom || 'PCS',
        unit_rate: rateNum,
        gst_rate: parseFloat(gstRate) || 0,
        is_active: Boolean(isActive),
      };

      await onSave(payload, item?.id);
      onClose();
    } catch (err) {
      console.error('Failed to save item:', err);
      setError(err.message || 'Failed to save stationery item. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Stationery Item' : 'Add New Stationery Item'}
      subtitle={
        isEditing
          ? 'Update product details, pricing, and GST rate'
          : 'Add a new product to your stationery billing catalog'
      }
      maxWidth="max-w-lg"
    >
      {error && (
        <Alert variant="error" className="mb-4" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Item Name */}
        <Input
          id="item-name"
          label="Item Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Classmate 172 Pgs Long Book"
          required
          autoFocus
        />

        {/* HSN & UOM in 2 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="item-hsn"
            label="HSN Code"
            value={hsnCode}
            onChange={(e) => setHsnCode(e.target.value)}
            placeholder="e.g. 4820"
          />

          <Select
            id="item-uom"
            label="Unit of Measurement (UOM)"
            value={uom}
            onChange={(e) => setUom(e.target.value)}
            options={UOM_OPTIONS}
          />
        </div>

        {/* Unit Rate & GST Rate in 2 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            id="item-rate"
            label="Unit Rate (₹)"
            type="number"
            step="0.01"
            min="0"
            value={unitRate}
            onChange={(e) => setUnitRate(e.target.value)}
            placeholder="0.00"
            required
          />

          <Select
            id="item-gst"
            label="GST Rate"
            value={gstRate}
            onChange={(e) => setGstRate(e.target.value)}
            options={GST_RATE_OPTIONS}
          />
        </div>

        {/* Active Status */}
        <div className="pt-2">
          <label className="text-xs font-semibold text-[#222222] tracking-wide block mb-1.5">
            Status
          </label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-[#222222]">
              <input
                type="radio"
                name="is_active"
                checked={isActive === true}
                onChange={() => setIsActive(true)}
                className="w-4 h-4 text-[#358FFF] focus:ring-[#358FFF]"
              />
              <span>Active</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-[#222222]">
              <input
                type="radio"
                name="is_active"
                checked={isActive === false}
                onChange={() => setIsActive(false)}
                className="w-4 h-4 text-[#358FFF] focus:ring-[#358FFF]"
              />
              <span className="text-[#6B7280]">Inactive</span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E7EB] mt-6">
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
            {isEditing ? 'Save Changes' : 'Add Item'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
