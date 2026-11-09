-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "target_user_id" UUID;

-- CreateIndex
CREATE INDEX "audit_logs_target_user_id_idx" ON "audit_logs"("target_user_id");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
