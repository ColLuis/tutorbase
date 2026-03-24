-- supabase/migrations/002_invoice_receipt_functions.sql
-- DB functions for invoice and receipt number generation using sequences

-- Receipt number sequence (race-condition-safe, mirrors invoice_number_seq pattern)
CREATE SEQUENCE IF NOT EXISTS receipt_number_seq START 1;

-- get_next_invoice_number: atomically generates the next invoice number
-- Returns: 'INV-0001', 'INV-0002', etc.
CREATE OR REPLACE FUNCTION get_next_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  seq_val BIGINT;
BEGIN
  seq_val := nextval('invoice_number_seq');
  RETURN 'INV-' || LPAD(seq_val::TEXT, 4, '0');
END;
$$;

-- get_next_receipt_number: atomically generates the next receipt number
-- Returns: 'REC-0001', 'REC-0002', etc.
CREATE OR REPLACE FUNCTION get_next_receipt_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  seq_val BIGINT;
BEGIN
  seq_val := nextval('receipt_number_seq');
  RETURN 'REC-' || LPAD(seq_val::TEXT, 4, '0');
END;
$$;
