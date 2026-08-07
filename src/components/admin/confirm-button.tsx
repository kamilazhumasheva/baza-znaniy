"use client";

import { useState } from "react";
import clsx from "clsx";

/**
 * Кнопка с подтверждением прямо в интерфейсе вместо системного confirm().
 * Нативные диалоги браузер может подавлять (после галочки «не показывать
 * больше диалоги на этом сайте» confirm() молча возвращает false, и кнопка
 * выглядит нерабочей), поэтому подтверждение рисуем сами.
 */
export function ConfirmButton({
  onConfirm,
  label,
  question = "Точно?",
  className,
}: {
  onConfirm: () => Promise<void> | void;
  label: string;
  question?: string;
  className?: string;
}) {
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        className={clsx("text-sm text-danger hover:underline", className)}
      >
        {label}
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <span className="text-muted">{question}</span>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await onConfirm();
          } finally {
            setBusy(false);
            setArmed(false);
          }
        }}
        className="font-medium text-danger hover:underline disabled:opacity-60"
      >
        {busy ? "Удаление..." : "Да"}
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={() => setArmed(false)}
        className="text-muted hover:underline disabled:opacity-60"
      >
        Отмена
      </button>
    </span>
  );
}
