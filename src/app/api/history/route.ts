import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/rbac";

export async function GET() {
  const guard = await requireAuth();
  if (guard.error) return guard.error;

  const history = await prisma.viewHistory.findMany({
    where: { userId: guard.session.user.id },
    include: {
      material: { include: { category: true } },
      faq: { include: { category: true } },
    },
    orderBy: { viewedAt: "desc" },
    take: 50,
  });

  return NextResponse.json(history);
}
