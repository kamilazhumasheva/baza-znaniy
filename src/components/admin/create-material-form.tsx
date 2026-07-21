"use client";

import { useState } from "react";
import type { Category, Material } from "@prisma/client";
import { apiRequest } from "@/lib/client-api";

export function CreateMaterialForm({
  categories,
  onCreated,
}: {
  categories: Category[];
  onCreated: (material: Material) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const created = await apiRequest<Material>("/api/materials", {
        method: "POST",
        body: JSON.stringify({ title, description, categoryId, status: "DRAFT" }),
      });
      onCreated(created);
      setTitle("");
      setDescription("");
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
      >
        + Новый материал
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted">Название</label>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted">Описание</label>
        <textarea
          required
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted">Категория</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          Создать черновик
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border border-border px-4 py-2 text-sm text-foreground hover:bg-surface-hover"
        >
          Отмена
        </button>
      </div>
    </form>
  );
}
