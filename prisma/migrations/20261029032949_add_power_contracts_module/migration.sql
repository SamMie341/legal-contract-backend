-- CreateEnum
CREATE TYPE "PowerContractType" AS ENUM ('PURCHASE', 'SALE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'CREATE_POWER_CONTRACT';
ALTER TYPE "AuditAction" ADD VALUE 'UPDATE_POWER_CONTRACT';
ALTER TYPE "AuditAction" ADD VALUE 'DELETE_POWER_CONTRACT';
ALTER TYPE "AuditAction" ADD VALUE 'UPLOAD_POWER_ATTACHMENT';
ALTER TYPE "AuditAction" ADD VALUE 'DOWNLOAD_POWER_ATTACHMENT';
ALTER TYPE "AuditAction" ADD VALUE 'DELETE_POWER_ATTACHMENT';

-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "power_contract_id" UUID;

-- CreateTable
CREATE TABLE "power_contracts" (
    "id" UUID NOT NULL,
    "contract_type" "PowerContractType" NOT NULL,
    "contract_number" TEXT,
    "project_name" TEXT NOT NULL,
    "project_type_or_customer" TEXT NOT NULL,
    "duration_text" TEXT,
    "duration_months" INTEGER,
    "signed_date" DATE,
    "effective_date" DATE,
    "expiration_date" DATE,
    "installed_capacity" TEXT,
    "capacity_value" DECIMAL(15,2),
    "capacity_unit" TEXT DEFAULT 'MW',
    "project_location" TEXT,
    "tariff" TEXT,
    "tariff_value" DECIMAL(15,4),
    "tariff_currency" "Currency" DEFAULT 'USD',
    "additional_details" TEXT,
    "status" "ContractStatus" NOT NULL DEFAULT 'ACTIVE',
    "notify_days_before" INTEGER NOT NULL DEFAULT 60,
    "is_expiry_notified" BOOLEAN NOT NULL DEFAULT false,
    "last_notified_at" TIMESTAMPTZ,
    "created_by_id" UUID NOT NULL,
    "updated_by_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "power_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "power_contract_attachments" (
    "id" UUID NOT NULL,
    "power_contract_id" UUID NOT NULL,
    "file_name" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size" BIGINT NOT NULL,
    "checksum" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "uploaded_by_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "power_contract_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "power_contract_download_logs" (
    "id" UUID NOT NULL,
    "power_contract_id" UUID NOT NULL,
    "attachment_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "downloaded_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "power_contract_download_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "power_contract_notifications" (
    "id" UUID NOT NULL,
    "power_contract_id" UUID NOT NULL,
    "user_id" UUID,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "days_remaining" INTEGER NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMPTZ,
    "notified_date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "power_contract_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "power_contracts_contract_type_idx" ON "power_contracts"("contract_type");

-- CreateIndex
CREATE INDEX "power_contracts_contract_number_idx" ON "power_contracts"("contract_number");

-- CreateIndex
CREATE INDEX "power_contracts_project_name_idx" ON "power_contracts"("project_name");

-- CreateIndex
CREATE INDEX "power_contracts_expiration_date_status_idx" ON "power_contracts"("expiration_date", "status");

-- CreateIndex
CREATE INDEX "power_contracts_status_idx" ON "power_contracts"("status");

-- CreateIndex
CREATE INDEX "power_contracts_deleted_at_idx" ON "power_contracts"("deleted_at");

-- CreateIndex
CREATE INDEX "power_contract_attachments_power_contract_id_idx" ON "power_contract_attachments"("power_contract_id");

-- CreateIndex
CREATE INDEX "power_contract_download_logs_power_contract_id_idx" ON "power_contract_download_logs"("power_contract_id");

-- CreateIndex
CREATE INDEX "power_contract_download_logs_user_id_downloaded_at_idx" ON "power_contract_download_logs"("user_id", "downloaded_at");

-- CreateIndex
CREATE INDEX "power_contract_notifications_user_id_is_read_idx" ON "power_contract_notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "power_contract_notifications_power_contract_id_days_remaini_idx" ON "power_contract_notifications"("power_contract_id", "days_remaining");

-- CreateIndex
CREATE INDEX "audit_logs_power_contract_id_idx" ON "audit_logs"("power_contract_id");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_power_contract_id_fkey" FOREIGN KEY ("power_contract_id") REFERENCES "power_contracts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "power_contracts" ADD CONSTRAINT "power_contracts_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "power_contracts" ADD CONSTRAINT "power_contracts_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "power_contract_attachments" ADD CONSTRAINT "power_contract_attachments_power_contract_id_fkey" FOREIGN KEY ("power_contract_id") REFERENCES "power_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "power_contract_attachments" ADD CONSTRAINT "power_contract_attachments_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "power_contract_download_logs" ADD CONSTRAINT "power_contract_download_logs_power_contract_id_fkey" FOREIGN KEY ("power_contract_id") REFERENCES "power_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "power_contract_download_logs" ADD CONSTRAINT "power_contract_download_logs_attachment_id_fkey" FOREIGN KEY ("attachment_id") REFERENCES "power_contract_attachments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "power_contract_download_logs" ADD CONSTRAINT "power_contract_download_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "power_contract_notifications" ADD CONSTRAINT "power_contract_notifications_power_contract_id_fkey" FOREIGN KEY ("power_contract_id") REFERENCES "power_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "power_contract_notifications" ADD CONSTRAINT "power_contract_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
