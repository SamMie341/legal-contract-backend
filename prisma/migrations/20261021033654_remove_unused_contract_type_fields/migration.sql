/*
  Warnings:

  - You are about to drop the column `code` on the `contract_types` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `contract_types` table. All the data in the column will be lost.
  - You are about to drop the column `type_number` on the `contract_types` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name_lo]` on the table `contract_types` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "contract_types_code_key";

-- DropIndex
DROP INDEX "contract_types_type_number_key";

-- AlterTable
ALTER TABLE "contract_types" DROP COLUMN "code",
DROP COLUMN "description",
DROP COLUMN "type_number";

-- CreateIndex
CREATE UNIQUE INDEX "contract_types_name_lo_key" ON "contract_types"("name_lo");
