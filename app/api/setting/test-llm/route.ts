import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { provider, apiKey, baseUrl } = await req.json();

    const startTime = Date.now();

    if (provider === "groq") {
      const key = apiKey || process.env.GROQ_API_KEY;
      if (!key) {
        return NextResponse.json(
          { error: "No Groq API key provided or found in environment." },
          { status: 400 }
        );
      }
      const res = await fetch("https://api.groq.com/openai/v1/models", {
        headers: { Authorization: `Bearer ${key}` },
      });
      if (!res.ok) {
        return NextResponse.json(
          { error: `Groq authentication failed (${res.status})` },
          { status: 400 }
        );
      }
    } else if (provider === "openai") {
      const key = apiKey || process.env.OPENAI_API_KEY;
      if (!key) {
        return NextResponse.json(
          { error: "No OpenAI API key provided or found in environment." },
          { status: 400 }
        );
      }
      const res = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${key}` },
      });
      if (!res.ok) {
        return NextResponse.json(
          { error: `OpenAI authentication failed (${res.status})` },
          { status: 400 }
        );
      }
    } else if (provider === "ollama") {
      const url = baseUrl || "http://localhost:11434";
      try {
        const res = await fetch(`${url}/api/tags`, { method: "GET" });
        if (!res.ok) {
          return NextResponse.json(
            { error: `Ollama instance returned ${res.status}` },
            { status: 400 }
          );
        }
      } catch (err: any) {
        return NextResponse.json(
          { error: `Cannot reach Ollama at ${url}. Ensure Ollama is running.` },
          { status: 400 }
        );
      }
    }

    const latency = Date.now() - startTime;
    return NextResponse.json({
      success: true,
      latency,
      message: `Connection successful! Response time: ${latency}ms`,
    });
  } catch (error: any) {
    console.error("Test LLM error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to verify connection" },
      { status: 500 }
    );
  }
}
