import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { provider, apiKey, temperature, maxTokens, customBaseUrl } = await req.json();

    const updated = await db.userSettings.upsert({
      where: { userId: session.user.id },
      update: {
        ...(provider ? { llmProvider: provider } : {}),
        ...(apiKey !== undefined ? { llmApiKey: apiKey } : {}),
        ...(temperature !== undefined ? { temperature: parseFloat(temperature) } : {}),
        ...(maxTokens !== undefined ? { maxTokens: parseInt(maxTokens) } : {}),
        ...(customBaseUrl !== undefined ? { customBaseUrl } : {}),
      },
      create: {
        userId: session.user.id,
        llmProvider: provider || "groq",
        llmApiKey: apiKey || null,
        temperature: temperature ? parseFloat(temperature) : 0.2,
        maxTokens: maxTokens ? parseInt(maxTokens) : 4096,
        customBaseUrl: customBaseUrl || null,
      },
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (error: any) {
    console.error("[LLM_SETTINGS_POST_ERROR]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to save LLM settings" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const settings = await db.userSettings.findUnique({
      where: { userId: session.user.id },
    });

    return NextResponse.json({ settings });
  } catch (error: any) {
    console.error("[LLM_SETTINGS_GET_ERROR]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch LLM settings" },
      { status: 500 }
    );
  }
}
