-- AlterTable: Add lga and locationId to Report, preserving all existing reports.
ALTER TABLE "Report" ADD COLUMN "lga" TEXT;
ALTER TABLE "Report" ADD COLUMN "locationId" TEXT;

-- CreateIndex: Index lga for fast querying and filtering by LGA
CREATE INDEX "Report_lga_idx" ON "Report"("lga");
