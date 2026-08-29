import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { searchSimilar } from "@/lib/rag";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

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
    include: { files: { take: 50, select: { path: true, language: true } } },
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

  const relevantChunks = await searchSimilar(repoId, message, 15);

  console.log(
    "RAG RESULTS:",
    relevantChunks.map((c) => ({
      path: c.metadata?.path,
      score: c.score,
      preview: c.content.slice(0, 300),
    })),
  );

  const MAX_CONTEXT_CHARS = 16000;

  const context =
    relevantChunks.length > 0
      ? relevantChunks
          .map((c) => `// ${c.metadata?.path ?? "unknown"}\n${c.content}`)
          .join("\n\n---\n\n")
          .slice(0, MAX_CONTEXT_CHARS)
      : "No specific context found.";

  const systemPrompt = `
You are an expert AI assistant that deeply understands the codebase "${repo.name}".

Your job is to answer questions about this repository accurately using ONLY the retrieved repository context.

IMPORTANT RULES:

1. Ground every technical claim in the retrieved repository context.
2. Do NOT invent files, functions, variables, configuration, database behavior, or implementation details.
3. Do NOT assume framework or library behavior unless it is explicitly demonstrated by the repository.
4. If the repository does not provide enough evidence, clearly say so.
5. Distinguish between:
   - What the repository explicitly shows
   - What can reasonably be inferred
   - What cannot be determined from the repository
6. When answering, reference the relevant file paths and code whenever available.
7. Prefer a precise "The repository does not provide enough evidence to determine this" over an unsupported answer.

FLOW / TRACEABILITY RULES:

When explaining a flow across multiple steps, EVERY transition in the flow must be supported by repository evidence.

For example, do NOT create a chain such as:

database → session → JWT → cookie → client

unless the repository explicitly contains evidence for each transition.

For EVERY step in a requested flow:
- Identify the exact repository code that supports that step.
- Explain what that code proves.
- Do not use general knowledge of the framework to fill missing steps.

If a transition is implemented inside an external dependency or library and the repository does not contain its implementation, explicitly mark that transition as:

"Not proven by the repository."

A configuration option such as:
strategy: "jwt"

SOURCE AND EVIDENCE RULES:

The retrieved context is the only source of repository truth.

Each [SOURCE] block represents evidence from a specific repository file.

When making a technical claim:
- Prefer citing the file path from the relevant [SOURCE].
- Do not combine information from different sources unless the code supports the relationship.
- If the retrieved sources do not contain enough evidence, say:
  "The repository does not provide enough evidence to determine this."
- Never invent a file path, function, variable, or implementation detail.

only proves that the application requests JWT-based sessions. It does NOT, by itself, prove:
- which fields are encoded into the JWT
- how the framework internally serializes those fields
- what the JWT payload contains
- how the framework stores or retrieves the token

Never treat framework behavior as repository evidence.

Do not claim that data is stored in a JWT, cookie, database, localStorage, cache, or other persistence mechanism unless the repository explicitly demonstrates that behavior.

Retrieved repository context:
                        
Repository info:
- Language: ${repo.language ?? "Unknown"}
- Total files: ${repo.totalFiles}
- Components: ${repo.totalComponents}
- APIs: ${repo.totalAPIs}

Relevant code context:
${context}

Answer questions about this codebase accurately. Reference specific files and code when relevant.`;
  const completion = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",
    messages: [
      { role: "system", content: systemPrompt },
      ...history.map((h: { role: string; content: string }) => ({
        role: h.role === "USER" ? "user" : "assistant",
        content: h.content,
      })),
      { role: "user", content: message },
    ],
    max_tokens: 1024,
  });

  const response =
    completion.choices[0]?.message?.content ??
    "Sorry, I couldn't generate a response.";

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
    sources: [],
  });
}
