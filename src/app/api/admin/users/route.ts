import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";

export async function GET() {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, isBlocked: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}
