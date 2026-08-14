import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { feedbackSchema } from "@/lib/validation";
import { handleApiError, jsonError } from "@/lib/api";

/**
 * Оценка материала сотрудником. Вход не требуется: чтение базы открыто всем,
 * и если просить логин ради оценки — обратной связи просто не будет.
 * Если человек всё же вошёл, отзыв привязывается к нему.
 */
export async function POST(req: NextRequest) {
  try {
    const body = feedbackSchema.parse(await req.json());
    const session = await auth();

    // Проверяем, что материал существует и опубликован: иначе можно было бы
    // насыпать отзывов на произвольные идентификаторы.
    if (body.materialId) {
      const material = await prisma.material.findFirst({
        where: { id: body.materialId, status: "PUBLISHED" },
        select: { id: true },
      });
      if (!material) return jsonError("Материал не найден", 404);
    } else {
      const faq = await prisma.faq.findFirst({
        where: { id: body.faqId, status: "PUBLISHED" },
        select: { id: true },
      });
      if (!faq) return jsonError("Вопрос не найден", 404);
    }

    await prisma.feedback.create({
      data: {
        kind: body.kind,
        comment: body.comment || null,
        materialId: body.materialId ?? null,
        faqId: body.faqId ?? null,
        userId: session?.user?.id ?? null,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error);
  }
}
