"use client";

import { useState } from "react";
import type { Category, Document } from "@prisma/client";

type DocumentWithRelations = Document & {
  category: Category;
  uploadedBy: { name: string };
  nextVersion: Document | null;
};

async function uploadForm(url: string, form: FormData) {
  const res = await fetch(url, { method: "POST", body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Ошибка запроса: ${res.status}`);
  return data as { document: Document; materialsCount: number; faqsCount: number };
}

export function DocumentsManager({
  initialDocuments,
  categories,
}: {
  initialDocuments: DocumentWithRelations[];
  categories: Category[];
}) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setError(null);
    setMessage(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.set("title", title);
      form.set("categoryId", categoryId);
      form.set("file", file);
      const result = await uploadForm("/api/documents", form);
      const category = categories.find((c) => c.id === categoryId)!;
      setDocuments((prev) => [
        { ...result.document, category, uploadedBy: { name: "Вы" }, nextVersion: null },
        ...prev,
      ]);
      setMessage(
        `Загружено. Автоматически создано черновиков: ${result.materialsCount} материалов, ${result.faqsCount} вопросов. Проверьте их на вкладках «Материалы» / «Вопросы (FAQ)».`,
      );
      setTitle("");
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setUploading(false);
    }
  }

  async function handleNewVersion(documentId: string, versionFile: File) {
    setError(null);
    setMessage(null);
    try {
      const form = new FormData();
      form.set("file", versionFile);
      const result = await uploadForm(`/api/documents/${documentId}/versions`, form);
      setDocuments((prev) =>
        prev.map((d) => (d.id === documentId ? { ...d, nextVersion: result.document } : d)),
      );
      setMessage(
        `Новая версия загружена. Создано черновиков: ${result.materialsCount} материалов, ${result.faqsCount} вопросов.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Удалить документ?")) return;
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Не удалось удалить документ");
      }
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleUpload} className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted">Название документа</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </div>
        <div className="flex flex-wrap gap-3">
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
            <label className="text-xs text-muted">Файл (.docx, .pdf, .xlsx)</label>
            <input
              required
              type="file"
              accept=".docx,.pdf,.xlsx"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-sm text-foreground"
            />
          </div>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        {message && <p className="text-sm text-accent">{message}</p>}
        <button
          type="submit"
          disabled={uploading}
          className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {uploading ? "Загрузка и обработка..." : "Загрузить документ"}
        </button>
      </form>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-muted">
            <tr>
              <th className="px-4 py-2 font-medium">Название</th>
              <th className="px-4 py-2 font-medium">Категория</th>
              <th className="px-4 py-2 font-medium">Версия</th>
              <th className="px-4 py-2 font-medium">Загрузил</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {documents.map((d) => (
              <tr key={d.id} className="border-t border-border">
                <td className="px-4 py-2">
                  <a href={`/api/documents/${d.id}/file`} className="font-medium text-foreground hover:underline">
                    {d.title}
                  </a>
                </td>
                <td className="px-4 py-2 text-muted">{d.category.name}</td>
                <td className="px-4 py-2 text-muted">v{d.version}{d.nextVersion ? " (есть новее)" : ""}</td>
                <td className="px-4 py-2 text-muted">{d.uploadedBy.name}</td>
                <td className="px-4 py-2">
                  <div className="flex justify-end gap-3">
                    <label className="cursor-pointer text-sm text-accent hover:underline">
                      Новая версия
                      <input
                        type="file"
                        accept=".docx,.pdf,.xlsx"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleNewVersion(d.id, f);
                        }}
                      />
                    </label>
                    <button onClick={() => handleDelete(d.id)} className="text-sm text-danger hover:underline">
                      Удалить
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {documents.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted">
                  Документов нет
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
