import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";

export const metadata = {
  title: "Вход — База знаний",
};

export default function LoginPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-xl font-semibold text-foreground">Корпоративная база знаний</h1>
        <p className="text-sm text-muted">Войдите, чтобы продолжить</p>
      </div>
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
