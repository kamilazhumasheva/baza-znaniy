"use client";

import { useState } from "react";
import type { Category } from "@prisma/client";
import { apiRequest } from "@/lib/client-api";
import { slugify } from "@/lib/slug";

export function CategoryManager({ initialCategories }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [parentId, setParentId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const created = await apiRequest<Category>("/api/categories", {
        method: "POST",
        body: JSON.stringify({
          name,
          slug: slug || slugify(name),
          parentId: parentId || null,
        }),
      });
      setCategories((prev) => [...prev, created]);
      setName("");
      setSlug("");
      setParentId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Удалить категорию?")) return;
    try {
      await apiRequest(`/api/categories/${id}`, { method: "DELETE" });
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface p-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted">Название</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted">Slug (необязательно)</label>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder={name ? slugify(name) : ""}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted">Родительская категория</label>
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          >
            <option value="">Верхний уровень</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          Добавить
        </button>
      </form>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-muted">
            <tr>
              <th className="px-4 py-2 font-medium">Название</th>
              <th className="px-4 py-2 font-medium">Slug</th>
              <th className="px-4 py-2 font-medium">Родитель</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="px-4 py-2 text-foreground">{c.name}</td>
                <td className="px-4 py-2 text-muted">{c.slug}</td>
                <td className="px-4 py-2 text-muted">
                  {categories.find((p) => p.id === c.parentId)?.name ?? "—"}
                </td>
                <td className="px-4 py-2 text-right">
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="text-sm text-danger hover:underline"
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
