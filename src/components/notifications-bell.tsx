"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

interface NotificationItem {
  id: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export function NotificationsBell({ initialUnreadCount }: { initialUnreadCount: number }) {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function toggleOpen() {
    const next = !open;
    setOpen(next);
    if (next && !loaded) {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        setItems(await res.json());
        setLoaded(true);
      }
    }
    if (next && unreadCount > 0) {
      await fetch("/api/notifications", { method: "PATCH" });
      setUnreadCount(0);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        aria-label="Уведомления"
        className="relative flex h-9 w-9 items-center justify-center rounded-md border border-border text-foreground transition-colors hover:bg-surface-hover"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-medium text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1 w-80 overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted">Уведомлений нет</p>
            ) : (
              items.map((n) => (
                <Link
                  key={n.id}
                  href={n.link ?? "#"}
                  onClick={() => setOpen(false)}
                  className="flex flex-col gap-0.5 border-b border-border px-4 py-3 text-sm transition-colors last:border-0 hover:bg-surface-hover"
                >
                  <span className="text-foreground">{n.message}</span>
                  <span className="text-xs text-muted">{new Date(n.createdAt).toLocaleString("ru-RU")}</span>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
