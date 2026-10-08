-- ==============================================================================
-- Migration 03: Invoice Numbering Starting from 042 (Editable) & Updated Bank Details
-- ==============================================================================

-- 1. Update Sequence: start with 42 (nextval will return 42)
SELECT setval('public.final_invoice_number_seq', 42, false);

-- 2. Generator Function with 3-digit padding (042, 043... 100, 1000)
CREATE OR REPLACE FUNCTION public.get_next_final_invoice_number()
RETURNS TEXT AS $$
DECLARE
  next_val BIGINT;
BEGIN
  next_val := nextval('public.final_invoice_number_seq');
  RETURN LPAD(next_val::TEXT, GREATEST(3, LENGTH(next_val::TEXT)), '0');
END;
$$ LANGUAGE plpgsql;

-- 3. Preview Function: Predicts next number based on sequence
CREATE OR REPLACE FUNCTION public.preview_next_invoice_number()
RETURNS TEXT AS $$
DECLARE
  v_seq_val BIGINT;
  v_is_called BOOLEAN;
  v_next_val BIGINT;
BEGIN
  SELECT last_value, is_called INTO v_seq_val, v_is_called 
  FROM public.final_invoice_number_seq;

  IF NOT v_is_called THEN
    v_next_val := v_seq_val;
  ELSE
    v_next_val := v_seq_val + 1;
  END IF;

  RETURN LPAD(v_next_val::TEXT, GREATEST(3, LENGTH(v_next_val::TEXT)), '0');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 4. Update save_invoice to support custom/edited invoice numbers
CREATE OR REPLACE FUNCTION public.save_invoice(
  p_invoice JSONB,
  p_items JSONB[],
  p_finalize BOOLEAN DEFAULT false
)
RETURNS JSONB AS $$
DECLARE
  v_invoice_id UUID;
  v_invoice_number TEXT;
  v_current_status TEXT;
  v_existing public.invoices%ROWTYPE;
  v_is_updating BOOLEAN := false;
  v_saved_invoice RECORD;
  v_item JSONB;
  v_sort_order INTEGER := 0;
  v_custom_inv_number TEXT;
  
  v_customer_id UUID;
  v_customer_name TEXT;
  v_customer_address TEXT;
  v_customer_mobile TEXT;
  v_customer_gst_no TEXT;
  v_invoice_date DATE;
  v_taxable_value NUMERIC;
  v_total_cgst NUMERIC;
  v_total_sgst NUMERIC;
  v_grand_total NUMERIC;
