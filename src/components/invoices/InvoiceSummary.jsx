import React from 'react';
import { formatCurrency } from '../../utils/formatters';
import { calculateInvoiceTotals, numberToWordsINR } from '../../utils/invoiceCalculations';

export function InvoiceSummary({ items = [] }) {
  const totals = calculateInvoiceTotals(items);

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-xs space-y-4">
      <h3 className="text-sm font-semibold text-[#222222] pb-2 border-b border-[#E5E7EB]">
        Invoice Summary
      </h3>

      <div className="space-y-2.5 text-sm">
        {/* Total Quantity */}
        <div className="flex items-center justify-between text-[#6B7280]">
          <span>Total Quantity</span>
          <span className="font-semibold text-[#222222]">{totals.totalQty}</span>
        </div>

        {/* Taxable Value */}
        <div className="flex items-center justify-between text-[#6B7280]">
          <span>Taxable Value</span>
          <span className="font-semibold text-[#222222]">{formatCurrency(totals.taxableValue)}</span>
        </div>

        {/* CGST */}
        <div className="flex items-center justify-between text-[#6B7280]">
          <span>CGST (Central Tax)</span>
          <span className="font-semibold text-[#222222]">{formatCurrency(totals.totalCGST)}</span>
        </div>

        {/* SGST */}
        <div className="flex items-center justify-between text-[#6B7280]">
          <span>SGST (State Tax)</span>
          <span className="font-semibold text-[#222222]">{formatCurrency(totals.totalSGST)}</span>
        </div>

        {/* Grand Total */}
        <div className="pt-3 border-t border-[#E5E7EB] flex items-baseline justify-between">
          <div>
            <span className="text-base font-bold text-[#222222] block">Grand Total</span>
            <span className="text-[11px] text-[#6B7280]">(Inclusive of all GST)</span>
          </div>
          <span className="text-2xl font-bold text-[#358FFF] tracking-tight">
            {formatCurrency(totals.grandTotal)}
          </span>
        </div>

        {/* Amount in Words */}
        {totals.grandTotal > 0 && (
          <div className="pt-2 text-xs text-[#6B7280] italic bg-gray-50 p-2.5 rounded-lg border border-[#E5E7EB]">
            <span className="font-medium text-[#222222] not-italic mr-1">Amount in Words:</span>
            {numberToWordsINR(totals.grandTotal)}
          </div>
        )}
      </div>
    </div>
  );
}
