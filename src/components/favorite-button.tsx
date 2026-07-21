"use client";

import { useState } from "react";
import clsx from "clsx";

type Props = {
  materialId?: string;
  faqId?: string;
  initialFavorited: boolean;
  isAuthenticated: boolean;
};

export function FavoriteButton({ materialId, faqId, initialFavorited, isAuthenticated }: Props) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);

  if (!isAuthenticated) return null;

  async function toggle() {
    setLoading(true);
    try {
      if (favorited) {
        const params = new URLSearchParams();
        if (materialId) params.set("materialId", materialId);
        if (faqId) params.set("faqId", faqId);
        await fetch(`/api/favorites?${params.toString()}`, { method: "DELETE" });
        setFavorited(false);
      } else {
        await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ materialId, faqId }),
        });
        setFavorited(true);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      aria-pressed={favorited}
      aria-label={favorited ? "Убрать из избранного" : "Добавить в избранное"}
      className={clsx(
        "flex h-9 w-9 items-center justify-center rounded-md border transition-colors",
        favorited
          ? "border-accent bg-accent/10 text-accent"
          : "border-border text-muted hover:bg-surface-hover",
      )}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill={favorited ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
        <path d="M12 17.3 6.2 20.9l1.6-6.6L2.5 9.6l6.7-.6L12 2.8l2.8 6.2 6.7.6-5.3 4.7 1.6 6.6Z" />
      </svg>
    </button>
  );
}
