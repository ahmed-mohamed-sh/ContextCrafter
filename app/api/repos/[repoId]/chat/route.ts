import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import Groq from "groq-sdk";

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

  const systemPrompt = `You are an expert AI assistant that deeply understands the codebase "${repo.name}".
Repository context:
- Total files: ${repo.totalFiles}
- Main language: ${repo.language ?? "Unknown"}
- Components: ${repo.totalComponents}
- APIs: ${repo.totalAPIs}

Known files:
${repo.files.map((f) => `- ${f.path} (${f.language ?? "unknown"})`).join("\n")}

Answer questions about this codebase with precision. Reference specific files when relevant.`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
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
