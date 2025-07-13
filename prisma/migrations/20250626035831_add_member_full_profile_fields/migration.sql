-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "bairro" TEXT,
ADD COLUMN     "batizado" BOOLEAN DEFAULT false,
ADD COLUMN     "cep" TEXT,
ADD COLUMN     "complemento" TEXT,
ADD COLUMN     "dataIngresso" TIMESTAMP(3),
ADD COLUMN     "dataNascimento" TIMESTAMP(3),
ADD COLUMN     "estado" TEXT,
ADD COLUMN     "estadoCivil" TEXT,
ADD COLUMN     "municipio" TEXT,
ADD COLUMN     "numero" TEXT,
ADD COLUMN     "rua" TEXT,
ADD COLUMN     "sexo" TEXT;

-- CreateTable
CREATE TABLE "MemberIrmao" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "irmaoId" TEXT NOT NULL,

    CONSTRAINT "MemberIrmao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberPrimo" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "primoId" TEXT NOT NULL,

    CONSTRAINT "MemberPrimo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Responsavel" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "celular" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,

    CONSTRAINT "Responsavel_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MemberIrmao" ADD CONSTRAINT "MemberIrmao_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberIrmao" ADD CONSTRAINT "MemberIrmao_irmaoId_fkey" FOREIGN KEY ("irmaoId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberPrimo" ADD CONSTRAINT "MemberPrimo_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberPrimo" ADD CONSTRAINT "MemberPrimo_primoId_fkey" FOREIGN KEY ("primoId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Responsavel" ADD CONSTRAINT "Responsavel_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
