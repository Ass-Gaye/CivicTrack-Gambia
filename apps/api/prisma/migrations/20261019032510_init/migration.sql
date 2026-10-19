-- CreateEnum
CREATE TYPE "ReportCategory" AS ENUM ('BLOCKED_DRAIN', 'WASTE_DISPOSAL', 'DAMAGED_ROAD', 'STREETLIGHT', 'DAMAGED_FACILITY', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "OfficerRole" AS ENUM ('ADMIN', 'OFFICER');

-- CreateTable
CREATE TABLE "Officer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "OfficerRole" NOT NULL DEFAULT 'OFFICER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Officer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "referenceCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "ReportCategory" NOT NULL,
    "location" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportStatusUpdate" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "previousStatus" "ReportStatus",
    "newStatus" "ReportStatus" NOT NULL,
    "publicNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "officerId" TEXT,

    CONSTRAINT "ReportStatusUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Officer_email_key" ON "Officer"("email");

-- CreateIndex
CREATE INDEX "Officer_email_idx" ON "Officer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Report_referenceCode_key" ON "Report"("referenceCode");

-- CreateIndex
CREATE INDEX "Report_referenceCode_idx" ON "Report"("referenceCode");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "Report"("status");

-- CreateIndex
CREATE INDEX "Report_category_idx" ON "Report"("category");

-- CreateIndex
CREATE INDEX "Report_createdAt_idx" ON "Report"("createdAt");

-- CreateIndex
CREATE INDEX "ReportStatusUpdate_reportId_idx" ON "ReportStatusUpdate"("reportId");

-- CreateIndex
CREATE INDEX "ReportStatusUpdate_createdAt_idx" ON "ReportStatusUpdate"("createdAt");

-- AddForeignKey
ALTER TABLE "ReportStatusUpdate" ADD CONSTRAINT "ReportStatusUpdate_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportStatusUpdate" ADD CONSTRAINT "ReportStatusUpdate_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "Officer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
