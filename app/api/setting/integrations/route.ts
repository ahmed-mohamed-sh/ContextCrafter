import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user, settings, apiKeys] = await Promise.all([
      db.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          githubUsername: true,
          accounts: {
            where: { provider: "github" },
            select: { id: true, provider: true },
          },
        },
      }),
      db.userSettings.findUnique({
        where: { userId: session.user.id },
      }),
      db.apiKey.findMany({
        where: { userId: session.user.id, status: "active" },
        take: 1,
      }),
    ]);

    const isGithubConnected = Boolean(user?.githubUsername || user?.accounts?.length);
    const integrationsData = (settings?.integrations as Record<string, any>) || {};

    const statusMap = {
      github: {
        connected: isGithubConnected,
        username: user?.githubUsername || session.user.name || "Connected Account",
        details: isGithubConnected ? "Connected via GitHub OAuth" : "Not connected",
      },
      gitlab: {
        connected: Boolean(integrationsData.gitlab?.token),
        host: integrationsData.gitlab?.host || "gitlab.com",
        username: integrationsData.gitlab?.username || null,
      },
      slack: {
        connected: Boolean(settings?.slackWebhookUrl),
        webhookUrl: settings?.slackWebhookUrl || "",
      },
      discord: {
        connected: Boolean(settings?.discordWebhookUrl),
        webhookUrl: settings?.discordWebhookUrl || "",
      },
      jira: {
        connected: Boolean(integrationsData.jira?.domain && integrationsData.jira?.token),
        domain: integrationsData.jira?.domain || "",
        email: integrationsData.jira?.email || "",
      },
      vscode: {
        connected: apiKeys.length > 0,
        activeKey: apiKeys[0]?.key || null,
      },
    };

    return NextResponse.json({
      integrations: statusMap,
      rawConfig: integrationsData,
    });
  } catch (error: any) {
    console.error("[INTEGRATIONS_GET_ERROR]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load integrations" },
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

    const { provider, config } = await req.json();

    if (!provider) {
      return NextResponse.json({ error: "Provider is required" }, { status: 400 });
    }

    const currentSettings = await db.userSettings.findUnique({
      where: { userId: session.user.id },
    });

    const currentIntegrations = (currentSettings?.integrations as Record<string, any>) || {};
    const updatedIntegrations = {
      ...currentIntegrations,
      [provider]: config,
    };

    const updatePayload: any = {
      integrations: updatedIntegrations,
    };

    // Also update top-level webhook fields if relevant
    if (provider === "slack") {
      updatePayload.slackWebhookUrl = config?.webhookUrl || null;
    }
    if (provider === "discord") {
      updatePayload.discordWebhookUrl = config?.webhookUrl || null;
    }

    const updated = await db.userSettings.upsert({
      where: { userId: session.user.id },
      update: updatePayload,
      create: {
        userId: session.user.id,
        integrations: updatedIntegrations,
        slackWebhookUrl: provider === "slack" ? config?.webhookUrl : null,
        discordWebhookUrl: provider === "discord" ? config?.webhookUrl : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${provider.toUpperCase()} integration updated successfully`,
      settings: updated,
    });
  } catch (error: any) {
    console.error("[INTEGRATIONS_POST_ERROR]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to save integration" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const provider = searchParams.get("provider");

    if (!provider) {
      return NextResponse.json({ error: "Provider is required" }, { status: 400 });
    }

    const currentSettings = await db.userSettings.findUnique({
      where: { userId: session.user.id },
    });

    const currentIntegrations = (currentSettings?.integrations as Record<string, any>) || {};
    delete currentIntegrations[provider];

    const updatePayload: any = {
      integrations: currentIntegrations,
    };

    if (provider === "slack") updatePayload.slackWebhookUrl = null;
    if (provider === "discord") updatePayload.discordWebhookUrl = null;

    await db.userSettings.update({
      where: { userId: session.user.id },
      data: updatePayload,
    });

    return NextResponse.json({
      success: true,
      message: `${provider.toUpperCase()} disconnected successfully`,
    });
  } catch (error: any) {
    console.error("[INTEGRATIONS_DELETE_ERROR]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to disconnect integration" },
      { status: 500 }
    );
  }
}
