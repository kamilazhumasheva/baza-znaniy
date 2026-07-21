export function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group rounded-lg border border-border bg-surface p-4 open:bg-surface-hover">
      <summary className="cursor-pointer list-none font-medium text-foreground marker:content-none">
        <span className="flex items-center justify-between gap-2">
          {question}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="shrink-0 text-muted transition-transform group-open:rotate-180"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </summary>
      <p className="mt-3 whitespace-pre-line text-sm text-muted">{answer}</p>
    </details>
  );
}
