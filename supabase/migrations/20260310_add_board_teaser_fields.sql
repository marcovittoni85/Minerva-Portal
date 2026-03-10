-- Add board teaser fields to deals table
ALTER TABLE deals ADD COLUMN IF NOT EXISTS teaser_description TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS highlights JSONB DEFAULT '[]'::jsonb;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS estimated_ev TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS is_visible_board BOOLEAN DEFAULT true;

-- Add deal_type if it doesn't already exist (some installs may already have it)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'deals' AND column_name = 'deal_type'
  ) THEN
    ALTER TABLE deals ADD COLUMN deal_type TEXT;
  END IF;
END $$;
