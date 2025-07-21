/*
  Warnings:

  - You are about to drop the column `masterId` on the `Ministry` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[id,masterMinistryId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Ministry" DROP CONSTRAINT "Ministry_masterId_fkey";

-- DropIndex
DROP INDEX "Ministry_masterId_key";

-- AlterTable
ALTER TABLE "Ministry" DROP COLUMN "masterId";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "masterMinistryId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_id_masterMinistryId_key" ON "User"("id", "masterMinistryId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_masterMinistryId_fkey" FOREIGN KEY ("masterMinistryId") REFERENCES "Ministry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
