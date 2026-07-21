"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Category, Faq } from "@prisma/client";
import { apiRequest } from "@/lib/client-api";
import { FaqRow } from "@/components/admin/faq-inline-list";

type FaqWithCategory = Faq & { category: Category };

export function AdminFaqList({
  initialFaqs,
  categories,
  initialStatus,
}: {
  initialFaqs: FaqWithCategory[];
  categories: Category[];
  initialStatus?: "DRAFT" | "PUBLISHED";
}) {
  const router = useRouter();
  const [faqs, setFaqs] = useState(initialFaqs);
  const [adding, setAdding] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const created = await apiRequest<Faq>("/api/faq", {
        method: "POST",
        body: JSON.stringify({ question, answer, categoryId, status: "DRAFT" }),
      });
      const category = categories.find((c) => c.id === categoryId)!;
      setFaqs((prev) => [{ ...created, category }, ...prev]);
      setQuestion("");
      setAnswer("");
      setAdding(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    }
  }

  function setStatusFilter(status?: "DRAFT" | "PUBLISHED") {
    router.push(status ? `/admin/faq?status=${status}` : "/admin/faq");
  }

  return (
    <div className="flex flex-col gap-6">
      {adding ? (
        <form onSubmit={handleAdd} className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
          <input
            required
            placeholder="Вопрос"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <textarea
            required
            rows={3}
            placeholder="Ответ"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-fit rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-medium text-background hover:opacity-90">
              Создать
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="w-fit rounded-md border border-border px-4 py-2 text-sm text-foreground hover:bg-surface-hover"
            >
              Отмена
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          + Новый вопрос
        </button>
      )}

      <div className="flex gap-2">
        {[
          { label: "Все", value: undefined },
          { label: "Черновики", value: "DRAFT" as const },
          { label: "Опубликованные", value: "PUBLISHED" as const },
        ].map((tab) => (
          <button
            key={tab.label}
            onClick={() => setStatusFilter(tab.value)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              initialStatus === tab.value
                ? "bg-primary text-background"
                : "border border-border text-foreground hover:bg-surface-hover"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {faqs.map((f) => (
          <div key={f.id} className="flex flex-col gap-1">
            <span className="text-xs text-muted">{f.category.name}</span>
            <FaqRow
              faq={f}
              onChange={(updated) => setFaqs((prev) => prev.map((x) => (x.id === updated.id ? { ...updated, category: x.category } : x)))}
              onDelete={(id) => setFaqs((prev) => prev.filter((x) => x.id !== id))}
            />
          </div>
        ))}
        {faqs.length === 0 && <p className="text-sm text-muted">Вопросов нет.</p>}
      </div>
    </div>
  );
}
