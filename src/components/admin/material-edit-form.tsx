"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Category, Material } from "@prisma/client";
import { apiRequest } from "@/lib/client-api";

export function MaterialEditForm({
  material,
  categories,
}: {
  material: Material;
  categories: Category[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(material.title);
  const [description, setDescription] = useState(material.description);
  const [categoryId, setCategoryId] = useState(material.categoryId);
  const [pinned, setPinned] = useState(material.pinned);
  const [isNews, setIsNews] = useState(material.isNews);
  const [status, setStatus] = useState(material.status);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await apiRequest(`/api/materials/${material.id}`, {
        method: "PATCH",
        body: JSON.stringify({ title, description, categoryId, pinned, isNews, status }),
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted">Название</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted">Описание</label>
        <textarea
          rows={8}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>
      <div className="flex flex-wrap gap-4">
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
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted">Статус</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "DRAFT" | "PUBLISHED")}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          >
            <option value="DRAFT">Черновик</option>
            <option value="PUBLISHED">Опубликовано</option>
          </select>
        </div>
        <label className="flex items-center gap-2 self-end pb-2 text-sm text-foreground">
          <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
          Закрепить на главной
        </label>
        <label className="flex items-center gap-2 self-end pb-2 text-sm text-foreground">
          <input type="checkbox" checked={isNews} onChange={(e) => setIsNews(e.target.checked)} />
          Это новость
        </label>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {saving ? "Сохранение..." : "Сохранить"}
      </button>
    </form>
  );
}
