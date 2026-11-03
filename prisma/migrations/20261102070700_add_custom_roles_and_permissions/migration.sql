-- CreateEnum
CREATE TYPE "SystemModule" AS ENUM ('CONTRACTS', 'POWER_CONTRACTS', 'LEGAL_DOCUMENTS', 'LEGAL_CASES');

-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'CREATE_ROLE';
ALTER TYPE "AuditAction" ADD VALUE 'UPDATE_ROLE';
ALTER TYPE "AuditAction" ADD VALUE 'DELETE_ROLE';

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'DEPARTMENT_HEAD';
ALTER TYPE "UserRole" ADD VALUE 'DIVISION_HEAD';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role_id" UUID,
ALTER COLUMN "role" DROP NOT NULL;

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_module_permissions" (
    "id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "module" "SystemModule" NOT NULL,
    "can_view" BOOLEAN NOT NULL DEFAULT true,
    "can_upload" BOOLEAN NOT NULL DEFAULT false,
    "can_edit" BOOLEAN NOT NULL DEFAULT false,
    "can_delete" BOOLEAN NOT NULL DEFAULT false,
    "can_download" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "role_module_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_module_permissions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "module" "SystemModule" NOT NULL,
    "can_view" BOOLEAN NOT NULL DEFAULT true,
    "can_upload" BOOLEAN NOT NULL DEFAULT false,
    "can_edit" BOOLEAN NOT NULL DEFAULT false,
    "can_delete" BOOLEAN NOT NULL DEFAULT false,
    "can_download" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "user_module_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE INDEX "role_module_permissions_role_id_idx" ON "role_module_permissions"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "role_module_permissions_role_id_module_key" ON "role_module_permissions"("role_id", "module");

-- CreateIndex
CREATE INDEX "user_module_permissions_user_id_idx" ON "user_module_permissions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_module_permissions_user_id_module_key" ON "user_module_permissions"("user_id", "module");

-- CreateIndex
CREATE INDEX "users_role_id_idx" ON "users"("role_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_module_permissions" ADD CONSTRAINT "role_module_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_module_permissions" ADD CONSTRAINT "user_module_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
