-- DropForeignKey
ALTER TABLE "SmallGroupLeader" DROP CONSTRAINT "SmallGroupLeader_smallGroupId_fkey";

-- DropForeignKey
ALTER TABLE "SmallGroupMeeting" DROP CONSTRAINT "SmallGroupMeeting_smallGroupId_fkey";

-- DropForeignKey
ALTER TABLE "SmallGroupMember" DROP CONSTRAINT "SmallGroupMember_smallGroupId_fkey";

-- AddForeignKey
ALTER TABLE "SmallGroupLeader" ADD CONSTRAINT "SmallGroupLeader_smallGroupId_fkey" FOREIGN KEY ("smallGroupId") REFERENCES "SmallGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmallGroupMember" ADD CONSTRAINT "SmallGroupMember_smallGroupId_fkey" FOREIGN KEY ("smallGroupId") REFERENCES "SmallGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SmallGroupMeeting" ADD CONSTRAINT "SmallGroupMeeting_smallGroupId_fkey" FOREIGN KEY ("smallGroupId") REFERENCES "SmallGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
