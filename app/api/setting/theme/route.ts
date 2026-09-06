import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { themeMode, syntaxTheme } = await req.json();

    const updateData: any = {};
    if (themeMode) updateData.themeMode = themeMode;
    if (syntaxTheme) updateData.syntaxTheme = syntaxTheme;

    const updated = await db.userSettings.upsert({
      where: { userId: session.user.id },
      update: updateData,
      create: {
        userId: session.user.id,
        themeMode: themeMode || "dark-obsidian",
        syntaxTheme: syntaxTheme || "tokyo-night",
      },
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (error: any) {
    console.error("[THEME_POST_ERROR]", error);
    return NextResponse.json({ error: error?.message || "Failed to save theme" }, { status: 500 });
  }
}
