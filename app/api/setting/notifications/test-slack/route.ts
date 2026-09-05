import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { webhookUrl } = await req.json();

    if (!webhookUrl || !webhookUrl.startsWith("http")) {
      return NextResponse.json(
        { error: "A valid webhook URL is required" },
        { status: 400 }
      );
    }

    const payload = {
      text: `🚀 *ContextCrafter Webhook Alert Test*\nUser *${session.user.name || session.user.email}* has verified this connection successfully!`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*ContextCrafter Integration Alert*\nWebhook connection verified successfully for *${session.user.email}*. Real notifications will appear in this channel.`,
          },
        },
      ],
    };

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Webhook returned status ${res.status}: ${text || "Failed"}` },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: "Slack test message delivered!" });
  } catch (error: any) {
    console.error("[TEST_SLACK_ERROR]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to reach Slack webhook endpoint" },
      { status: 500 }
    );
  }
}
