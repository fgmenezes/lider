-- AlterTable
ALTER TABLE "SmallGroup" ADD COLUMN     "attendanceWindowAfter" INTEGER NOT NULL DEFAULT 1440,
ADD COLUMN     "attendanceWindowBefore" INTEGER NOT NULL DEFAULT 60;

-- AlterTable
ALTER TABLE "SmallGroupMeeting" ADD COLUMN     "cancelReason" TEXT,
ADD COLUMN     "endTime" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'AGENDADA';
