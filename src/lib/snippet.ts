const MAX_MATCHED_LINES = 3;

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/**
 * Грубая нормализация под русскую морфологию: у длинных слов отбрасываем
 * окончание, чтобы «роуминга» находил строку со словом «роуминг».
 * Чем длиннее слово, тем безопаснее отрезать больше — у коротких слов обрезка
 * даёт ложные совпадения («Optima» → «opti» нашло бы и «option»).
 * Полноценная лемматизация здесь не нужна — это только выбор строки для показа,
 * ранжирование делает Postgres (to_tsvector со словарём).
 */
function needleFor(term: string): string {
  if (term.length >= 8) return term.slice(0, term.length - 2);
  if (term.length >= 6) return term.slice(0, term.length - 1);
  return term;
}

export function queryNeedles(query: string): string[] {
  const terms = query
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length >= 2)
    .map(needleFor);

  return [...new Set(terms)];
}

function firstMatchIndex(line: string, needles: string[]): number {
  const lower = line.toLowerCase();
  let best = -1;

  for (const needle of needles) {
    const index = lower.indexOf(needle);
    if (index !== -1 && (best === -1 || index < best)) best = index;
  }

  return best;
}

/** Окно текста вокруг найденного слова — для длинных строк без переносов. */
function windowAround(line: string, matchIndex: number, maxLength: number): string {
  const lead = Math.floor(maxLength / 3);
  const start = Math.max(0, matchIndex - lead);
  const end = Math.min(line.length, start + maxLength);

  let fragment = line.slice(start, end).trim();
  if (start > 0) fragment = `…${fragment}`;
  if (end < line.length) fragment = `${fragment}…`;

  return fragment;
}

/**
 * Выдержка из текста для страницы результатов: показываем именно те строки,
 * в которых встретилось искомое слово, а не начало документа. Для материалов
 * из таблиц (одна строка = один вопрос/ответ) это сразу даёт готовый ответ.
 * Если совпадений в тексте нет (например, слово только в заголовке) —
 * возвращаем начало текста.
 */
export function buildSnippet(text: string, query: string, maxLength = 320): string {
  const source = (text ?? "").trim();
  if (!source) return "";

  const needles = queryNeedles(query);
  if (needles.length === 0) return truncate(source, maxLength);

  const lines = source
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const matched: string[] = [];
  for (const line of lines) {
    const index = firstMatchIndex(line, needles);
    if (index === -1) continue;

    matched.push(line.length > maxLength ? windowAround(line, index, maxLength) : line);
    if (matched.length >= MAX_MATCHED_LINES) break;
  }

  if (matched.length === 0) return truncate(source, maxLength);

  let snippet = "";
  for (const line of matched) {
    if (snippet && snippet.length + line.length + 1 > maxLength) break;
    snippet = snippet ? `${snippet}\n${line}` : line;
  }

  return snippet;
}
