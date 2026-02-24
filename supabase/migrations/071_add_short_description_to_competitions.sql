-- Add short_description column to competitions table
-- This provides a brief summary for competition cards and listings

ALTER TABLE public.competitions
ADD COLUMN short_description TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.competitions.short_description IS 'Brief summary of the competition for display in cards and listings';
