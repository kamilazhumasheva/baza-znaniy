import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";

type Role = "ADMIN" | "EMPLOYEE";

type Guard =
  | { error: NextResponse; session?: undefined }
  | { error?: undefined; session: Session };

export async function requireRole(role: Role | Role[]): Promise<Guard> {
  const session = await auth();

  if (!session?.user) {
    return { error: NextResponse.json({ error: "Не авторизован" }, { status: 401 }) };
  }

  const allowed = Array.isArray(role) ? role : [role];
  if (!allowed.includes(session.user.role)) {
    return { error: NextResponse.json({ error: "Доступ запрещён" }, { status: 403 }) };
  }

  return { session };
}

export const requireAdmin = () => requireRole("ADMIN");
export const requireAuth = () => requireRole(["ADMIN", "EMPLOYEE"]);
