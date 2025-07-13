-- CreateTable
CREATE TABLE "MemberObservacao" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "categoria" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberObservacao_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MemberObservacao" ADD CONSTRAINT "MemberObservacao_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberObservacao" ADD CONSTRAINT "MemberObservacao_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
