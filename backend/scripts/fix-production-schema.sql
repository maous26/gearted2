-- Fix production database schema
-- Remove listingType column if it exists

DO $$
BEGIN
    -- Check if listingType column exists and drop it
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'products'
        AND column_name = 'listingType'
    ) THEN
        ALTER TABLE products DROP COLUMN "listingType";
        RAISE NOTICE 'Column listingType dropped successfully';
    ELSE
        RAISE NOTICE 'Column listingType does not exist';
    END IF;
END $$;

-- Ensure badges column is String[] type
DO $$
BEGIN
    -- Check if badges is not text[]
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'badges'
        AND data_type != 'ARRAY'
    ) THEN
        -- Convert badges to array type
        ALTER TABLE users ALTER COLUMN badges TYPE text[] USING
            CASE
                WHEN badges IS NULL OR badges = '' THEN ARRAY[]::text[]
                ELSE string_to_array(badges, ',')
            END;
        ALTER TABLE users ALTER COLUMN badges SET DEFAULT ARRAY[]::text[];
        RAISE NOTICE 'Column badges converted to text[] successfully';
    ELSE
        RAISE NOTICE 'Column badges is already text[] type';
    END IF;
END $$;
