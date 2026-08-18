import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { embedModel } = await req.json();

  await db.userSettings.upsert({
    where: { userId: session.user.id },
    update: { embedModel },
    create: { userId: session.user.id, embedModel },
  });

  return NextResponse.json({ success: true });
}
