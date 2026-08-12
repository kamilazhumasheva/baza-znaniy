import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/rbac";
import { userCreateSchema } from "@/lib/validation";
import { handleApiError, jsonError } from "@/lib/api";
import { logChange } from "@/lib/changelog";

const PUBLIC_FIELDS = {
  id: true,
  email: true,
  name: true,
  role: true,
  isBlocked: true,
  createdAt: true,
} as const;

export async function GET() {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const users = await prisma.user.findMany({
    select: PUBLIC_FIELDS,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  try {
    const body = userCreateSchema.parse(await req.json());

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) return jsonError("Пользователь с таким логином уже существует", 409);

    const user = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
        role: body.role,
        passwordHash: await bcrypt.hash(body.password, 10),
      },
      select: PUBLIC_FIELDS,
    });

    await logChange({
      entityType: "User",
      entityId: user.id,
      userId: guard.session.user.id,
      action: "CREATE",
      details: `Создан пользователь ${user.email} (${user.role})`,
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
