-- ==============================================================================
-- Migration 02: Phase 2 Invoicing & Safe Sequential Numbering (Corrected)
-- ==============================================================================

-- 1. Sequences for Invoice Numbering
CREATE SEQUENCE IF NOT EXISTS public.final_invoice_number_seq START WITH 700;
CREATE SEQUENCE IF NOT EXISTS public.draft_invoice_seq START WITH 1;

-- 2. Generator Functions
CREATE OR REPLACE FUNCTION public.get_next_final_invoice_number()
RETURNS TEXT AS $$
DECLARE
  next_val BIGINT;
BEGIN
  next_val := nextval('public.final_invoice_number_seq');
  RETURN LPAD(next_val::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_next_draft_invoice_number()
RETURNS TEXT AS $$
DECLARE
  next_val BIGINT;
BEGIN
  next_val := nextval('public.draft_invoice_seq');
  RETURN 'DRAFT-' || LPAD(next_val::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- 3. Atomic Invoicing Function (save_invoice)
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

  -- Determine Invoice Number and Status
  IF v_is_updating AND v_existing.status = 'final' THEN
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

  -- Resolve Header Values
  IF v_is_updating THEN
    v_customer_name := COALESCE(p_invoice->>'customer_name', v_existing.customer_name, 'Cash Customer');
    v_customer_address := COALESCE(p_invoice->>'customer_address', v_existing.customer_address);
    v_customer_mobile := COALESCE(p_invoice->>'customer_mobile', v_existing.customer_mobile);
    v_customer_gst_no := COALESCE(p_invoice->>'customer_gst_no', v_existing.customer_gst_no);
    
    IF (p_invoice->>'customer_id') IS NOT NULL AND (p_invoice->>'customer_id') != '' THEN
      v_customer_id := (p_invoice->>'customer_id')::UUID;
    ELSE
      v_customer_id := v_existing.customer_id;
    END IF;

    IF (p_invoice->>'invoice_date') IS NOT NULL AND (p_invoice->>'invoice_date') != '' THEN
      v_invoice_date := (p_invoice->>'invoice_date')::DATE;
    ELSE
      v_invoice_date := v_existing.invoice_date;
    END IF;

    v_taxable_value := COALESCE((p_invoice->>'taxable_value')::NUMERIC, v_existing.taxable_value, 0.00);
    v_total_cgst := COALESCE((p_invoice->>'total_cgst')::NUMERIC, v_existing.total_cgst, 0.00);
    v_total_sgst := COALESCE((p_invoice->>'total_sgst')::NUMERIC, v_existing.total_sgst, 0.00);
    v_grand_total := COALESCE((p_invoice->>'grand_total')::NUMERIC, v_existing.grand_total, 0.00);
  ELSE
    v_customer_name := COALESCE(p_invoice->>'customer_name', 'Cash Customer');
    v_customer_address := p_invoice->>'customer_address';
    v_customer_mobile := p_invoice->>'customer_mobile';
    v_customer_gst_no := p_invoice->>'customer_gst_no';
    
    IF (p_invoice->>'customer_id') IS NOT NULL AND (p_invoice->>'customer_id') != '' THEN
      v_customer_id := (p_invoice->>'customer_id')::UUID;
    ELSE
      v_customer_id := NULL;
    END IF;

    IF (p_invoice->>'invoice_date') IS NOT NULL AND (p_invoice->>'invoice_date') != '' THEN
      v_invoice_date := (p_invoice->>'invoice_date')::DATE;
    ELSE
      v_invoice_date := CURRENT_DATE;
    END IF;

    v_taxable_value := COALESCE((p_invoice->>'taxable_value')::NUMERIC, 0.00);
    v_total_cgst := COALESCE((p_invoice->>'total_cgst')::NUMERIC, 0.00);
    v_total_sgst := COALESCE((p_invoice->>'total_sgst')::NUMERIC, 0.00);
    v_grand_total := COALESCE((p_invoice->>'grand_total')::NUMERIC, 0.00);
  END IF;

  -- Upsert Invoice Header Record
  INSERT INTO public.invoices (
    id,
    invoice_number,
    invoice_date,
    customer_id,
    customer_name,
    customer_address,
    customer_mobile,
    customer_gst_no,
    taxable_value,
    total_cgst,
    total_sgst,
    grand_total,
    status,
    created_at,
    updated_at
  ) VALUES (
    v_invoice_id,
    v_invoice_number,
    v_invoice_date,
    v_customer_id,
    v_customer_name,
    v_customer_address,
    v_customer_mobile,
    v_customer_gst_no,
    v_taxable_value,
    v_total_cgst,
    v_total_sgst,
    v_grand_total,
    v_current_status,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    invoice_number = EXCLUDED.invoice_number,
    invoice_date = EXCLUDED.invoice_date,
    customer_id = EXCLUDED.customer_id,
    customer_name = EXCLUDED.customer_name,
    customer_address = EXCLUDED.customer_address,
    customer_mobile = EXCLUDED.customer_mobile,
    customer_gst_no = EXCLUDED.customer_gst_no,
    taxable_value = EXCLUDED.taxable_value,
    total_cgst = EXCLUDED.total_cgst,
    total_sgst = EXCLUDED.total_sgst,
    grand_total = EXCLUDED.grand_total,
    status = EXCLUDED.status,
    updated_at = now();

  -- Replace Line Items only if p_items is explicitly provided
  IF p_items IS NOT NULL AND array_length(p_items, 1) > 0 THEN
    DELETE FROM public.invoice_items WHERE invoice_id = v_invoice_id;

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
        sort_order,
        created_at
      ) VALUES (
        gen_random_uuid(),
        v_invoice_id,
        CASE 
          WHEN (v_item->>'item_id') IS NOT NULL AND (v_item->>'item_id') != '' 
          THEN (v_item->>'item_id')::UUID 
          ELSE NULL 
        END,
        COALESCE(v_item->>'item_name', 'Item'),
        v_item->>'hsn_code',
        COALESCE((v_item->>'qty')::NUMERIC, 1.00),
        COALESCE(v_item->>'uom', 'PCS'),
        COALESCE((v_item->>'unit_rate')::NUMERIC, 0.00),
        COALESCE((v_item->>'gst_rate')::NUMERIC, 0.00),
        COALESCE((v_item->>'cgst_rate')::NUMERIC, (v_item->>'gst_rate')::NUMERIC / 2.0, 0.00),
        COALESCE((v_item->>'sgst_rate')::NUMERIC, (v_item->>'gst_rate')::NUMERIC / 2.0, 0.00),
        COALESCE((v_item->>'taxable_value')::NUMERIC, 0.00),
        COALESCE((v_item->>'cgst_amount')::NUMERIC, 0.00),
        COALESCE((v_item->>'sgst_amount')::NUMERIC, 0.00),
        COALESCE((v_item->>'total')::NUMERIC, 0.00),
        v_sort_order,
        now()
      );
    END LOOP;
  END IF;

  -- Return the saved invoice header as JSON
  SELECT * INTO v_saved_invoice FROM public.invoices WHERE id = v_invoice_id;
  RETURN to_jsonb(v_saved_invoice);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
