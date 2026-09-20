import React, { useEffect, useState } from 'react';
import { Building2, Landmark, Save, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { useToast } from '../context/ToastContext';

export function Settings() {
  const toast = useToast();
  const [settingsId, setSettingsId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    business_name: '',
    address: '',
    gst_no: '',
    mobile: '',
    bank_name: '',
    bank_branch: '',
    account_number: '',
    ifsc_code: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('business_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data) {
        setSettingsId(data.id);
        setFormData({
          business_name: data.business_name || '',
          address: data.address || '',
          gst_no: data.gst_no || '',
          mobile: data.mobile || '',
          bank_name: data.bank_name || '',
          bank_branch: data.bank_branch || '',
          account_number: data.account_number || '',
          ifsc_code: data.ifsc_code || '',
        });
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Unable to load business settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.business_name.trim()) {
      setError('Business Name is required.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      if (!supabase) throw new Error('Supabase is not connected');

      let savedData;

      if (settingsId) {
        const { data, error: updateError } = await supabase
          .from('business_settings')
          .update(formData)
          .eq('id', settingsId)
          .select()
          .single();

        if (updateError) throw updateError;
        savedData = data;
      } else {
        const { data, error: insertError } = await supabase
          .from('business_settings')
          .insert([formData])
          .select()
          .single();

        if (insertError) throw insertError;
        savedData = data;
        setSettingsId(data.id);
      }

      toast.success('Business settings and bank details saved successfully.');
    } catch (err) {
      console.error('Failed to save settings:', err);
      toast.error(err.message || 'Failed to save settings. Please try again.');
      setError(err.message || 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-[#222222]">
          Business Settings
        </h1>

        <div className="flex items-center justify-end">
          <Button
            variant="secondary"
            size="iconCompact"
            onClick={fetchSettings}
            aria-label="Reload settings"
            icon={RefreshCw}
            disabled={loading || saving}
          />
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-12 text-center text-sm text-[#6B7280]">
          <div className="w-8 h-8 border-2 border-[#358FFF] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          Loading business settings...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Business Details */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-xs">
            <div className="flex items-center gap-2 pb-4 mb-5 border-b border-[#E5E7EB]">
              <Building2 size={20} className="text-[#358FFF]" aria-hidden="true" />
              <div>
                <h2 className="text-lg font-semibold text-[#222222]">
                  Business Details
                </h2>
                <p className="text-xs text-[#6B7280]">
                  Your shop name, physical location, GST identification, and contact
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="business_name"
                name="business_name"
                label="Business Name"
                value={formData.business_name}
                onChange={handleChange}
                placeholder="Wandoor Paper Mart"
                required
                className="sm:col-span-2"
              />

              <Input
                id="address"
                name="address"
                label="Address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Street address, City, District, PIN Code"
                className="sm:col-span-2"
              />

              <Input
                id="gst_no"
                name="gst_no"
                label="GST Number"
                value={formData.gst_no}
                onChange={handleChange}
                placeholder="e.g. 32ABCDE1234F1Z5"
              />

              <Input
                id="mobile"
                name="mobile"
                label="Mobile Number"
                value={formData.mobile}
                onChange={handleChange}
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          {/* Section 2: Bank Details */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 shadow-xs">
            <div className="flex items-center gap-2 pb-4 mb-5 border-b border-[#E5E7EB]">
              <Landmark size={20} className="text-[#358FFF]" aria-hidden="true" />
              <div>
                <h2 className="text-lg font-semibold text-[#222222]">
                  Bank Details
                </h2>
                <p className="text-xs text-[#6B7280]">
                  Bank account information printed on tax invoices for customer payments
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="bank_name"
                name="bank_name"
                label="Bank Name"
                value={formData.bank_name}
                onChange={handleChange}
                placeholder="e.g. State Bank of India"
              />

              <Input
                id="bank_branch"
                name="bank_branch"
                label="Branch"
                value={formData.bank_branch}
                onChange={handleChange}
                placeholder="e.g. Wandoor Branch"
              />

              <Input
                id="account_number"
                name="account_number"
                label="Account Number"
                value={formData.account_number}
                onChange={handleChange}
                placeholder="e.g. 384729104928"
              />

              <Input
                id="ifsc_code"
                name="ifsc_code"
                label="IFSC Code"
                value={formData.ifsc_code}
                onChange={handleChange}
                placeholder="e.g. SBIN0070188"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-end">
            <Button
              type="submit"
              variant="primary"
              size="large"
              icon={Save}
              loading={saving}
            >
              Save Changes
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
