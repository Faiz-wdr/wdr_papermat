import React from 'react';
import { formatCurrency } from '../../utils/formatters';
import { calculateInvoiceTotals, numberToWordsINR, round2 } from '../../utils/invoiceCalculations';

export function InvoiceSummary({
  items = [],
  roundOff = '',
  onChangeRoundOff = null,
  // backwards-compatibility in case old props are passed:
  isRounded = false,
  onToggleRound = null,
  customRoundOff = null,
  onChangeCustomRoundOff = null,
}) {
  // If modern onChangeRoundOff is passed, use roundOff; otherwise fallback to isRounded/customRoundOff
  const effectiveRoundOff = onChangeRoundOff
    ? roundOff
    : (customRoundOff !== null ? customRoundOff : (isRounded ? true : ''));

  const totals = calculateInvoiceTotals(items, { roundOff: effectiveRoundOff });
  const autoDiff = round2(Math.round(totals.unroundedTotal) - totals.unroundedTotal);

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

        {/* Amount Before Round Off (Subtotal) */}
        {Math.abs(totals.roundOff) > 0.001 && (
          <div className="flex items-center justify-between text-[#6B7280] pt-1">
            <span>Subtotal</span>
            <span className="font-semibold text-[#222222]">{formatCurrency(totals.unroundedTotal)}</span>
          </div>
        )}

        {/* Round Off Input Field (Direct Typing) */}
        {onChangeRoundOff ? (
          <div className="pt-2 border-t border-dashed border-[#E5E7EB]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <label htmlFor="round-off-input" className="text-sm font-medium text-[#222222]">
                  Round Off
                </label>
                {Math.abs(autoDiff) > 0.001 && (
                  <button
                    type="button"
                    onClick={() => onChangeRoundOff(autoDiff > 0 ? `+${autoDiff}` : String(autoDiff))}
                    title={`Auto calculate nearest ₹ (${autoDiff > 0 ? `+${autoDiff}` : autoDiff})`}
                    className="text-[10px] bg-blue-50 hover:bg-blue-100 text-[#358FFF] font-semibold px-2 py-0.5 rounded border border-blue-100 cursor-pointer transition-colors"
                  >
                    Auto: {autoDiff > 0 ? `+${autoDiff}` : autoDiff}
                  </button>
                )}
              </div>

              <div className="w-28">
                <input
                  id="round-off-input"
                  type="number"
                  step="0.01"
                  value={roundOff}
                  onChange={(e) => onChangeRoundOff(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-2.5 py-1.5 text-right font-mono text-sm font-semibold text-[#222222] border border-[#E5E7EB] rounded-lg focus:border-[#358FFF] focus:outline-none"
                />
              </div>
            </div>
          </div>
        ) : (
          Math.abs(totals.roundOff) > 0.001 && (
            <div className="flex items-center justify-between text-xs text-[#6B7280]">
              <span>Round Off</span>
              <span className={`font-mono font-semibold ${totals.roundOff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totals.roundOff >= 0 ? `+${formatCurrency(totals.roundOff)}` : `-${formatCurrency(Math.abs(totals.roundOff))}`}
              </span>
            </div>
          )
        )}

        {/* Grand Total */}
        <div className="pt-3 border-t border-[#E5E7EB] flex items-baseline justify-between">
          <div>
            <span className="text-base font-bold text-[#222222] block">Grand Total</span>
            <span className="text-[11px] text-[#6B7280]">
              {Math.abs(totals.roundOff) > 0.001 ? '(After Round Off)' : '(Inclusive of all GST)'}
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