BEGIN
  -- Check if existing invoice is being updated
  IF (p_invoice->>'id') IS NOT NULL AND (p_invoice->>'id') != '' THEN
    v_invoice_id := (p_invoice->>'id')::UUID;
    
    SELECT * INTO v_existing
    FROM public.invoices
    WHERE id = v_invoice_id;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Invoice with ID % not found.', v_invoice_id;
    END IF;
    
    v_invoice_number := v_existing.invoice_number;
    v_current_status := v_existing.status;
    v_is_updating := true;
  ELSE
    v_invoice_id := gen_random_uuid();
  END IF;

  -- Read custom invoice number if provided
  v_custom_inv_number := NULLIF(TRIM(p_invoice->>'invoice_number'), '');

  -- Determine Invoice Number and Status
  IF v_custom_inv_number IS NOT NULL THEN
    v_invoice_number := v_custom_inv_number;
    IF p_finalize OR (v_is_updating AND v_existing.status = 'final') THEN
      v_current_status := 'final';
    ELSE
      v_current_status := 'draft';
    END IF;

    -- Synchronize sequence if custom number is numeric
    IF v_custom_inv_number ~ '^[0-9]+$' THEN
      BEGIN
        IF v_custom_inv_number::BIGINT >= (SELECT last_value FROM public.final_invoice_number_seq) THEN
          PERFORM setval('public.final_invoice_number_seq', v_custom_inv_number::BIGINT, true);
        END IF;
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END;
    END IF;
  ELSIF v_is_updating AND v_existing.status = 'final' THEN
    -- Retain permanent invoice number and final status
    v_invoice_number := v_existing.invoice_number;
    v_current_status := 'final';
  ELSIF p_finalize THEN
    -- Finalizing invoice: assign permanent sequence number if not already assigned
    IF v_invoice_number IS NULL OR v_invoice_number LIKE 'DRAFT-%' THEN
      v_invoice_number := public.get_next_final_invoice_number();
    END IF;
    v_current_status := 'final';
  ELSE
    -- Draft invoice: assign temporary draft number
    IF v_invoice_number IS NULL THEN
      v_invoice_number := public.get_next_draft_invoice_number();
    END IF;
    v_current_status := 'draft';
  END IF;

  -- Verify unique invoice number across other invoices
  IF EXISTS (SELECT 1 FROM public.invoices WHERE invoice_number = v_invoice_number AND id != v_invoice_id) THEN
    RAISE EXCEPTION 'Invoice number "%" is already used by another invoice.', v_invoice_number;
  END IF;

  -- Resolve Header Values
  IF v_is_updating THEN
    v_customer_name := COALESCE(p_invoice->>'customer_name', v_existing.customer_name, 'Cash Customer');
    v_customer_address := COALESCE(p_invoice->>'customer_address', v_existing.customer_address);
    v_customer_mobile := COALESCE(p_invoice->>'customer_mobile', v_existing.customer_mobile);
    v_customer_gst_no := COALESCE(p_invoice->>'customer_gst_no', v_existing.customer_gst_no);
    v_invoice_date := COALESCE((p_invoice->>'invoice_date')::DATE, v_existing.invoice_date, CURRENT_DATE);
  ELSE
    v_customer_name := COALESCE(p_invoice->>'customer_name', 'Cash Customer');
    v_customer_address := p_invoice->>'customer_address';
    v_customer_mobile := p_invoice->>'customer_mobile';
    v_customer_gst_no := p_invoice->>'customer_gst_no';
    v_invoice_date := COALESCE((p_invoice->>'invoice_date')::DATE, CURRENT_DATE);
  END IF;

  IF (p_invoice->>'customer_id') IS NOT NULL AND (p_invoice->>'customer_id') != '' THEN
    v_customer_id := (p_invoice->>'customer_id')::UUID;
  ELSE
    v_customer_id := NULL;
  END IF;

  v_taxable_value := COALESCE((p_invoice->>'taxable_value')::NUMERIC, 0.00);
  v_total_cgst := COALESCE((p_invoice->>'total_cgst')::NUMERIC, 0.00);
  v_total_sgst := COALESCE((p_invoice->>'total_sgst')::NUMERIC, 0.00);
  v_grand_total := COALESCE((p_invoice->>'grand_total')::NUMERIC, 0.00);

  -- UPSERT Header in public.invoices
  INSERT INTO public.invoices (
    id,
    invoice_number,
    status,
    customer_id,
    customer_name,
    customer_address,
    customer_mobile,
    customer_gst_no,
    invoice_date,
    taxable_value,
    total_cgst,
    total_sgst,
    grand_total,
    created_at,
    updated_at
  ) VALUES (
    v_invoice_id,
    v_invoice_number,
    v_current_status,
    v_customer_id,
    v_customer_name,
    v_customer_address,
    v_customer_mobile,
    v_customer_gst_no,
    v_invoice_date,
    v_taxable_value,
    v_total_cgst,
    v_total_sgst,
    v_grand_total,
    COALESCE(v_existing.created_at, NOW()),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    invoice_number = EXCLUDED.invoice_number,
    status = EXCLUDED.status,
    customer_id = EXCLUDED.customer_id,
    customer_name = EXCLUDED.customer_name,
    customer_address = EXCLUDED.customer_address,
    customer_mobile = EXCLUDED.customer_mobile,
    customer_gst_no = EXCLUDED.customer_gst_no,
    invoice_date = EXCLUDED.invoice_date,
    taxable_value = EXCLUDED.taxable_value,
    total_cgst = EXCLUDED.total_cgst,
    total_sgst = EXCLUDED.total_sgst,
    grand_total = EXCLUDED.grand_total,
    updated_at = NOW();

  -- Clear existing line items if updating
  IF v_is_updating THEN
    DELETE FROM public.invoice_items WHERE invoice_id = v_invoice_id;
  END IF;

  -- Insert Line Items
  IF p_items IS NOT NULL AND array_length(p_items, 1) > 0 THEN
    FOREACH v_item IN ARRAY p_items LOOP
      v_sort_order := v_sort_order + 1;
      INSERT INTO public.invoice_items (
        id,
        invoice_id,
        item_id,
        item_name,
        hsn_code,
        qty,
        uom,
        unit_rate,
        gst_rate,
        cgst_rate,
        sgst_rate,
        taxable_value,
        cgst_amount,
        sgst_amount,
        total,
        sort_order
      ) VALUES (
        gen_random_uuid(),
        v_invoice_id,
        NULLIF(v_item->>'item_id', '')::UUID,
        COALESCE(v_item->>'item_name', 'Item ' || v_sort_order),
        v_item->>'hsn_code',
        COALESCE((v_item->>'qty')::NUMERIC, 1.00),
        COALESCE(v_item->>'uom', 'PCS'),
        COALESCE((v_item->>'unit_rate')::NUMERIC, 0.00),
        COALESCE((v_item->>'gst_rate')::NUMERIC, 0.00),
        COALESCE((v_item->>'cgst_rate')::NUMERIC, 0.00),
        COALESCE((v_item->>'sgst_rate')::NUMERIC, 0.00),
        COALESCE((v_item->>'taxable_value')::NUMERIC, 0.00),
        COALESCE((v_item->>'cgst_amount')::NUMERIC, 0.00),
        COALESCE((v_item->>'sgst_amount')::NUMERIC, 0.00),
        COALESCE((v_item->>'total')::NUMERIC, 0.00),
        v_sort_order
      );
    END LOOP;
  END IF;

  -- Return Saved Invoice
  SELECT
    i.*,
    json_agg(
      json_build_object(
        'id', it.id,
        'item_id', it.item_id,
        'item_name', it.item_name,
        'hsn_code', it.hsn_code,
        'qty', it.qty,
        'uom', it.uom,
        'unit_rate', it.unit_rate,
        'gst_rate', it.gst_rate,
        'cgst_rate', it.cgst_rate,
        'sgst_rate', it.sgst_rate,
        'taxable_value', it.taxable_value,
        'cgst_amount', it.cgst_amount,
        'sgst_amount', it.sgst_amount,
        'total', it.total,
        'sort_order', it.sort_order
      ) ORDER BY it.sort_order ASC
    ) AS items
  INTO v_saved_invoice
  FROM public.invoices i
  LEFT JOIN public.invoice_items it ON it.invoice_id = i.id
  WHERE i.id = v_invoice_id
  GROUP BY i.id;

  RETURN row_to_json(v_saved_invoice)::JSONB;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Update Bank Details in business_settings
UPDATE public.business_settings
SET
  business_name = 'Wandoor Paper Mart',
  bank_name = 'Punjab National Bank',
  bank_branch = 'Wandoor Branch',
  account_number = '4363008700003408',
  ifsc_code = 'PUNB0436300',
  updated_at = NOW();

-- Insert if no business_settings exists
INSERT INTO public.business_settings (
  business_name,
  bank_name,
  bank_branch,
  account_number,
  ifsc_code
)
SELECT
  'Wandoor Paper Mart',
  'Punjab National Bank',
  'Wandoor Branch',
  '4363008700003408',
  'PUNB0436300'
WHERE NOT EXISTS (SELECT 1 FROM public.business_settings);
