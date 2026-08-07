import { NextResponse } from "next/server";
import { ZodError } from "zod";

/**
 * Ошибка, текст которой можно безопасно показать пользователю
 * (некорректная ссылка, неподдерживаемый формат файла и т.п.).
 * Всё остальное отдаётся как «внутренняя ошибка», чтобы не раскрывать детали.
 */
export class PublicError extends Error {
  constructor(
    message: string,
    readonly status = 422,
  ) {
    super(message);
  }
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof PublicError) {
    return jsonError(error.message, error.status);
  }
  if (error instanceof ZodError) {
    return jsonError(error.issues.map((i) => i.message).join("; "), 422);
  }
  console.error(error);
  return jsonError("Внутренняя ошибка сервера", 500);
}
