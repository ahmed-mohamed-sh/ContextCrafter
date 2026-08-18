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
          status: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: "desc" },
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
    branch: "main",
    status:
      repo.status === "READY"
        ? ("synced" as const)
        : repo.status === "ANALYZING"
          ? ("syncing" as const)
          : ("error" as const),
    autoSync: true,
  }));

  const userSettings = await db.userSettings.findUnique({
    where: { userId: session.user.id },
    select: { llmProvider: true, llmApiKey: true, embedModel: true },
  });

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
    />
  );
}
