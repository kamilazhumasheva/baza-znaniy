"use client";

import { useEffect, useState } from "react";

type Kind = "HELPFUL" | "NOT_HELPFUL" | "OUTDATED";

/**
 * Оценка материала. Вход не нужен — база открыта всем, поэтому «уже голосовал»
 * помним в localStorage: это не защита от накрутки, а способ не показывать
 * кнопки повторно тому, кто уже ответил.
 */
export function FeedbackButtons({
  materialId,
  faqId,
}: {
  materialId?: string;
  faqId?: string;
}) {
  const storageKey = `kb-feedback:${materialId ?? faqId}`;

  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  // localStorage недоступен при серверном рендере, поэтому читаем его после
  // монтирования: иначе разметка сервера и клиента разошлись бы.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (localStorage.getItem(storageKey)) setDone(true);
  }, [storageKey]);

  async function send(kind: Kind, withComment?: string) {
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, comment: withComment, materialId, faqId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Не удалось отправить");
      }
      localStorage.setItem(storageKey, kind);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <p className="text-sm text-muted">Спасибо, ваш ответ учтён.</p>
    );
  }

  if (showComment) {
    return (
      <div className="flex flex-col gap-2">
        <label className="text-sm text-muted">Что не так? (необязательно)</label>
        <textarea
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Например: устарел тариф, изменились условия"
          className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            disabled={sending}
            onClick={() => send("OUTDATED", comment.trim() || undefined)}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-background hover:opacity-90 disabled:opacity-60"
          >
            {sending ? "Отправка..." : "Отправить"}
          </button>
          <button
            type="button"
            onClick={() => setShowComment(false)}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:bg-surface-hover"
          >
            Отмена
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm text-muted">Информация помогла?</span>
      <button
        type="button"
        disabled={sending}
        onClick={() => send("HELPFUL")}
        className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-surface-hover disabled:opacity-60"
      >
        Да
      </button>
      <button
        type="button"
        disabled={sending}
        onClick={() => send("NOT_HELPFUL")}
        className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-surface-hover disabled:opacity-60"
      >
        Нет
      </button>
      <button
        type="button"
        onClick={() => setShowComment(true)}
        className="text-sm text-muted underline-offset-2 transition-colors hover:text-danger hover:underline"
      >
        Информация устарела
      </button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
