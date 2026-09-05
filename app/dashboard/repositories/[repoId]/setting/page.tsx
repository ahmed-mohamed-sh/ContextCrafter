import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import SettingClient from "./SettingClient";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      repositories: {
        select: {
          id: true,
          name: true,
          branch: true,
          status: true,
          autoSync: true,
          excludedPaths: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: "desc" },
      },
      apiKeys: {
        orderBy: { createdAt: "desc" },
      },
      teamMembers: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) redirect("/login");

  const [repoCount, chatCount, reviewCount, docCount] = await Promise.all([
    db.repository.count({ where: { userId: session.user.id } }),
    db.message.count({ where: { chatSession: { userId: session.user.id } } }),
    db.repository.count({
      where: { userId: session.user.id, reviewedAt: { not: null } },
    }),
    db.repository.count({ where: { userId: session.user.id } }),
  ]);

  const repos = user.repositories.map((repo) => ({
    id: repo.id,
    name: repo.name,
    branch: repo.branch || "main",
    status:
      repo.status === "READY"
        ? ("synced" as const)
        : repo.status === "ANALYZING"
          ? ("syncing" as const)
          : ("error" as const),
    autoSync: repo.autoSync ?? true,
    excludedPaths: repo.excludedPaths || ["node_modules", ".next", "dist", "coverage", ".git"],
  }));

  const userSettings = await db.userSettings.findUnique({
    where: { userId: session.user.id },
  });

  const apiKeys = user.apiKeys.map((k) => ({
    id: k.id,
    name: k.name,
    key: `${k.key.substring(0, 10)}••••••••••••••••${k.key.slice(-4)}`,
    status: k.status as "active" | "read-only",
    created: k.createdAt.toISOString().split("T")[0],
    lastUsed: k.lastUsedAt ? k.lastUsedAt.toISOString().split("T")[0] : "Never",
    expires: k.expiresAt ? k.expiresAt.toISOString().split("T")[0] : "Never",
  }));

  const owner = {
    id: user.id,
    name: user.name ?? "Owner",
    email: user.email ?? "",
    image: user.image,
    role: "Owner" as const,
    status: "active" as const,
    isCurrent: true,
  };

  const members = [
    owner,
    ...user.teamMembers.map((m) => ({
      id: m.id,
      name: m.name || m.email.split("@")[0],
      email: m.email,
      image: null,
      role: m.role as "Admin" | "Developer" | "Viewer",
      status: m.status as "active" | "invited",
    })),
  ];

  return (
    <SettingClient
      user={{
        name: user.name ?? "Unknown",
        email: user.email ?? "",
        image: user.image,
      }}
      repos={repos}
      usage={{
        repos: repoCount,
        messages: chatCount,
        reviews: reviewCount,
        docs: docCount,
      }}
      settings={userSettings}
      initialApiKeys={apiKeys}
      initialTeamMembers={members}
    />
  );
}
