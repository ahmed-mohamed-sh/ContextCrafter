import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getUserOctokit } from "@/lib/github";
import { generateEmbeddings, chunkText } from "@/lib/embeddings";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ repoId: string }> },
) {
  const { repoId } = await params;
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const repo = await db.repository.findUnique({
    where: { id: repoId, userId: session.user.id },
    include: { files: { select: { id: true, path: true, extension: true } } },
  });

  if (!repo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const octokit = await getUserOctokit(session.user.id);
  const [owner, repoName] = repo.fullName.split("/");

  await db.embedding.deleteMany({ where: { repositoryId: repoId } });

  const codeExtensions = [
    "ts",
    "tsx",
    "js",
    "jsx",
    "py",
    "go",
    "rs",
    "java",
    "md",
  ];
  const relevantFiles = repo.files.filter((f) =>
    codeExtensions.includes(f.extension ?? ""),
  );

  let indexed = 0;

  const allChunks: { content: string; fileId: string; path: string }[] = [];

  for (const file of relevantFiles) {
    try {
      const { data } = await octokit.repos.getContent({
        owner,
        repo: repoName,
        path: file.path,
      });

      if (!("content" in data)) continue;

      const content = Buffer.from(data.content, "base64").toString("utf-8");
      if (!content.trim()) continue;

      const chunks = chunkText(content);
      chunks.forEach((chunk) => {
        allChunks.push({ content: chunk, fileId: file.id, path: file.path });
      });

      indexed++;
    } catch {
      continue;
    }
  }

  const batchSize = 20;
  for (let i = 0; i < allChunks.length; i += batchSize) {
    const batch = allChunks.slice(i, i + batchSize);

    try {
      const embeddings = await generateEmbeddings(batch.map((c) => c.content));

      for (let j = 0; j < batch.length; j++) {
        const chunk = batch[j];
        const embedding = embeddings[j];
        const vectorStr = `[${embedding.join(",")}]`;

        await db.$executeRaw`
          INSERT INTO "Embedding" (id, "repositoryId", "fileId", content, vector, metadata, "createdAt")
          VALUES (
            gen_random_uuid(),
            ${repoId},
            ${chunk.fileId},
            ${chunk.content},
            ${vectorStr}::vector,
            ${JSON.stringify({ path: chunk.path, type: "code" })}::jsonb,
            NOW()
          )
        `;
      }
    } catch (err) {
      console.error(`Batch ${i} failed:`, err);
      continue;
    }
  }

  await db.repository.update({
    where: { id: repoId },
    data: { aiScore: Math.min(100, 60 + indexed * 2) },
  });

  return NextResponse.json({
    indexed,
    total: relevantFiles.length,
    chunks: allChunks.length,
  });
}
