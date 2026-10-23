-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('REGULATION', 'PROVISION', 'AGREEMENT', 'NOTIFICATION', 'INSTRUCTION', 'PROPOSAL', 'CONTRACT', 'MANUAL', 'OTHER');

-- CreateEnum
CREATE TYPE "CaseType" AS ENUM ('COMMERCIAL', 'CIVIL', 'CRIMINAL', 'ADMINISTRATIVE', 'OTHER');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('FIRST_INSTANCE', 'APPEAL', 'SUPREME', 'CLOSED', 'RESOLVED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'CREATE_LEGAL_DOCUMENT';
ALTER TYPE "AuditAction" ADD VALUE 'UPDATE_LEGAL_DOCUMENT';
ALTER TYPE "AuditAction" ADD VALUE 'DELETE_LEGAL_DOCUMENT';
ALTER TYPE "AuditAction" ADD VALUE 'CREATE_LEGAL_CASE';
ALTER TYPE "AuditAction" ADD VALUE 'UPDATE_LEGAL_CASE';
ALTER TYPE "AuditAction" ADD VALUE 'DELETE_LEGAL_CASE';

-- CreateTable
CREATE TABLE "departments" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_documents" (
    "id" UUID NOT NULL,
    "doc_title" TEXT NOT NULL,
    "doc_type" "DocumentType" NOT NULL,
    "issue_year" INTEGER NOT NULL,
    "doc_number_date" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'ACTIVE',
    "responsible_person" TEXT,
    "department_id" UUID NOT NULL,
    "purpose" TEXT,
    "external_url" TEXT,
    "created_by_id" UUID,
    "updated_by_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "legal_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_attachments" (
    "id" UUID NOT NULL,
    "legal_document_id" UUID NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_type" TEXT,
    "file_size" INTEGER,
    "uploaded_by_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "document_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_cases" (
    "internal_id" UUID NOT NULL,
    "id" TEXT NOT NULL,
    "defendant" TEXT NOT NULL,
    "allegation" TEXT,
    "department_id" UUID,
    "department_action" TEXT,
    "case_type" "CaseType" NOT NULL,
    "damage_lak" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "damage_usd" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "fine_lak" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "fine_usd" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "total_due_lak" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "total_due_usd" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "dispute_status" "DisputeStatus" NOT NULL DEFAULT 'FIRST_INSTANCE',
    "recovered_lak" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "recovered_usd" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "date" DATE NOT NULL,
    "dispute_progress" TEXT,
    "external_url" TEXT,
    "created_by_id" UUID,
    "updated_by_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "legal_cases_pkey" PRIMARY KEY ("internal_id")
);

-- CreateTable
CREATE TABLE "case_attachments" (
    "id" UUID NOT NULL,
    "legal_case_id" UUID NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_type" TEXT,
    "file_size" INTEGER,
    "uploaded_by_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "case_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- CreateIndex
CREATE INDEX "legal_documents_doc_title_idx" ON "legal_documents"("doc_title");

-- CreateIndex
CREATE INDEX "legal_documents_doc_number_date_idx" ON "legal_documents"("doc_number_date");

-- CreateIndex
CREATE INDEX "legal_documents_doc_type_idx" ON "legal_documents"("doc_type");

-- CreateIndex
CREATE INDEX "legal_documents_status_idx" ON "legal_documents"("status");

-- CreateIndex
CREATE INDEX "legal_documents_issue_year_idx" ON "legal_documents"("issue_year");

-- CreateIndex
CREATE INDEX "legal_documents_department_id_idx" ON "legal_documents"("department_id");

-- CreateIndex
CREATE INDEX "legal_documents_deleted_at_idx" ON "legal_documents"("deleted_at");

-- CreateIndex
CREATE INDEX "document_attachments_legal_document_id_idx" ON "document_attachments"("legal_document_id");

-- CreateIndex
CREATE UNIQUE INDEX "legal_cases_id_key" ON "legal_cases"("id");

-- CreateIndex
CREATE INDEX "legal_cases_id_idx" ON "legal_cases"("id");

-- CreateIndex
CREATE INDEX "legal_cases_defendant_idx" ON "legal_cases"("defendant");

-- CreateIndex
CREATE INDEX "legal_cases_case_type_idx" ON "legal_cases"("case_type");

-- CreateIndex
CREATE INDEX "legal_cases_dispute_status_idx" ON "legal_cases"("dispute_status");

-- CreateIndex
CREATE INDEX "legal_cases_date_idx" ON "legal_cases"("date");

-- CreateIndex
CREATE INDEX "legal_cases_department_id_idx" ON "legal_cases"("department_id");

-- CreateIndex
CREATE INDEX "legal_cases_deleted_at_idx" ON "legal_cases"("deleted_at");

-- CreateIndex
CREATE INDEX "case_attachments_legal_case_id_idx" ON "case_attachments"("legal_case_id");

-- AddForeignKey
ALTER TABLE "legal_documents" ADD CONSTRAINT "legal_documents_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_documents" ADD CONSTRAINT "legal_documents_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_documents" ADD CONSTRAINT "legal_documents_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_attachments" ADD CONSTRAINT "document_attachments_legal_document_id_fkey" FOREIGN KEY ("legal_document_id") REFERENCES "legal_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_attachments" ADD CONSTRAINT "document_attachments_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_cases" ADD CONSTRAINT "legal_cases_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_cases" ADD CONSTRAINT "legal_cases_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_cases" ADD CONSTRAINT "legal_cases_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_attachments" ADD CONSTRAINT "case_attachments_legal_case_id_fkey" FOREIGN KEY ("legal_case_id") REFERENCES "legal_cases"("internal_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_attachments" ADD CONSTRAINT "case_attachments_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
