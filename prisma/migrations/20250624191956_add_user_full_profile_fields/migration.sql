-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bairro" TEXT,
ADD COLUMN     "celular" TEXT,
ADD COLUMN     "cep" TEXT,
ADD COLUMN     "complemento" TEXT,
ADD COLUMN     "dataIngresso" TIMESTAMP(3),
ADD COLUMN     "dataNascimento" TIMESTAMP(3),
ADD COLUMN     "estado" TEXT,
ADD COLUMN     "estadoCivil" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "municipio" TEXT,
ADD COLUMN     "numero" TEXT,
ADD COLUMN     "rua" TEXT,
ADD COLUMN     "sexo" TEXT;
