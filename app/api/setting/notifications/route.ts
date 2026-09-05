import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await db.userSettings.findUnique({
      where: { userId: session.user.id },
    });

    return NextResponse.json({
      notifications: {
        codeReviews: settings?.notifyCodeReview ?? true,
        securityFlaws: settings?.notifySecurity ?? true,
        syncStatus: settings?.notifySync ?? false,
        debtSpike: settings?.notifyDebtSpike ?? true,
        weeklyDigest: settings?.notifyWeekly ?? true,
        alertEmail: settings?.alertEmail || session.user.email || "",
        slackWebhookUrl: settings?.slackWebhookUrl || "",
        discordWebhookUrl: settings?.discordWebhookUrl || "",
      },
    });
  } catch (error: any) {
    console.error("[NOTIFICATIONS_GET_ERROR]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load notifications" },
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

    const body = await req.json();

    const updated = await db.userSettings.upsert({
      where: { userId: session.user.id },
      update: {
        notifyCodeReview: body.codeReviews,
        notifySecurity: body.securityFlaws,
        notifySync: body.syncStatus,
        notifyDebtSpike: body.debtSpike,
        notifyWeekly: body.weeklyDigest,
        alertEmail: body.alertEmail,
        slackWebhookUrl: body.slackWebhookUrl,
        discordWebhookUrl: body.discordWebhookUrl,
      },
      create: {
        userId: session.user.id,
        notifyCodeReview: body.codeReviews ?? true,
        notifySecurity: body.securityFlaws ?? true,
        notifySync: body.syncStatus ?? false,
        notifyDebtSpike: body.debtSpike ?? true,
        notifyWeekly: body.weeklyDigest ?? true,
        alertEmail: body.alertEmail || session.user.email || "",
        slackWebhookUrl: body.slackWebhookUrl || "",
        discordWebhookUrl: body.discordWebhookUrl || "",
      },
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (error: any) {
    console.error("[NOTIFICATIONS_POST_ERROR]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to save notifications" },
      { status: 500 }
    );
  }
}
