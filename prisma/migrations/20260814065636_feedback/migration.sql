-- CreateEnum
CREATE TYPE "FeedbackKind" AS ENUM ('HELPFUL', 'NOT_HELPFUL', 'OUTDATED');

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "kind" "FeedbackKind" NOT NULL,
    "comment" TEXT,
    "materialId" TEXT,
    "faqId" TEXT,
    "userId" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Feedback_resolved_createdAt_idx" ON "Feedback"("resolved", "createdAt");

-- CreateIndex
CREATE INDEX "Feedback_materialId_idx" ON "Feedback"("materialId");

-- CreateIndex
CREATE INDEX "Feedback_faqId_idx" ON "Feedback"("faqId");

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_faqId_fkey" FOREIGN KEY ("faqId") REFERENCES "Faq"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
