import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { provider, config } = await req.json();

    if (!provider) {
      return NextResponse.json({ error: "Provider is required" }, { status: 400 });
    }

    // 1. Test GitLab Token
    if (provider === "gitlab") {
      const token = config?.token?.trim();
      const host = (config?.host || "gitlab.com").replace(/^https?:\/\//, "").replace(/\/+$/, "");

      if (!token) {
        return NextResponse.json(
          { error: "GitLab Personal Access Token is required." },
          { status: 400 }
        );
      }

      try {
        const glRes = await fetch(`https://${host}/api/v4/user`, {
          headers: {
            "PRIVATE-TOKEN": token,
          },
        });

        if (!glRes.ok) {
          const glErr = await glRes.text();
          return NextResponse.json(
            { error: `GitLab authentication failed (${glRes.status}): Invalid token or insufficient scopes.` },
            { status: 400 }
          );
        }

        const glUser = await glRes.json();
        return NextResponse.json({
          success: true,
          message: `Connected successfully to GitLab as @${glUser.username} (${glUser.name || glUser.email || ""})`,
          user: { username: glUser.username, name: glUser.name },
        });
      } catch (err: any) {
        return NextResponse.json(
          { error: `Could not reach GitLab host at https://${host}: ${err.message}` },
          { status: 500 }
        );
      }
    }

    // 2. Test Slack Webhook
    if (provider === "slack") {
      const webhookUrl = config?.webhookUrl?.trim();
      if (!webhookUrl || !webhookUrl.startsWith("https://hooks.slack.com/")) {
        return NextResponse.json(
          { error: "Please enter a valid Slack Incoming Webhook URL (starts with https://hooks.slack.com/)" },
          { status: 400 }
        );
      }

      const slackRes = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `🎉 *ContextCrafter Integration Verified!*\nConnected by *${session.user.name || session.user.email}*. Codebase intelligence alerts and PR reviews will now be reported here.`,
        }),
      });

      if (!slackRes.ok) {
        const text = await slackRes.text();
        return NextResponse.json(
          { error: `Slack rejected webhook (${slackRes.status}): ${text}` },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Real test ping delivered to your Slack channel!",
      });
    }

    // 3. Test Discord Webhook
    if (provider === "discord") {
      const webhookUrl = config?.webhookUrl?.trim();
      if (!webhookUrl || !webhookUrl.startsWith("https://discord.com/api/webhooks/")) {
        return NextResponse.json(
          { error: "Please enter a valid Discord Webhook URL (starts with https://discord.com/api/webhooks/)" },
          { status: 400 }
        );
      }

      const discordRes = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "ContextCrafter Bot",
          avatar_url: "https://contextcrafter.com/logo.png",
          embeds: [
            {
              title: "🚀 ContextCrafter Webhook Connected",
              description: `Successfully linked workspace notifications for **${session.user.name || session.user.email}**!`,
              color: 0x4f46e5,
              fields: [
                { name: "Status", value: "Active", inline: true },
                { name: "Service", value: "Code Intelligence & PR Reviews", inline: true },
              ],
              footer: { text: "ContextCrafter Notifications" },
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      });

      if (!discordRes.ok) {
        const text = await discordRes.text();
        return NextResponse.json(
          { error: `Discord rejected webhook (${discordRes.status}): ${text}` },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Real test ping delivered to your Discord channel!",
      });
    }

    // 4. Test Jira Atlassian
    if (provider === "jira") {
      const domain = config?.domain?.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
      const email = config?.email?.trim();
      const token = config?.token?.trim();

      if (!domain || !email || !token) {
        return NextResponse.json(
          { error: "Jira Domain (e.g. company.atlassian.net), Email, and API Token are all required." },
          { status: 400 }
        );
      }

      const authHeader = `Basic ${Buffer.from(`${email}:${token}`).toString("base64")}`;
      const jiraRes = await fetch(`https://${domain}/rest/api/3/myself`, {
        headers: {
          Authorization: authHeader,
          Accept: "application/json",
        },
      });

      if (!jiraRes.ok) {
        return NextResponse.json(
          { error: `Jira authentication failed (${jiraRes.status}). Verify your Jira domain, email, and API token.` },
          { status: 400 }
        );
      }

      const jiraUser = await jiraRes.json();
      return NextResponse.json({
        success: true,
        message: `Connected to Jira as ${jiraUser.displayName || jiraUser.emailAddress || email}`,
        user: { name: jiraUser.displayName, email: jiraUser.emailAddress },
      });
    }

    return NextResponse.json({ error: "Unsupported integration provider" }, { status: 400 });
  } catch (error: any) {
    console.error("[INTEGRATION_TEST_ERROR]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to verify integration connection" },
      { status: 500 }
    );
  }
}
