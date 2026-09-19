import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  IndianRupee,
  ReceiptText,
  Calendar,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { StatCard } from '../components/dashboard/StatCard';
import { Alert } from '../components/ui/Alert';

export function Dashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    todaySales: 0,
    todayInvoices: 0,
    monthSales: 0,
    monthInvoices: 0,
  });
  const [recentInvoices, setRecentInvoices] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!supabase) {
        setLoading(false);
        return;
      }

      // Format today's date string YYYY-MM-DD
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const startOfMonthStr = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split('T')[0];

      // Fetch all invoices to compute metrics
      const { data: invoices, error: invError } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (invError) throw invError;

      const all = invoices || [];

      // Calculate stats
      let todaySales = 0;
      let todayCount = 0;
      let monthSales = 0;
      let monthCount = 0;

      all.forEach((inv) => {
        const invDate = inv.invoice_date;
        const total = Number(inv.grand_total) || 0;

        if (invDate === todayStr) {
          todaySales += total;
          todayCount += 1;
        }

        if (invDate >= startOfMonthStr && invDate <= todayStr) {
          monthSales += total;
          monthCount += 1;
        }
      });

      setStats({
        todaySales,
        todayInvoices: todayCount,
        monthSales,
        monthInvoices: monthCount,
      });

      setRecentInvoices(all.slice(0, 5));
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Unable to load dashboard overview. Please refresh or try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#222222]">
            Overview Dashboard
          </h1>
          <p className="text-sm text-[#6B7280] mt-0.5">
            Quick sales and billing summary for Wandoor Paper Mart
          </p>
        </div>

        <div className="flex items-center justify-end w-full sm:w-auto">
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

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Today's Sales"
          value={formatCurrency(stats.todaySales)}
          subtext="Revenue generated today"
          icon={IndianRupee}
          loading={loading}
        />
        <StatCard
          label="Today's Invoices"
          value={stats.todayInvoices}
          subtext="Bills issued today"
          icon={Clock}
          loading={loading}
        />
        <StatCard
          label="This Month's Sales"
          value={formatCurrency(stats.monthSales)}
          subtext="Total monthly turnover"
          icon={IndianRupee}
          loading={loading}
        />
        <StatCard
          label="This Month's Invoices"
          value={stats.monthInvoices}
          subtext="Total bills this month"
          icon={Calendar}
          loading={loading}
        />
      </div>

      {/* Recent Invoices Section */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ReceiptText size={18} className="text-[#358FFF]" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-[#222222]">
              Recent Invoices
            </h2>
          </div>

          <Button
            variant="ghost"
            size="compact"
            icon={ArrowRight}
            iconPosition="right"
            onClick={() => navigate('/invoices')}
          >
            View All Invoices
          </Button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-[#6B7280]">
            <div className="w-6 h-6 border-2 border-[#358FFF] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading recent invoices...
          </div>
        ) : recentInvoices.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={ReceiptText}
              title="No invoices yet"
              description="Create your first invoice to begin recording school and office stationery sales."
              actionLabel="Create Invoice"
              actionIcon={Plus}
              onAction={() => navigate('/invoices/new')}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm" aria-label="Recent invoices list">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-gray-50/50 text-[#6B7280] text-xs font-semibold uppercase tracking-wider">
                  <th scope="col" className="px-6 py-3">Invoice Number</th>
                  <th scope="col" className="px-6 py-3">Customer</th>
                  <th scope="col" className="px-6 py-3">Date</th>
                  <th scope="col" className="px-6 py-3 text-right">Amount</th>
                  <th scope="col" className="px-6 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {recentInvoices.map((inv) => {
                  const isDraft = inv.status === 'draft';
                  return (
                    <tr
                      key={inv.id}
                      onClick={() => navigate(`/invoices/${inv.id}`)}
                      className="hover:bg-gray-50/75 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-3.5 font-semibold text-[#222222]">
                        {inv.invoice_number}
                      </td>
                      <td className="px-6 py-3.5 text-[#222222]">
                        {inv.customer_name}
                      </td>
                      <td className="px-6 py-3.5 text-[#6B7280]">
                        {formatDate(inv.invoice_date)}
                      </td>
                      <td className="px-6 py-3.5 text-right font-semibold text-[#222222]">
                        {formatCurrency(inv.grand_total)}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <Badge variant={isDraft ? 'draft' : 'paid'}>
                          {isDraft ? 'Draft' : 'Final'}
                        </Badge>
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
