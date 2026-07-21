"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function SearchCategoryFilter({
  categories,
}: {
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategoryId = searchParams.get("categoryId") ?? "";

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("categoryId", value);
    } else {
      params.delete("categoryId");
    }
    router.push(`/search?${params.toString()}`);
  }

  return (
    <select
      value={currentCategoryId}
      onChange={(e) => handleChange(e.target.value)}
      className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
    >
      <option value="">Все категории</option>
      {categories.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}
