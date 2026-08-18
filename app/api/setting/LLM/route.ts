import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { provider, apiKey } = await req.json();

  await db.userSettings.upsert({
    where: { userId: session.user.id },
    update: { llmProvider: provider, llmApiKey: apiKey },
    create: {
      userId: session.user.id,
      llmProvider: provider,
      llmApiKey: apiKey,
    },
  });

  return NextResponse.json({ success: true });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const settings = await db.userSettings.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json({ settings });
}
