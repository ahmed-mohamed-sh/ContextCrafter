import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { generateAICompletion } from "@/lib/ai";
import { searchSimilar } from "@/lib/rag";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ repoId: string }> },
) {
  const { repoId } = await params;
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  const messages = await db.message.findMany({
    where: { chatSessionId: sessionId! },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ messages });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ repoId: string }> },
) {
  const { repoId } = await params;
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { message, sessionId, history } = await req.json();

  const repo = await db.repository.findUnique({
    where: { id: repoId, userId: session.user.id },
    include: {
      files: {
        select: { path: true, language: true },
        orderBy: { path: "asc" },
      },
    },
  });

  if (!repo)
    return NextResponse.json({ error: "Repo not found" }, { status: 404 });

  let currentSessionId = sessionId;
  if (!currentSessionId) {
    const newSession = await db.chatSession.create({
      data: {
        userId: session.user.id,
        repositoryId: repoId,
        title: message.slice(0, 50),
      },
    });
    currentSessionId = newSession.id;
  }

  await db.message.create({
    data: { chatSessionId: currentSessionId, role: "USER", content: message },
  });

  /*
   * Build the file inventory from DB (metadata layer).
   * This lets the AI answer structural questions like
   * "what files exist?" without relying on RAG.
   */
  const fileIndex = repo.files
    .map((f) => `- ${f.path}${f.language ? ` (${f.language})` : ""}`)
    .join("\n");

  /*
   * RAG search for code-level questions.
   */
  const relevantChunks = await searchSimilar(repoId, message, 10);

  /*
   * Budget: the Groq free tier caps at 8,000 TPM.
   *
   * Rough allocation (~4 chars/token):
   *   System prompt template  ~800 tok
   *   File inventory           ~600 tok (134 files × ~18 chars avg)
   *   RAG context             ~2,000 tok
   *   History + user message   ~600 tok
   *   max_tokens (response)   ~1,024 tok
   *   ────────────────────────────────
   *   Total                   ~5,024 tok
   */
  const MAX_CONTEXT_CHARS = 8_000;

  const context =
    relevantChunks.length > 0
      ? relevantChunks
          .map((c) => `[SOURCE: ${c.metadata?.path ?? "unknown"}]\n${c.content}`)
          .join("\n\n---\n\n")
          .slice(0, MAX_CONTEXT_CHARS)
      : "No specific code context retrieved for this question.";

  const sources = [
    ...new Set(
      relevantChunks
        .map((c) => c.metadata?.path)
        .filter((p): p is string => !!p),
    ),
  ].map((path) => ({ path }));

  const systemPrompt = `You are an expert AI assistant for the codebase "${repo.name}".

You have TWO sources of truth:
1. **Repository file inventory** — authoritative list of all files.
2. **Retrieved code context** — relevant code snippets from RAG search.

IMPORTANT RULES:
1. Ground every technical claim in the retrieved code context or file inventory.
2. Do NOT invent files, functions, variables, or implementation details.
3. Do NOT assume framework behavior unless the code explicitly shows it.
4. If evidence is insufficient, say so clearly.
5. Reference file paths and code when available.

FILE INVENTORY RULES:
The file inventory below is authoritative for which files exist.
If the user asks what files exist, lists files, or asks about structure — use the inventory directly.
Do not claim a file is unknown if it appears in the inventory.

SOURCE AND EVIDENCE RULES:
Each [SOURCE] block is evidence from a specific file.
When making a technical claim, cite the [SOURCE] file path.
Do not combine information from different sources unless the code supports the relationship.
Never treat framework behavior as repository evidence.

FLOW / TRACEABILITY RULES:
When explaining a flow, EVERY transition must be supported by repository evidence.
If a transition is inside an external library, mark it as "Not proven by the repository."

Repository info:
- Language: ${repo.language ?? "Unknown"}
- Total files: ${repo.totalFiles}
- Components: ${repo.totalComponents}
- APIs: ${repo.totalAPIs}

Repository file inventory:
${fileIndex}

Retrieved code context:
${context}

Answer questions about this codebase accurately.`;
  const completion = await generateAICompletion({
    userId: session.user.id,
    messages: [
      { role: "system", content: systemPrompt },
      ...history.map((h: { role: string; content: string }) => ({
        role: (h.role === "USER" ? "user" : "assistant") as "user" | "assistant",
        content: h.content,
      })),
      { role: "user", content: message },
    ],
    maxTokens: 1024,
  });

  const response =
    completion.content || "Sorry, I couldn't generate a response.";

  await db.message.create({
    data: {
      chatSessionId: currentSessionId,
      role: "ASSISTANT",
      content: response,
    },
  });

  await db.chatSession.update({
    where: { id: currentSessionId },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json({
    response,
    sessionId: currentSessionId,
    sources,
  });
}
