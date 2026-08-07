"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Category, Material } from "@prisma/client";
import { apiRequest } from "@/lib/client-api";
import { StatusBadge } from "@/components/admin/status-badge";
import { CreateMaterialForm } from "@/components/admin/create-material-form";
import { ConfirmButton } from "@/components/admin/confirm-button";

type MaterialWithCategory = Material & { category: Category };

export function AdminMaterialsList({
  initialMaterials,
  categories,
  initialStatus,
}: {
  initialMaterials: MaterialWithCategory[];
  categories: Category[];
  initialStatus?: "DRAFT" | "PUBLISHED";
}) {
  const router = useRouter();
  const [materials, setMaterials] = useState(initialMaterials);
  const [error, setError] = useState<string | null>(null);

  async function togglePublish(material: MaterialWithCategory) {
    try {
      const updated = await apiRequest<MaterialWithCategory>(`/api/materials/${material.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: material.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED" }),
      });
      setMaterials((prev) => prev.map((m) => (m.id === material.id ? { ...updated, category: material.category } : m)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      await apiRequest(`/api/materials/${id}`, { method: "DELETE" });
      setMaterials((prev) => prev.filter((m) => m.id !== id));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    }
  }

  function setStatusFilter(status?: "DRAFT" | "PUBLISHED") {
    router.push(status ? `/admin/materials?status=${status}` : "/admin/materials");
  }

  return (
    <div className="flex flex-col gap-6">
      <CreateMaterialForm
        categories={categories}
        onCreated={(m) => setMaterials((prev) => [{ ...m, category: categories.find((c) => c.id === m.categoryId)! }, ...prev])}
      />

      {error && <p className="text-sm text-danger">{error}</p>}

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

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-muted">
            <tr>
              <th className="px-4 py-2 font-medium">Название</th>
              <th className="px-4 py-2 font-medium">Категория</th>
              <th className="px-4 py-2 font-medium">Статус</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {materials.map((m) => (
              <tr key={m.id} className="border-t border-border">
                <td className="px-4 py-2">
                  <Link href={`/admin/materials/${m.id}`} className="font-medium text-foreground hover:underline">
                    {m.title}
                  </Link>
                </td>
                <td className="px-4 py-2 text-muted">{m.category.name}</td>
                <td className="px-4 py-2">
                  <StatusBadge status={m.status} />
                </td>
                <td className="px-4 py-2">
                  <div className="flex justify-end gap-3">
                    <button onClick={() => togglePublish(m)} className="text-sm text-accent hover:underline">
                      {m.status === "PUBLISHED" ? "Снять с публикации" : "Опубликовать"}
                    </button>
                    <ConfirmButton label="Удалить" onConfirm={() => handleDelete(m.id)} />
                  </div>
                </td>
              </tr>
            ))}
            {materials.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted">
                  Материалов нет
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
