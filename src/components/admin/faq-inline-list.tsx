"use client";

import { useState } from "react";
import type { Faq } from "@prisma/client";
import { apiRequest } from "@/lib/client-api";
import { StatusBadge } from "@/components/admin/status-badge";

export function FaqRow({ faq, onChange, onDelete }: { faq: Faq; onChange: (f: Faq) => void; onDelete: (id: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [question, setQuestion] = useState(faq.question);
  const [answer, setAnswer] = useState(faq.answer);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const updated = await apiRequest<Faq>(`/api/faq/${faq.id}`, {
        method: "PATCH",
        body: JSON.stringify({ question, answer }),
      });
      onChange(updated);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublish() {
    const updated = await apiRequest<Faq>(`/api/faq/${faq.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: faq.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED" }),
    });
    onChange(updated);
  }

  async function remove() {
    if (!confirm("Удалить вопрос?")) return;
    await apiRequest(`/api/faq/${faq.id}`, { method: "DELETE" });
    onDelete(faq.id);
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <textarea
          rows={3}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={saving}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-background hover:opacity-90 disabled:opacity-60"
          >
            Сохранить
          </button>
          <button
            onClick={() => setEditing(false)}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:bg-surface-hover"
          >
            Отмена
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-foreground">{faq.question}</p>
        <StatusBadge status={faq.status} />
      </div>
      <p className="text-sm text-muted">{faq.answer}</p>
      <div className="flex gap-3">
        <button onClick={() => setEditing(true)} className="text-sm text-accent hover:underline">
          Изменить
        </button>
        <button onClick={togglePublish} className="text-sm text-accent hover:underline">
          {faq.status === "PUBLISHED" ? "Снять с публикации" : "Опубликовать"}
        </button>
        <button onClick={remove} className="text-sm text-danger hover:underline">
          Удалить
        </button>
      </div>
    </div>
  );
}

export function AdminFaqInlineList({
  initialFaqs,
  categoryId,
  materialId,
}: {
  initialFaqs: Faq[];
  categoryId: string;
  materialId?: string;
}) {
  const [faqs, setFaqs] = useState(initialFaqs);
  const [adding, setAdding] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const created = await apiRequest<Faq>("/api/faq", {
        method: "POST",
        body: JSON.stringify({ question, answer, categoryId, materialId, status: "DRAFT" }),
      });
      setFaqs((prev) => [created, ...prev]);
      setQuestion("");
      setAnswer("");
      setAdding(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {faqs.map((f) => (
        <FaqRow
          key={f.id}
          faq={f}
          onChange={(updated) => setFaqs((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))}
          onDelete={(id) => setFaqs((prev) => prev.filter((x) => x.id !== id))}
        />
      ))}
      {faqs.length === 0 && <p className="text-sm text-muted">Вопросов пока нет.</p>}

      {adding ? (
        <form onSubmit={handleAdd} className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4">
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
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-background hover:opacity-90">
              Добавить
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:bg-surface-hover"
            >
              Отмена
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-fit rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:bg-surface-hover"
        >
          + Добавить вопрос
        </button>
      )}
    </div>
  );
}
