import Link from "next/link";

export function MaterialCard({
  id,
  title,
  description,
  categoryName,
  publishedAt,
  pinned,
}: {
  id: string;
  title: string;
  description: string;
  categoryName: string;
  publishedAt: Date | string | null;
  pinned?: boolean;
}) {
  return (
    <Link
      href={`/materials/${id}`}
      className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-4 transition-colors hover:border-accent"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="rounded bg-surface-hover px-2 py-0.5 text-xs font-medium text-muted">
          {categoryName}
        </span>
        {pinned && (
          <span className="rounded bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
            Закреплено
          </span>
        )}
      </div>
      <h3 className="font-semibold text-foreground">{title}</h3>
      <p className="line-clamp-2 text-sm text-muted">{description}</p>
      {publishedAt && (
        <time className="text-xs text-muted">
          {new Date(publishedAt).toLocaleDateString("ru-RU")}
        </time>
      )}
    </Link>
  );
}
