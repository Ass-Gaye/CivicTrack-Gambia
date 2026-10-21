-- Add street number to Report, preserving all existing reports.
-- The column is added nullable first so existing records remain valid,
-- then backfilled and constrained NOT NULL to enforce the required field.
ALTER TABLE "Report" ADD COLUMN "streetNumber" TEXT;

-- Backfill existing reports. Historical street numbers are not known, so an
-- empty string satisfies the constraint without fabricating address data.
-- New reports must provide a real street number (enforced by the API schema).
UPDATE "Report" SET "streetNumber" = '' WHERE "streetNumber" IS NULL;

ALTER TABLE "Report" ALTER COLUMN "streetNumber" SET NOT NULL;
