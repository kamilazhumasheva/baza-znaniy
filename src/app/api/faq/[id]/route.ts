import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/rbac";
import { faqUpdateSchema } from "@/lib/validation";
import { handleApiError, jsonError } from "@/lib/api";
import { logChange } from "@/lib/changelog";
import { setFaqEmbedding } from "@/lib/pipeline/embedContent";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";
  const { id } = await params;

  const faq = await prisma.faq.findUnique({ where: { id }, include: { category: true } });
  if (!faq || (faq.status === "DRAFT" && !isAdmin)) {
    return jsonError("Вопрос не найден", 404);
  }

  if (session?.user) {
    await prisma.viewHistory.create({
      data: { userId: session.user.id, targetType: "FAQ", faqId: faq.id },
    });
  }

  return NextResponse.json(faq);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;
  const { id } = await params;

  try {
    const body = faqUpdateSchema.parse(await req.json());
    const existing = await prisma.faq.findUnique({ where: { id } });
    if (!existing) return jsonError("Вопрос не найден", 404);

    const becomesPublished = body.status === "PUBLISHED" && existing.status !== "PUBLISHED";

    const faq = await prisma.faq.update({ where: { id }, data: body });
    await logChange({
      entityType: "Faq",
      entityId: id,
      userId: guard.session.user.id,
      action: becomesPublished ? "PUBLISH" : "UPDATE",
    });

    if (body.question !== undefined || body.answer !== undefined) {
      await setFaqEmbedding(faq.id, `${faq.question}\n${faq.answer}`);
    }

    return NextResponse.json(faq);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;
  const { id } = await params;

  await prisma.faq.delete({ where: { id } });
  await logChange({
    entityType: "Faq",
    entityId: id,
    userId: guard.session.user.id,
    action: "DELETE",
  });
  return new NextResponse(null, { status: 204 });
}
