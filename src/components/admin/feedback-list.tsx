"use client";

import { useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/client-api";

interface FeedbackRow {
  id: string;
  kind: "HELPFUL" | "NOT_HELPFUL" | "OUTDATED";
  comment: string | null;
  createdAt: string;
  authorName: string | null;
  targetTitle: string;
  materialId: string | null;
}

const KIND_LABELS: Record<FeedbackRow["kind"], string> = {
  HELPFUL: "помогло",
  NOT_HELPFUL: "не помогло",
  OUTDATED: "устарело",
};

export function FeedbackList({ initialItems }: { initialItems: FeedbackRow[] }) {
  const [items, setItems] = useState(initialItems);
  const [error, setError] = useState<string | null>(null);

  async function resolve(id: string) {
    setError(null);
    try {
      await apiRequest(`/api/admin/feedback/${id}`, { method: "PATCH" });
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    }
  }

  if (items.length === 0) {
    return <p className="text-sm text-muted">Неразобранных сообщений нет.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-sm text-danger">{error}</p>}

      {items.map((f) => (
        <div key={f.id} className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded px-2 py-0.5 text-xs font-medium ${
                f.kind === "OUTDATED" ? "bg-danger/10 text-danger" : "bg-surface-hover text-muted"
              }`}
            >
              {KIND_LABELS[f.kind]}
            </span>
            <span className="text-xs text-muted">
              {new Date(f.createdAt).toLocaleString("ru-RU")}
              {f.authorName ? ` · ${f.authorName}` : " · без входа"}
            </span>
          </div>

          {f.materialId ? (
            <Link
              href={`/admin/materials/${f.materialId}`}
              className="font-medium text-foreground hover:underline"
            >
              {f.targetTitle}
            </Link>
          ) : (
            <span className="font-medium text-foreground">{f.targetTitle}</span>
          )}

          {f.comment && <p className="text-sm text-muted">{f.comment}</p>}

          <button
            type="button"
            onClick={() => resolve(f.id)}
            className="w-fit text-sm text-accent hover:underline"
          >
            Отметить разобранным
          </button>
        </div>
      ))}
    </div>
  );
}
