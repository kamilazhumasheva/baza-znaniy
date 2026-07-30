"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

// Гостевой вход только для тестовых окружений: одним кликом заходит под
// сидовым сотрудником. Включается переменной ENABLE_GUEST_LOGIN — на сервере
// компании эту переменную задавать не нужно, и кнопка не появится вовсе.
export function GuestLoginButton() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGuestLogin() {
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      email: "employee@company.local",
      password: "ChangeMe123!",
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Гостевой доступ временно недоступен");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-2">
      <div className="flex w-full items-center gap-3 text-xs text-muted">
        <div className="h-px flex-1 bg-border" />
        или
        <div className="h-px flex-1 bg-border" />
      </div>
      <button
        type="button"
        onClick={handleGuestLogin}
        disabled={loading}
        className="w-full rounded-md border border-border px-4 py-2 font-medium text-foreground transition-colors hover:bg-surface-hover disabled:opacity-60"
      >
        {loading ? "Вход..." : "Войти как гость (тест)"}
      </button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
