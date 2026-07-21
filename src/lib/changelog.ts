import { prisma } from "@/lib/db";
import type { ChangeAction } from "@prisma/client";

export async function logChange(params: {
  entityType: string;
  entityId: string;
  userId: string;
  action: ChangeAction;
  documentId?: string;
  details?: string;
}) {
  await prisma.changeLog.create({
    data: {
      entityType: params.entityType,
      entityId: params.entityId,
      userId: params.userId,
      action: params.action,
      documentId: params.documentId,
      details: params.details,
    },
  });
}
