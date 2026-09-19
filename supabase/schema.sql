-- ==============================================================================
-- Wandoor Paper Mart - Supabase Database Schema (Phase 1)
-- ==============================================================================

-- 1. Business Settings Table
CREATE TABLE IF NOT EXISTS public.business_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL DEFAULT 'Wandoor Paper Mart',
  address TEXT,
  gst_no TEXT,
  mobile TEXT,
  bank_name TEXT,
  bank_branch TEXT,
  account_number TEXT,
  ifsc_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Items Table (Stationery products)
CREATE TABLE IF NOT EXISTS public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  hsn_code TEXT,
  uom TEXT NOT NULL DEFAULT 'PCS',
  unit_rate NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  gst_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Customers Table (Phase 2 preparation)
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  mobile TEXT,
  gst_no TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Sequential Invoice Number Generator (Database-level, concurrency safe)
CREATE SEQUENCE IF NOT EXISTS public.invoice_number_seq START WITH 1001;

CREATE OR REPLACE FUNCTION public.get_next_invoice_number()
RETURNS TEXT AS $$
DECLARE
  next_val BIGINT;
BEGIN
  next_val := nextval('public.invoice_number_seq');
  RETURN 'WPM-' || LPAD(next_val::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- 5. Invoices Table
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE DEFAULT public.get_next_invoice_number(),
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_address TEXT,
  customer_mobile TEXT,
  customer_gst_no TEXT,
  taxable_value NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  total_cgst NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  total_sgst NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  grand_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'issued',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Invoice Items Table (Historical Snapshot)
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.items(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  hsn_code TEXT,
  qty NUMERIC(12, 2) NOT NULL DEFAULT 1.00,
  uom TEXT NOT NULL DEFAULT 'PCS',
  unit_rate NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  gst_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  cgst_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  sgst_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  taxable_value NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  cgst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  sgst_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Updated At Trigger Function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach updated_at triggers
DROP TRIGGER IF EXISTS set_business_settings_updated_at ON public.business_settings;
CREATE TRIGGER set_business_settings_updated_at
  BEFORE UPDATE ON public.business_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_items_updated_at ON public.items;
CREATE TRIGGER set_items_updated_at
  BEFORE UPDATE ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_customers_updated_at ON public.customers;
CREATE TRIGGER set_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_invoices_updated_at ON public.invoices;
CREATE TRIGGER set_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 8. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_items_name ON public.items(name);
CREATE INDEX IF NOT EXISTS idx_items_is_active ON public.items(is_active);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON public.invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON public.invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);

-- 9. Row Level Security (RLS)
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated full access to business_settings" ON public.business_settings;
DROP POLICY IF EXISTS "Allow authenticated full access to items" ON public.items;
DROP POLICY IF EXISTS "Allow authenticated full access to customers" ON public.customers;
DROP POLICY IF EXISTS "Allow authenticated full access to invoices" ON public.invoices;
DROP POLICY IF EXISTS "Allow authenticated full access to invoice_items" ON public.invoice_items;

-- Authenticated user policies
CREATE POLICY "Allow authenticated full access to business_settings"
  ON public.business_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated full access to items"
  ON public.items FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated full access to customers"
  ON public.customers FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated full access to invoices"
  ON public.invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated full access to invoice_items"
  ON public.invoice_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 10. Default Seed Data
INSERT INTO public.business_settings (
  business_name,
  address,
  gst_no,
  mobile,
  bank_name,
  bank_branch,
  account_number,
  ifsc_code
)
SELECT
  'Wandoor Paper Mart',
  'Main Road, Near Bus Stand, Wandoor, Malappuram, Kerala - 679328',
  '32ABCDE1234F1Z5',
  '+91 98765 43210',
  'State Bank of India',
  'Wandoor Branch',
  '384729104928',
  'SBIN0070188'
WHERE NOT EXISTS (SELECT 1 FROM public.business_settings);

-- Seed initial stationery items
INSERT INTO public.items (name, hsn_code, uom, unit_rate, gst_rate, is_active)
SELECT 'Classmate Long Notebook 172 Pgs', '4820', 'PCS', 60.00, 12.00, true
WHERE NOT EXISTS (SELECT 1 FROM public.items WHERE name = 'Classmate Long Notebook 172 Pgs');

INSERT INTO public.items (name, hsn_code, uom, unit_rate, gst_rate, is_active)
SELECT 'A4 Copier Paper 75 GSM (500 Sheets)', '4802', 'BNDL', 320.00, 12.00, true
WHERE NOT EXISTS (SELECT 1 FROM public.items WHERE name = 'A4 Copier Paper 75 GSM (500 Sheets)');

INSERT INTO public.items (name, hsn_code, uom, unit_rate, gst_rate, is_active)
SELECT 'Reynolds 045 Ball Pen (Blue)', '9608', 'PCS', 10.00, 18.00, true
WHERE NOT EXISTS (SELECT 1 FROM public.items WHERE name = 'Reynolds 045 Ball Pen (Blue)');

INSERT INTO public.items (name, hsn_code, uom, unit_rate, gst_rate, is_active)
SELECT 'Kangaro Stapler No. 10', '8205', 'PCS', 85.00, 18.00, true
WHERE NOT EXISTS (SELECT 1 FROM public.items WHERE name = 'Kangaro Stapler No. 10');

INSERT INTO public.items (name, hsn_code, uom, unit_rate, gst_rate, is_active)
SELECT 'Kangaro Stapler Pins No. 10', '8305', 'BOX', 15.00, 18.00, true
WHERE NOT EXISTS (SELECT 1 FROM public.items WHERE name = 'Kangaro Stapler Pins No. 10');

INSERT INTO public.items (name, hsn_code, uom, unit_rate, gst_rate, is_active)
SELECT 'Camlin Exam Geometry Box', '9017', 'BOX', 140.00, 18.00, true
WHERE NOT EXISTS (SELECT 1 FROM public.items WHERE name = 'Camlin Exam Geometry Box');

INSERT INTO public.items (name, hsn_code, uom, unit_rate, gst_rate, is_active)
SELECT 'Fevicol MR Squeezy Bottle 100g', '3506', 'PCS', 45.00, 18.00, true
WHERE NOT EXISTS (SELECT 1 FROM public.items WHERE name = 'Fevicol MR Squeezy Bottle 100g');

INSERT INTO public.items (name, hsn_code, uom, unit_rate, gst_rate, is_active)
SELECT 'Casio MJ-120D Plus Desktop Calculator', '8470', 'PCS', 520.00, 18.00, true
WHERE NOT EXISTS (SELECT 1 FROM public.items WHERE name = 'Casio MJ-120D Plus Desktop Calculator');

INSERT INTO public.items (name, hsn_code, uom, unit_rate, gst_rate, is_active)
SELECT 'Doms Drawing Pencil Set (10 Pcs)', '9609', 'PKT', 70.00, 12.00, true
WHERE NOT EXISTS (SELECT 1 FROM public.items WHERE name = 'Doms Drawing Pencil Set (10 Pcs)');

INSERT INTO public.items (name, hsn_code, uom, unit_rate, gst_rate, is_active)
SELECT 'Brown Wrapping Paper Sheet (70 GSM)', '4804', 'PCS', 5.00, 12.00, true
WHERE NOT EXISTS (SELECT 1 FROM public.items WHERE name = 'Brown Wrapping Paper Sheet (70 GSM)');
