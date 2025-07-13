/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Church` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Ministry" DROP CONSTRAINT "Ministry_churchId_fkey";

-- DropForeignKey
ALTER TABLE "Ministry" DROP CONSTRAINT "Ministry_masterId_fkey";

-- AlterTable
ALTER TABLE "Ministry" ALTER COLUMN "churchId" DROP NOT NULL,
ALTER COLUMN "masterId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Church_name_key" ON "Church"("name");

-- AddForeignKey
ALTER TABLE "Ministry" ADD CONSTRAINT "Ministry_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ministry" ADD CONSTRAINT "Ministry_masterId_fkey" FOREIGN KEY ("masterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
