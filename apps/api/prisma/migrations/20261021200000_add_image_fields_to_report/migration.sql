-- Add imageUrl and imageKey to Report, preserving all existing reports.
-- Both columns are nullable so existing reports remain valid.
ALTER TABLE "Report" ADD COLUMN "imageUrl" TEXT;
ALTER TABLE "Report" ADD COLUMN "imageKey" TEXT;

-- Create index on imageKey for potential cleanup queries
CREATE INDEX "Report_imageKey_idx" ON "Report"("imageKey");
