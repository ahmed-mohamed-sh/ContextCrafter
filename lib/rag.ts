import { db } from "./db";
import { generateEmbedding } from "./embeddings";

export async function searchSimilar(
  repositoryId: string,
  query: string,
  limit = 5,
): Promise<
  {
    score: any;
    content: string;
    metadata: any;
  }[]
> {
  const queryEmbedding = await generateEmbedding(query);
  const vectorStr = `[${queryEmbedding.join(",")}]`;

  const results = await db.$queryRaw<
    { content: string; metadata: any; similarity: number }[]
  >`
    SELECT content, metadata, 1 - (vector <=> ${vectorStr}::vector) as similarity
    FROM "Embedding"
    WHERE "repositoryId" = ${repositoryId}
      AND vector IS NOT NULL
    ORDER BY vector <=> ${vectorStr}::vector
    LIMIT 20
  `;

  console.log(
    results.map((r) => ({
      path: r.metadata?.path,
      score: r.similarity,
      content: r.content.slice(0, 150),
    })),
  );

  return results.map((r) => ({
    score: r.similarity,
    content: r.content,
    metadata: r.metadata,
  }));
}
