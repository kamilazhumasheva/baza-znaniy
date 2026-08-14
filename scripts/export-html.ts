/**
 * Выгружает опубликованную базу знаний в один самодостаточный HTML-файл.
 *
 * Зачем: файл можно положить в общую папку или отправить сотрудникам —
 * он открывается двойным кликом, без сервера, интернета и входа.
 * Поиск внутри файла работает на месте, данные зашиты в сам файл.
 *
 * Запуск: npm run export:html
 */

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "../src/lib/db";

interface ExportItem {
  type: "material" | "faq";
  title: string;
  body: string;
  category: string;
}

/** Экранирование для вставки в текст HTML. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Экранирование JSON для вставки внутрь <script>: последовательность "</script>"
 * в данных иначе закрыла бы тег и сломала страницу.
 */
function escapeJsonForScript(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function renderPage(items: ExportItem[], categories: string[], generatedAt: string): string {
  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Быстрый помощник — база знаний</title>
<style>
  :root {
    --bg: #ffffff; --surface: #f4f6f9; --surface-hover: #eaedf3; --border: #dde2ea;
    --fg: #171a1f; --muted: #5b6472; --accent: #2f6fed;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #0b1220; --surface: #121b2e; --surface-hover: #182338; --border: #232f45;
      --fg: #e7e9ee; --muted: #97a1b3; --accent: #5b8def;
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: var(--bg); color: var(--fg);
    font-family: -apple-system, "Segoe UI", Roboto, Arial, sans-serif; line-height: 1.5;
  }
  header {
    position: sticky; top: 0; z-index: 10; background: var(--bg);
    border-bottom: 1px solid var(--border); padding: 12px 16px;
    display: flex; align-items: center; gap: 10px;
  }
  header b { font-size: 17px; }
  .wrap { max-width: 900px; margin: 0 auto; padding: 20px 16px 60px; }
  #q {
    width: 100%; padding: 14px 16px; font-size: 16px; color: var(--fg);
    background: var(--surface); border: 1px solid var(--border); border-radius: 12px; outline: none;
  }
  #q:focus { border-color: var(--accent); }
  .cats { display: flex; flex-wrap: wrap; gap: 8px; margin: 14px 0 18px; }
  .cat {
    padding: 6px 12px; font-size: 14px; cursor: pointer; color: var(--fg);
    background: var(--bg); border: 1px solid var(--border); border-radius: 999px;
  }
  .cat.on { background: var(--accent); border-color: var(--accent); color: #fff; }
  .count { color: var(--muted); font-size: 14px; margin-bottom: 12px; }
  .item {
    border: 1px solid var(--border); background: var(--surface);
    border-radius: 10px; padding: 14px 16px; margin-bottom: 10px;
  }
  .tag {
    display: inline-block; font-size: 12px; color: var(--muted);
    background: var(--surface-hover); border-radius: 6px; padding: 2px 8px; margin-bottom: 8px;
  }
  .item h3 { margin: 0 0 8px; font-size: 16px; }
  .item p { margin: 0; color: var(--muted); white-space: pre-line; font-size: 15px; }
  mark { background: #ffe58f; color: #171a1f; border-radius: 3px; padding: 0 2px; }
  .empty { color: var(--muted); padding: 30px 0; text-align: center; }
  footer { color: var(--muted); font-size: 13px; margin-top: 30px; text-align: center; }
</style>
</head>
<body>
<header>
  <svg viewBox="0 0 40 40" width="30" height="30" aria-hidden="true">
    <path d="M6 16 Q5 31 15 37 Q25 31 24 16 Z" fill="#eaeef5" stroke="#b6c1d4" stroke-width="0.9"/>
    <circle cx="15" cy="20.5" r="3.3" fill="#efac7d"/>
    <path d="M15 2 L24 14 L6 14 Z" fill="#d64545"/>
    <path d="M15 2 L19.5 8 L10.5 8 Z" fill="#e8706e"/>
    <rect x="4.5" y="13" width="21" height="3.8" rx="1.9" fill="#b83838"/>
    <line x1="27" y1="35" x2="34" y2="25" stroke="#9a6633" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M35 17 L36.6 21 L40 22.6 L36.6 24.2 L35 28 L33.4 24.2 L30 22.6 L33.4 21 Z" fill="#ffcf4d"/>
  </svg>
  <b>Быстрый помощник</b>
</header>

<div class="wrap">
  <input id="q" type="search" placeholder="Введите слово — например, тариф, роуминг, чек-лист..." autofocus>
  <div class="cats" id="cats"></div>
  <div class="count" id="count"></div>
  <div id="list"></div>
  <footer>Выгружено ${escapeHtml(generatedAt)} · всего записей: ${items.length}</footer>
</div>

<script>
const DATA = ${escapeJsonForScript(items)};
const CATEGORIES = ${escapeJsonForScript(categories)};

let activeCat = "";

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Ищем по любому из слов запроса; учитываем разные окончания, отрезая
// у длинных слов хвост — «роуминга» находит «роуминг».
function needles(query) {
  return query.toLowerCase().split(/[^\\p{L}\\p{N}]+/u)
    .filter(w => w.length >= 2)
    .map(w => (w.length >= 8 ? w.slice(0, w.length - 2) : w.length >= 6 ? w.slice(0, w.length - 1) : w));
}

function highlight(text, ns) {
  let out = esc(text);
  for (const n of ns) {
    out = out.replace(new RegExp("(" + n.replace(/[.*+?^\${}()|[\\]\\\\]/g, "\\\\$&") + "[\\\\p{L}\\\\p{N}]*)", "giu"), "<mark>$1</mark>");
  }
  return out;
}

// Показываем строки, где встретилось слово, а не начало текста целиком.
function snippet(text, ns) {
  const lines = text.split("\\n").map(l => l.trim()).filter(Boolean);
  const hit = lines.filter(l => ns.some(n => l.toLowerCase().includes(n))).slice(0, 3);
  const chosen = hit.length ? hit.join("\\n") : text;
  return chosen.length > 400 ? chosen.slice(0, 399) + "…" : chosen;
}

function render() {
  const query = document.getElementById("q").value.trim();
  const ns = needles(query);

  let found = DATA;
  if (activeCat) found = found.filter(d => d.category === activeCat);
  if (ns.length) {
    found = found.filter(d => {
      const hay = (d.title + " " + d.body).toLowerCase();
      return ns.some(n => hay.includes(n));
    });
  }

  document.getElementById("count").textContent =
    query || activeCat ? "Найдено: " + found.length : "Всего записей: " + found.length;

  document.getElementById("list").innerHTML = found.length
    ? found.slice(0, 300).map(d =>
        '<div class="item"><span class="tag">' + esc(d.category) + '</span>' +
        '<h3>' + (ns.length ? highlight(d.title, ns) : esc(d.title)) + '</h3>' +
        '<p>' + (ns.length ? highlight(snippet(d.body, ns), ns) : esc(snippet(d.body, ns))) + '</p></div>'
      ).join("")
    : '<div class="empty">Ничего не найдено. Попробуйте другое слово.</div>';
}

document.getElementById("cats").innerHTML =
  ['<button class="cat on" data-c="">Все</button>']
    .concat(CATEGORIES.map(c => '<button class="cat" data-c="' + esc(c) + '">' + esc(c) + '</button>'))
    .join("");

document.getElementById("cats").addEventListener("click", e => {
  const btn = e.target.closest(".cat");
  if (!btn) return;
  activeCat = btn.dataset.c;
  document.querySelectorAll(".cat").forEach(b => b.classList.toggle("on", b === btn));
  render();
});

document.getElementById("q").addEventListener("input", render);
render();
</script>
</body>
</html>`;
}

async function main() {
  const [materials, faqs] = await Promise.all([
    prisma.material.findMany({
      where: { status: "PUBLISHED" },
      include: { category: true },
      orderBy: { title: "asc" },
    }),
    prisma.faq.findMany({
      where: { status: "PUBLISHED" },
      include: { category: true },
      orderBy: { question: "asc" },
    }),
  ]);

  const items: ExportItem[] = [
    ...materials.map((m) => ({
      type: "material" as const,
      title: m.title,
      body: m.description,
      category: m.category.name,
    })),
    ...faqs.map((f) => ({
      type: "faq" as const,
      title: f.question,
      body: f.answer,
      category: f.category.name,
    })),
  ];

  const categories = [...new Set(items.map((i) => i.category))].sort((a, b) =>
    a.localeCompare(b, "ru"),
  );

  const generatedAt = new Date().toLocaleString("ru-RU");
  const html = renderPage(items, categories, generatedAt);

  const outDir = path.join(process.cwd(), "export");
  await mkdir(outDir, { recursive: true });
  const outFile = path.join(outDir, "bystryy-pomoshchnik.html");
  await writeFile(outFile, html, "utf8");

  console.log(`Готово: ${outFile}`);
  console.log(`Материалов: ${materials.length}, вопросов: ${faqs.length}, категорий: ${categories.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
