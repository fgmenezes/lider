-- AlterTable
ALTER TABLE "SmallGroupLeader" ADD COLUMN     "reason" TEXT;

-- AlterTable
ALTER TABLE "SmallGroupMember" ADD COLUMN     "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ATIVO',
ADD COLUMN     "statusChangeReason" TEXT,
ADD COLUMN     "statusChangedAt" TIMESTAMP(3);
