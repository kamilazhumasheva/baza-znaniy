"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { SuggestResult } from "@/lib/search";

export function SearchBar({ autoFocus = false, defaultValue = "" }: { autoFocus?: boolean; defaultValue?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<SuggestResult[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!value.trim()) return;
    const timeout = setTimeout(async () => {
      const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(value)}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions);
        setOpen(true);
      }
    }, 200);
    return () => clearTimeout(timeout);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function goToSearch(q: string) {
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim()) goToSearch(value.trim());
        }}
      >
        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 shadow-sm transition-colors focus-within:border-accent">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-muted">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            autoFocus={autoFocus}
            value={value}
            onChange={(e) => {
              const next = e.target.value;
              setValue(next);
              if (!next.trim()) setSuggestions([]);
            }}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            placeholder="Задайте вопрос или введите ключевые слова..."
            className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted"
          />
        </div>
      </form>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
          {suggestions.map((s) => (
            <li key={`${s.type}-${s.id}`}>
              <Link
                href={s.type === "MATERIAL" ? `/materials/${s.id}` : `/search?q=${encodeURIComponent(s.title)}`}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-foreground transition-colors hover:bg-surface-hover"
              >
                <span className="rounded bg-surface-hover px-1.5 py-0.5 text-xs text-muted">
                  {s.type === "MATERIAL" ? "материал" : "вопрос"}
                </span>
                <span className="truncate">{s.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
