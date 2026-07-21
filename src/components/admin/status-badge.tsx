import clsx from "clsx";

export function StatusBadge({ status }: { status: "DRAFT" | "PUBLISHED" }) {
  return (
    <span
      className={clsx(
        "rounded px-2 py-0.5 text-xs font-medium",
        status === "PUBLISHED" ? "bg-accent/10 text-accent" : "bg-surface-hover text-muted",
      )}
    >
      {status === "PUBLISHED" ? "Опубликовано" : "Черновик"}
    </span>
  );
}
