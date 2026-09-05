import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const keys = await db.apiKey.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    const formatted = keys.map((k) => ({
      id: k.id,
      name: k.name,
      key: `${k.key.substring(0, 10)}••••••••••••••••${k.key.slice(-4)}`,
      status: k.status,
      created: k.createdAt.toISOString().split("T")[0],
      lastUsed: k.lastUsedAt ? k.lastUsedAt.toISOString().split("T")[0] : "Never",
      expires: k.expiresAt ? k.expiresAt.toISOString().split("T")[0] : "Never",
    }));

    return NextResponse.json({ keys: formatted });
  } catch (error: any) {
    console.error("[API_KEYS_GET_ERROR]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load API keys" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, status, expires } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "A key name/description is required" },
        { status: 400 }
      );
    }

    const rawSecret = `cc_live_${crypto.randomBytes(24).toString("hex")}`;

    let expiresAt: Date | null = null;
    if (expires === "30 days") {
      expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    } else if (expires === "90 days") {
      expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    }

    const newKey = await db.apiKey.create({
      data: {
        userId: session.user.id,
        name: name.trim(),
        key: rawSecret,
        status: status || "active",
        expiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      key: {
        id: newKey.id,
        name: newKey.name,
        key: rawSecret, // Returned once upon creation
        status: newKey.status,
        created: newKey.createdAt.toISOString().split("T")[0],
        lastUsed: "Just now",
        expires: expiresAt ? expiresAt.toISOString().split("T")[0] : "Never",
      },
    });
  } catch (error: any) {
    console.error("[API_KEYS_POST_ERROR]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate API key" },
      { status: 500 }
    );
  }
}
