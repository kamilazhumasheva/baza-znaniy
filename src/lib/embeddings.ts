export interface EmbeddingProvider {
  readonly dimensions: number;
  embed(text: string): Promise<number[]>;
}

// OpenAI Embeddings API. У Anthropic нет отдельного embeddings-эндпоинта,
// поэтому для векторного представления текста используется OpenAI —
// это не мешает использовать Claude для остального ИИ-пайплайна (извлечение Q&A),
// это независимые точки расширения.
class OpenAIEmbeddingProvider implements EmbeddingProvider {
  readonly dimensions = 1536; // text-embedding-3-small. При смене модели/размерности
  // нужно обновить prisma/sql/semantic-search.sql (vector(N)) и переиндексировать данные.

  constructor(
    private readonly apiKey: string,
    private readonly model: string = "text-embedding-3-small",
  ) {}

  async embed(text: string): Promise<number[]> {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: this.model, input: text.slice(0, 8000) }),
    });

    if (!res.ok) {
      throw new Error(`Embeddings API error: ${res.status} ${await res.text()}`);
    }

    const data = await res.json();
    return data.data[0].embedding as number[];
  }
}

let cachedProvider: EmbeddingProvider | null | undefined;

/**
 * Возвращает провайдер эмбеддингов, если задан EMBEDDINGS_API_KEY, иначе null.
 * Весь код семантического поиска и индексации должен явно обрабатывать null
 * (значит функциональность отключена) — это единственное условие, которое
 * нужно снять, когда появится ключ.
 */
export function getEmbeddingProvider(): EmbeddingProvider | null {
  if (cachedProvider !== undefined) return cachedProvider;

  const apiKey = process.env.EMBEDDINGS_API_KEY;
  cachedProvider = apiKey
    ? new OpenAIEmbeddingProvider(apiKey, process.env.EMBEDDINGS_MODEL)
    : null;

  return cachedProvider;
}

export function toVectorLiteral(vector: number[]): string {
  return `[${vector.join(",")}]`;
}
