-- AlterTable
ALTER TABLE "Faq" ADD COLUMN     "wrongOptions" TEXT[] DEFAULT ARRAY[]::TEXT[];
