import React from 'react';
import { formatCurrency } from '../../utils/formatters';
import { calculateInvoiceTotals, numberToWordsINR } from '../../utils/invoiceCalculations';

export function InvoiceSummary({
  items = [],
  isRounded = false,
  onToggleRound = null,
  customRoundOff = null,
  onChangeCustomRoundOff = null,
}) {
  const totals = calculateInvoiceTotals(items, { isRounded, customRoundOff });
  const hasDecimals = Math.abs(totals.unroundedTotal - Math.round(totals.unroundedTotal)) > 0.001;

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

        {/* Round Off Option */}
        {onToggleRound && (
          <div className="pt-2.5 pb-1 border-t border-dashed border-[#E5E7EB]">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="round-amount-checkbox"
                className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-[#222222]"
              >
                <input
                  id="round-amount-checkbox"
                  type="checkbox"
                  checked={isRounded}
                  onChange={(e) => {
                    onToggleRound(e.target.checked);
                    if (!e.target.checked && onChangeCustomRoundOff) {
                      onChangeCustomRoundOff(null);
                    }
                  }}
                  className="w-4 h-4 rounded text-[#358FFF] focus:ring-[#358FFF] border-[#D1D5DB] cursor-pointer"
                />
                <span>Round off amount</span>
                {hasDecimals && !isRounded && (
                  <span className="text-[10px] bg-blue-50 text-[#358FFF] font-semibold px-1.5 py-0.5 rounded border border-blue-100">
                    Auto: ₹{Math.round(totals.unroundedTotal)}
                  </span>
                )}
              </label>

              {isRounded && (
                <span className={`text-xs font-mono font-bold ${totals.roundOff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totals.roundOff >= 0 ? `+${formatCurrency(totals.roundOff)}` : `-${formatCurrency(Math.abs(totals.roundOff))}`}
                </span>
              )}
            </div>

            {/* Quick rounding mode buttons if rounded and has decimals */}
            {isRounded && hasDecimals && onChangeCustomRoundOff && (
              <div className="flex items-center gap-1.5 mt-2 pt-1 text-[11px] text-[#6B7280]">
                <span className="shrink-0">Round:</span>
                <div className="flex items-center gap-1 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => onChangeCustomRoundOff(null)}
                    className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer shrink-0 ${
                      customRoundOff === null
                        ? 'bg-[#358FFF] text-white font-semibold'
                        : 'bg-gray-100 text-[#4B5563] hover:bg-gray-200'
                    }`}
                  >
                    Nearest (₹{Math.round(totals.unroundedTotal)})
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeCustomRoundOff(Number((Math.floor(totals.unroundedTotal) - totals.unroundedTotal).toFixed(2)))}
                    className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer shrink-0 ${
                      customRoundOff !== null && Number((totals.unroundedTotal + customRoundOff).toFixed(2)) === Math.floor(totals.unroundedTotal)
                        ? 'bg-[#358FFF] text-white font-semibold'
                        : 'bg-gray-100 text-[#4B5563] hover:bg-gray-200'
                    }`}
                  >
                    Down (₹{Math.floor(totals.unroundedTotal)})
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeCustomRoundOff(Number((Math.ceil(totals.unroundedTotal) - totals.unroundedTotal).toFixed(2)))}
                    className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer shrink-0 ${
                      customRoundOff !== null && Number((totals.unroundedTotal + customRoundOff).toFixed(2)) === Math.ceil(totals.unroundedTotal)
                        ? 'bg-[#358FFF] text-white font-semibold'
                        : 'bg-gray-100 text-[#4B5563] hover:bg-gray-200'
                    }`}
                  >
                    Up (₹{Math.ceil(totals.unroundedTotal)})
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* If rounded and has non-zero round off, show Amount Before Rounding */}
        {isRounded && Math.abs(totals.roundOff) > 0.001 && (
          <div className="flex items-center justify-between text-xs text-[#6B7280]">
            <span>Amount Before Rounding</span>
            <span className="font-mono">{formatCurrency(totals.unroundedTotal)}</span>
          </div>
        )}

        {/* Grand Total */}
        <div className="pt-3 border-t border-[#E5E7EB] flex items-baseline justify-between">
          <div>
            <span className="text-base font-bold text-[#222222] block">Grand Total</span>
            <span className="text-[11px] text-[#6B7280]">
              {isRounded ? '(Rounded to nearest ₹)' : '(Inclusive of all GST)'}
            </span>
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
