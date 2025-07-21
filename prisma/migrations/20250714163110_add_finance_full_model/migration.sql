/*
  Warnings:

  - The values [INCOME,EXPENSE] on the enum `FinanceType` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `date` to the `Finance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `responsavelId` to the `Finance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Finance` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "FinanceType_new" AS ENUM ('ENTRADA', 'SAIDA');
ALTER TABLE "Finance" ALTER COLUMN "type" TYPE "FinanceType_new" USING ("type"::text::"FinanceType_new");
ALTER TYPE "FinanceType" RENAME TO "FinanceType_old";
ALTER TYPE "FinanceType_new" RENAME TO "FinanceType";
DROP TYPE "FinanceType_old";
COMMIT;

-- AlterTable
ALTER TABLE "Finance" ADD COLUMN     "category" TEXT,
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "responsavelId" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Finance" ADD CONSTRAINT "Finance_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
