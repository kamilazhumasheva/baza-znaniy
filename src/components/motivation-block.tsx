"use client";

import { useEffect, useRef, useState } from "react";
import { MOTIVATION_QUOTES, THEME_LABELS } from "@/lib/motivation";

/**
 * Мотивационная фраза на главной. Стартовый индекс приходит с сервера —
 * так при каждом заходе фраза новая, и при этом нет расхождения между
 * серверной и клиентской разметкой (случайный выбор прямо в компоненте
 * дал бы ошибку гидратации).
 */
export function MotivationBlock({ startIndex }: { startIndex: number }) {
  const [index, setIndex] = useState(startIndex % MOTIVATION_QUOTES.length);
  const [visible, setVisible] = useState(true);

  const swapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      // Сначала гасим текущую фразу, затем подменяем текст — иначе
      // переход выглядел бы как резкая подмена букв.
      setVisible(false);
      swapTimer.current = setTimeout(() => {
        setIndex((prev) => (prev + 1) % MOTIVATION_QUOTES.length);
        setVisible(true);
      }, 450);
    }, 9000);

    return () => {
      clearInterval(interval);
      if (swapTimer.current) clearTimeout(swapTimer.current);
    };
  }, []);

  const quote = MOTIVATION_QUOTES[index];

  return (
    <section className="relative overflow-hidden rounded-xl border border-border bg-surface px-6 py-8">
      {/* мягкое свечение на фоне */}
      <div className="motivation-glow pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />

      <div
        key={index}
        className={`relative flex flex-col items-center gap-3 text-center transition-all duration-500 ${
          visible ? "motivation-enter opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
          {THEME_LABELS[quote.theme]}
        </span>

        <p className="max-w-2xl text-lg font-medium leading-relaxed text-foreground sm:text-xl">
          {quote.text}
        </p>

        {quote.author && <p className="text-sm text-muted">— {quote.author}</p>}
      </div>
    </section>
  );
}
