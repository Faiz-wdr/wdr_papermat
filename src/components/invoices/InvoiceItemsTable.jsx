import React from 'react';
import { Trash2, Plus, AlertCircle } from 'lucide-react';
import { formatCurrency, formatGSTRate } from '../../utils/formatters';
import { calculateItemTotals } from '../../utils/invoiceCalculations';
import { Button } from '../ui/Button';

const GST_RATE_OPTIONS = [0, 5, 12, 18, 28];
const UOM_OPTIONS = ['PCS', 'PKT', 'BOX', 'DOZ', 'BNDL', 'SET', 'ROLL', 'NOS', 'MTR', 'KGS'];

export function InvoiceItemsTable({
  items,
  onChangeItems,
  disabled = false,
}) {
  const handleItemFieldChange = (index, field, value) => {
    const updated = [...items];
    let parsedVal = value;

    if (field === 'qty' || field === 'unit_rate' || field === 'gst_rate') {
      parsedVal = value === '' ? '' : parseFloat(value);
      if (isNaN(parsedVal)) parsedVal = 0;
    }

    const modified = {
      ...updated[index],
      [field]: parsedVal,
    };

    // Recalculate item totals
    updated[index] = calculateItemTotals(modified);
    onChangeItems(updated);
  };

  const handleRemoveItem = (index) => {
    const updated = items.filter((_, i) => i !== index);
    onChangeItems(updated);
  };

  if (!items || items.length === 0) {
    return (
      <div className="border border-dashed border-[#E5E7EB] rounded-xl p-8 text-center bg-gray-50/50">
        <AlertCircle size={28} className="mx-auto text-[#6B7280] mb-2" />
        <h4 className="text-sm font-semibold text-[#222222]">No items added to invoice</h4>
        <p className="text-xs text-[#6B7280] mt-1">
          Use the item search above to add products to this invoice.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ------------------------------------------------------------- */}
      {/* DESKTOP TABLE VIEW (Visible on tablet & desktop >= md)        */}
      {/* ------------------------------------------------------------- */}
      <div className="hidden md:block overflow-x-auto bg-white border border-[#E5E7EB] rounded-xl shadow-xs">
        <table className="w-full text-left text-xs sm:text-sm border-collapse" aria-label="Invoice items table">
          <thead>
            <tr className="border-b border-[#E5E7EB] bg-gray-50/75 text-[#6B7280] text-xs font-semibold uppercase tracking-wider">
              <th scope="col" className="px-3 py-3 w-10 text-center">No</th>
              <th scope="col" className="px-3 py-3 min-w-[180px]">Description Of Goods</th>
              <th scope="col" className="px-3 py-3 w-24">HSN Code</th>
              <th scope="col" className="px-3 py-3 w-20 text-center">Qty</th>
              <th scope="col" className="px-3 py-3 w-20">UOM</th>
              <th scope="col" className="px-3 py-3 w-24 text-right">Unit Rate (₹)</th>
              <th scope="col" className="px-3 py-3 w-28 text-right">Taxable Value</th>
              <th scope="col" className="px-3 py-3 w-24 text-right">CGST</th>
              <th scope="col" className="px-3 py-3 w-24 text-right">SGST</th>
              <th scope="col" className="px-3 py-3 w-28 text-right">Total (₹)</th>
              {!disabled && <th scope="col" className="px-3 py-3 w-12 text-center"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {items.map((item, index) => {
              const calc = calculateItemTotals(item);
              return (
                <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                  {/* Row No */}
                  <td className="px-3 py-3 text-center text-[#6B7280] font-medium">
                    {index + 1}
                  </td>

                  {/* Item Name */}
                  <td className="px-3 py-3">
                    {disabled ? (
                      <span className="font-semibold text-[#222222]">{calc.item_name}</span>
                    ) : (
                      <input
                        type="text"
                        value={calc.item_name || ''}
                        onChange={(e) => handleItemFieldChange(index, 'item_name', e.target.value)}
                        placeholder="Item Description"
                        className="w-full px-2 py-1.5 text-sm font-semibold text-[#222222] border border-[#E5E7EB] rounded-md focus:border-[#358FFF] focus:outline-none"
                      />
                    )}
                  </td>

                  {/* HSN Code */}
                  <td className="px-3 py-3">
                    {disabled ? (
                      <span className="font-mono text-xs text-[#6B7280]">{calc.hsn_code || '-'}</span>
                    ) : (
                      <input
                        type="text"
                        value={calc.hsn_code || ''}
                        onChange={(e) => handleItemFieldChange(index, 'hsn_code', e.target.value)}
                        placeholder="HSN"
                        className="w-full px-2 py-1.5 font-mono text-xs text-[#6B7280] border border-[#E5E7EB] rounded-md focus:border-[#358FFF] focus:outline-none"
                      />
                    )}
                  </td>

                  {/* Quantity */}
                  <td className="px-3 py-3">
                    {disabled ? (
                      <span className="block text-center font-semibold text-[#222222]">{calc.qty}</span>
                    ) : (
                      <input
                        type="number"
                        min="0.01"
                        step="any"
                        value={calc.qty === '' ? '' : calc.qty}
                        onChange={(e) => handleItemFieldChange(index, 'qty', e.target.value)}
                        className="w-full px-2 py-1.5 text-center text-sm font-semibold text-[#222222] border border-[#E5E7EB] rounded-md focus:border-[#358FFF] focus:outline-none"
                      />
                    )}
                  </td>

                  {/* UOM */}
                  <td className="px-3 py-3">
                    {disabled ? (
                      <span className="text-xs font-medium text-[#6B7280]">{calc.uom}</span>
                    ) : (
                      <select
                        value={calc.uom || 'PCS'}
                        onChange={(e) => handleItemFieldChange(index, 'uom', e.target.value)}
                        className="w-full px-1.5 py-1.5 text-xs font-medium text-[#222222] border border-[#E5E7EB] rounded-md focus:border-[#358FFF] focus:outline-none bg-white cursor-pointer"
                      >
                        {UOM_OPTIONS.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    )}
                  </td>

                  {/* Unit Rate */}
                  <td className="px-3 py-3 text-right">
                    {disabled ? (
                      <span className="font-semibold text-[#222222]">{formatCurrency(calc.unit_rate)}</span>
                    ) : (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={calc.unit_rate === '' ? '' : calc.unit_rate}
                        onChange={(e) => handleItemFieldChange(index, 'unit_rate', e.target.value)}
                        className="w-full px-2 py-1.5 text-right text-sm font-semibold text-[#222222] border border-[#E5E7EB] rounded-md focus:border-[#358FFF] focus:outline-none"
                      />
                    )}
                  </td>

                  {/* Taxable Value */}
                  <td className="px-3 py-3 text-right font-medium text-[#222222]">
                    {formatCurrency(calc.taxable_value)}
                  </td>

                  {/* CGST */}
                  <td className="px-3 py-3 text-right">
                    <div className="text-xs font-semibold text-[#222222]">
                      {formatCurrency(calc.cgst_amount)}
                    </div>
                    <div className="text-[11px] text-[#6B7280]">
                      @{calc.cgst_rate}%
                    </div>
                  </td>

                  {/* SGST */}
                  <td className="px-3 py-3 text-right">
                    <div className="text-xs font-semibold text-[#222222]">
                      {formatCurrency(calc.sgst_amount)}
                    </div>
                    <div className="text-[11px] text-[#6B7280]">
                      @{calc.sgst_rate}%
                    </div>
                  </td>

                  {/* Total */}
                  <td className="px-3 py-3 text-right font-bold text-[#222222]">
                    {formatCurrency(calc.total)}
                  </td>

                  {/* Remove Button */}
                  {!disabled && (
                    <td className="px-3 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        aria-label={`Remove row ${index + 1}: ${calc.item_name}`}
                        className="text-[#6B7280] hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MOBILE CARD VIEW (Visible only on mobile screens < md)       */}
      {/* ------------------------------------------------------------- */}
      <div className="md:hidden space-y-3" aria-label="Invoice items mobile list">
        {items.map((item, index) => {
          const calc = calculateItemTotals(item);
          return (
            <div
              key={index}
              className="bg-white border border-[#E5E7EB] rounded-xl p-4 shadow-xs space-y-3"
            >
              {/* Card Header: Item Name and Remove */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="text-xs font-semibold text-[#6B7280] mb-0.5">
                    Item #{index + 1}
                  </div>
                  {disabled ? (
                    <h4 className="font-semibold text-sm text-[#222222]">{calc.item_name}</h4>
                  ) : (
                    <input
                      type="text"
                      value={calc.item_name || ''}
                      onChange={(e) => handleItemFieldChange(index, 'item_name', e.target.value)}
                      placeholder="Item name"
                      className="w-full px-2.5 py-1.5 font-semibold text-sm text-[#222222] border border-[#E5E7EB] rounded-lg focus:border-[#358FFF] focus:outline-none"
                    />
                  )}
                </div>

                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    aria-label={`Remove ${calc.item_name}`}
                    className="w-10 h-10 flex items-center justify-center text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors shrink-0 cursor-pointer"
                  >
                    <Trash2 size={18} aria-hidden="true" />
                  </button>
                )}
              </div>

              {/* Editable Controls: Qty, UOM, Unit Rate, GST */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                <div>
                  <label className="text-[11px] font-semibold text-[#6B7280] block mb-1">
                    Quantity
                  </label>
                  {disabled ? (
                    <div className="font-semibold text-sm text-[#222222]">{calc.qty}</div>
                  ) : (
                    <input
                      type="number"
                      min="0.01"
                      step="any"
                      value={calc.qty === '' ? '' : calc.qty}
                      onChange={(e) => handleItemFieldChange(index, 'qty', e.target.value)}
                      className="w-full h-10 px-2.5 text-center font-semibold text-sm text-[#222222] border border-[#E5E7EB] rounded-lg focus:border-[#358FFF] focus:outline-none"
                    />
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#6B7280] block mb-1">
                    UOM
                  </label>
                  {disabled ? (
                    <div className="text-xs font-semibold text-[#222222]">{calc.uom}</div>
                  ) : (
                    <select
                      value={calc.uom || 'PCS'}
                      onChange={(e) => handleItemFieldChange(index, 'uom', e.target.value)}
                      className="w-full h-10 px-2 text-xs font-medium text-[#222222] border border-[#E5E7EB] rounded-lg focus:border-[#358FFF] focus:outline-none bg-white cursor-pointer"
                    >
                      {UOM_OPTIONS.map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#6B7280] block mb-1">
                    Unit Rate (₹)
                  </label>
                  {disabled ? (
                    <div className="font-semibold text-sm text-[#222222]">{formatCurrency(calc.unit_rate)}</div>
                  ) : (
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={calc.unit_rate === '' ? '' : calc.unit_rate}
                      onChange={(e) => handleItemFieldChange(index, 'unit_rate', e.target.value)}
                      className="w-full h-10 px-2.5 text-right font-semibold text-sm text-[#222222] border border-[#E5E7EB] rounded-lg focus:border-[#358FFF] focus:outline-none"
                    />
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#6B7280] block mb-1">
                    GST Rate
                  </label>
                  {disabled ? (
                    <div className="text-xs font-semibold text-[#222222]">{calc.gst_rate}%</div>
                  ) : (
                    <select
                      value={calc.gst_rate}
                      onChange={(e) => handleItemFieldChange(index, 'gst_rate', e.target.value)}
                      className="w-full h-10 px-2 text-xs font-medium text-[#222222] border border-[#E5E7EB] rounded-lg focus:border-[#358FFF] focus:outline-none bg-white cursor-pointer"
                    >
                      {GST_RATE_OPTIONS.map((r) => (
                        <option key={r} value={r}>{r}% GST</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Calculated Values Summary Footer inside Card */}
              <div className="bg-gray-50 rounded-lg p-2.5 text-xs flex items-center justify-between border border-[#E5E7EB]">
                <div>
                  <span className="text-[#6B7280]">Taxable: </span>
                  <span className="font-semibold text-[#222222]">{formatCurrency(calc.taxable_value)}</span>
                  <span className="text-[#6B7280] ml-2">GST ({calc.gst_rate}%): </span>
                  <span className="font-medium text-[#222222]">
                    {formatCurrency(calc.cgst_amount + calc.sgst_amount)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[#6B7280]">Line Total: </span>
                  <span className="font-bold text-sm text-[#222222]">{formatCurrency(calc.total)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
