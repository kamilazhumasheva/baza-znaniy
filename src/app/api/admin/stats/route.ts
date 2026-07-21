import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/rbac";
import { getAdminStats } from "@/lib/stats";

export async function GET() {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const stats = await getAdminStats();
  return NextResponse.json(stats);
}
