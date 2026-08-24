-- ================================================================
-- PERDINA MIGRATION v5.4
-- CRM + Activity improvements for v14
-- ================================================================
-- SAFE   : Idempotent — uses DO $$ IF NOT EXISTS $$ blocks
-- PURPOSE: Supports v14 features:
--          - lead_stage on customers table
--          - last_interaction_date / summary / type on customers
--          - activity edit (no schema change needed)
-- RULES  : No data deleted. No existing columns modified.
-- ================================================================

BEGIN;

-- ── 1. customers: lead_stage ──────────────────────────────────────
-- Tracks the pipeline stage for Lead/Prospect customers.
-- Valid values: Listing, Reaching, Follow Up, Negotiating,
--               Pricing, Closing, Converted to Active
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='customers' AND column_name='lead_stage') THEN
    ALTER TABLE customers ADD COLUMN lead_stage TEXT;
    RAISE NOTICE 'Added customers.lead_stage';
  END IF;
END$$;

-- ── 2. customers: last_interaction_date ──────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='customers' AND column_name='last_interaction_date') THEN
    ALTER TABLE customers ADD COLUMN last_interaction_date DATE;
    RAISE NOTICE 'Added customers.last_interaction_date';
  END IF;
END$$;

-- ── 3. customers: last_interaction_type ──────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='customers' AND column_name='last_interaction_type') THEN
    ALTER TABLE customers ADD COLUMN last_interaction_type TEXT;
    RAISE NOTICE 'Added customers.last_interaction_type';
  END IF;
END$$;

-- ── 4. customers: last_interaction_summary ───────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='customers' AND column_name='last_interaction_summary') THEN
    ALTER TABLE customers ADD COLUMN last_interaction_summary TEXT;
    RAISE NOTICE 'Added customers.last_interaction_summary';
  END IF;
END$$;

-- ── 5. activities: ensure updated_at exists ───────────────────────
-- Needed for edit tracking
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name='activities' AND column_name='updated_at') THEN
    ALTER TABLE activities ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    RAISE NOTICE 'Added activities.updated_at';
  END IF;
END$$;

-- ── 6. Performance indexes ────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_customers_lead_stage ON customers (lead_stage);
CREATE INDEX IF NOT EXISTS idx_customers_status     ON customers (status);
CREATE INDEX IF NOT EXISTS idx_activities_date      ON activities (activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_activities_customer  ON activities (customer_name);

COMMIT;

-- ================================================================
-- VERIFICATION:
-- ================================================================
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'customers'
-- ORDER BY ordinal_position;
--
-- Expected new columns:
--   lead_stage                | text
--   last_interaction_date     | date
--   last_interaction_type     | text
--   last_interaction_summary  | text
-- ================================================================
-- NOTE on last_interaction:
--   The frontend (v14) computes last interaction dynamically from
--   allActivities in JavaScript — no DB write needed for display.
--   These columns are available for future server-side sync.
-- ================================================================
