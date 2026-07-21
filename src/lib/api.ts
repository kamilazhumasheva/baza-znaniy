import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return jsonError(error.issues.map((i) => i.message).join("; "), 422);
  }
  console.error(error);
  return jsonError("Внутренняя ошибка сервера", 500);
}
