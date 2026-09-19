import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, ReceiptText, RefreshCw, Eye, Edit2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { Alert } from '../components/ui/Alert';

export function Invoices() {
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data, error: invError } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (invError) throw invError;

      setInvoices(data || []);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError('Unable to load invoices. Please check your network or try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const invNum = (inv.invoice_number || '').toLowerCase();
    const custName = (inv.customer_name || '').toLowerCase();
    const custMobile = (inv.customer_mobile || '').toLowerCase();
    return invNum.includes(query) || custName.includes(query) || custMobile.includes(query);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#222222]">
            Invoices
          </h1>
          <p className="text-sm text-[#6B7280] mt-0.5">
            Create, view, and manage school and office billing records
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5 w-full sm:w-auto">
          <Button
            variant="secondary"
            size="iconCompact"
            onClick={fetchInvoices}
            aria-label="Refresh invoices list"
            icon={RefreshCw}
            disabled={loading}
          />
          <Button
            variant="primary"
            size="normal"
            icon={Plus}
            onClick={() => navigate('/invoices/new')}
          >
            Create Invoice
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Search Bar: Search by number, customer, mobile */}
      <div className="bg-white p-3 rounded-xl border border-[#E5E7EB]">
        <Input
          id="search-invoices"
          placeholder="Search by invoice number, customer name, or mobile..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          icon={Search}
          className="max-w-md"
        />
      </div>

      {/* Main Table / State Container */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-sm text-[#6B7280]">
            <div className="w-8 h-8 border-2 border-[#358FFF] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            Loading invoices...
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-8 sm:p-12">
            <EmptyState
              icon={ReceiptText}
              title="No invoices yet"
              description="Create your first invoice to get started."
              actionLabel="Create Invoice"
              actionIcon={Plus}
              onAction={() => navigate('/invoices/new')}
            />
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#6B7280]">
            <p className="font-medium text-[#222222] mb-1">No invoices found</p>
            <p>No invoices match &ldquo;{searchQuery}&rdquo;. Try another search term.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm" aria-label="Invoices list">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-gray-50/50 text-[#6B7280] text-xs font-semibold uppercase tracking-wider">
                  <th scope="col" className="px-6 py-3">Invoice Number</th>
                  <th scope="col" className="px-6 py-3">Customer</th>
                  <th scope="col" className="px-6 py-3">Date</th>
                  <th scope="col" className="px-6 py-3 text-right">Amount</th>
                  <th scope="col" className="px-6 py-3 text-center">Status</th>
                  <th scope="col" className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {filteredInvoices.map((inv) => {
                  const isDraft = inv.status === 'draft';
                  return (
                    <tr
                      key={inv.id}
                      onClick={() => navigate(`/invoices/${inv.id}`)}
                      className="hover:bg-gray-50/75 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4 font-semibold text-[#222222]">
                        {inv.invoice_number}
                      </td>
                      <td className="px-6 py-4 text-[#222222]">
                        <div className="font-medium">{inv.customer_name}</div>
                        {inv.customer_mobile && (
                          <div className="text-xs text-[#6B7280]">{inv.customer_mobile}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-[#6B7280]">
                        {formatDate(inv.invoice_date)}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-[#222222]">
                        {formatCurrency(inv.grand_total)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Badge variant={isDraft ? 'draft' : 'paid'}>
                          {isDraft ? 'Draft' : 'Final'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="secondary"
                            size="iconCompact"
                            icon={Eye}
                            title="View Invoice"
                            aria-label={`View invoice ${inv.invoice_number}`}
                            onClick={() => navigate(`/invoices/${inv.id}`)}
                          />

                          {isDraft && (
                            <Button
                              variant="secondary"
                              size="iconCompact"
                              icon={Edit2}
                              title="Edit Draft"
                              aria-label={`Edit draft ${inv.invoice_number}`}
                              onClick={() => navigate(`/invoices/${inv.id}/edit`)}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
