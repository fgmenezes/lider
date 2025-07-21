/*
  Warnings:

  - You are about to drop the `_MemberToSmallGroup` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_MemberToSmallGroup" DROP CONSTRAINT "_MemberToSmallGroup_A_fkey";

-- DropForeignKey
ALTER TABLE "_MemberToSmallGroup" DROP CONSTRAINT "_MemberToSmallGroup_B_fkey";

-- AlterTable
ALTER TABLE "SmallGroup" ADD COLUMN     "address" TEXT,
ADD COLUMN     "dayOfWeek" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "region" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ATIVO',
ADD COLUMN     "time" TEXT;

-- DropTable
DROP TABLE "_MemberToSmallGroup";

-- CreateTable
CREATE TABLE "SmallGroupLeader" (
    "id" TEXT NOT NULL,
    "smallGroupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "since" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "until" TIMESTAMP(3),

    CONSTRAINT "SmallGroupLeader_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmallGroupMember" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "smallGroupId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "SmallGroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmallGroupAttendance" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "present" BOOLEAN NOT NULL,
    "notes" TEXT,

    CONSTRAINT "SmallGroupAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmallGroupMeeting" (
    "id" TEXT NOT NULL,
    "smallGroupId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "type" TEXT NOT NULL,
    "theme" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SmallGroupMeeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmallGroupVisitor" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "notes" TEXT,

    CONSTRAINT "SmallGroupVisitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmallGroupPrayerRequest" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "requesterName" TEXT,
    "request" TEXT NOT NULL,
    "answered" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,

    CONSTRAINT "SmallGroupPrayerRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SmallGroupMeetingNote" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "authorId" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SmallGroupMeetingNote_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SmallGroupLeader" ADD CONSTRAINT "SmallGroupLeader_smallGroupId_fkey" FOREIGN KEY ("smallGroupId") REFERENCES "SmallGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmallGroupLeader" ADD CONSTRAINT "SmallGroupLeader_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmallGroupMember" ADD CONSTRAINT "SmallGroupMember_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmallGroupMember" ADD CONSTRAINT "SmallGroupMember_smallGroupId_fkey" FOREIGN KEY ("smallGroupId") REFERENCES "SmallGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmallGroupAttendance" ADD CONSTRAINT "SmallGroupAttendance_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "SmallGroupMeeting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmallGroupAttendance" ADD CONSTRAINT "SmallGroupAttendance_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmallGroupMeeting" ADD CONSTRAINT "SmallGroupMeeting_smallGroupId_fkey" FOREIGN KEY ("smallGroupId") REFERENCES "SmallGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmallGroupVisitor" ADD CONSTRAINT "SmallGroupVisitor_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "SmallGroupMeeting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmallGroupPrayerRequest" ADD CONSTRAINT "SmallGroupPrayerRequest_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "SmallGroupMeeting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmallGroupMeetingNote" ADD CONSTRAINT "SmallGroupMeetingNote_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "SmallGroupMeeting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmallGroupMeetingNote" ADD CONSTRAINT "SmallGroupMeetingNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
