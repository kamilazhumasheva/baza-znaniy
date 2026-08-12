"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";

export function HeaderAuthControls({
  userName,
  userRole,
}: {
  userName: string | null;
  userRole: "ADMIN" | "EMPLOYEE" | null;
}) {
  // Сотрудникам вход не нужен — база открыта всем. Ссылка оставлена только
  // для администратора и оформлена неброско, чтобы её не принимали
  // за обязательный шаг перед поиском.
  if (!userName) {
    return (
      <Link
        href="/login"
        className="whitespace-nowrap text-sm text-muted transition-colors hover:text-foreground"
      >
        <span className="hidden sm:inline">Вход для администратора</span>
        <span className="sm:hidden">Вход</span>
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-sm text-muted sm:inline">
        {userName}
        {userRole === "ADMIN" && " · админ"}
      </span>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover"
      >
        Выйти
      </button>
    </div>
  );
}
