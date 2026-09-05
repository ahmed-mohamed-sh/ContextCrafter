import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { embedModel, chunkSize, chunkOverlap, topK, hybridWeight } = await req.json();

    const updated = await db.userSettings.upsert({
      where: { userId: session.user.id },
      update: {
        ...(embedModel ? { embedModel } : {}),
        ...(chunkSize !== undefined ? { chunkSize: parseInt(chunkSize) } : {}),
        ...(chunkOverlap !== undefined ? { chunkOverlap: parseInt(chunkOverlap) } : {}),
        ...(topK !== undefined ? { topK: parseInt(topK) } : {}),
        ...(hybridWeight !== undefined ? { hybridWeight: parseFloat(hybridWeight) } : {}),
      },
      create: {
        userId: session.user.id,
        embedModel: embedModel || "nomic",
        chunkSize: chunkSize ? parseInt(chunkSize) : 512,
        chunkOverlap: chunkOverlap ? parseInt(chunkOverlap) : 64,
        topK: topK ? parseInt(topK) : 8,
        hybridWeight: hybridWeight ? parseFloat(hybridWeight) : 0.7,
      },
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (error: any) {
    console.error("[MODELS_SETTINGS_POST_ERROR]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to save model settings" },
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
    console.error("[MODELS_SETTINGS_GET_ERROR]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch model settings" },
      { status: 500 }
    );
  }
}
