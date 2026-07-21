import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/rbac";

export async function GET() {
  const guard = await requireAuth();
  if (guard.error) return guard.error;

  const notifications = await prisma.notification.findMany({
    where: { userId: guard.session.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json(notifications);
}

export async function PATCH() {
  const guard = await requireAuth();
  if (guard.error) return guard.error;

  await prisma.notification.updateMany({
    where: { userId: guard.session.user.id, isRead: false },
    data: { isRead: true },
  });

  return new NextResponse(null, { status: 204 });
}
