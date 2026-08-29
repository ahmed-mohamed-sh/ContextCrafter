function hashEmbedding(text: string, dims = 384): number[] {
  const hash = new Array(dims).fill(0);
  const words = text.toLowerCase().split(/\s+/);
  words.forEach((word, wi) => {
    for (let i = 0; i < word.length; i++) {
      const idx = (word.charCodeAt(i) * 31 + wi * 17 + i * 7) % dims;
      hash[idx] += 1 / (wi + 1);
    }
  });
  const mag = Math.sqrt(hash.reduce((s, v) => s + v * v, 0));
  return mag > 0 ? hash.map((v) => v / mag) : hash;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  return hashEmbedding(text);
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  return texts.map((t) => hashEmbedding(t));
}

export function chunkText(
  text: string,
  chunkSize = 1200,
  overlap = 150,
): string[] {
  const chunks: string[] = [];
  const lines = text.split("\n");
  let current = "";
  for (const line of lines) {
    if ((current + line).length > chunkSize) {
      if (current.trim()) chunks.push(current.trim());
      const words = current.split(" ");
      current = words.slice(-overlap).join(" ") + "\n" + line;
    } else {
      current += "\n" + line;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}
