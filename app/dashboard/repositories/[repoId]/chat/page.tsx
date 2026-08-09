import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ChatClient } from "./ChatClient";

export default async function ChatPage({ params }: { params: Promise<{ repoId: string }> }) {
  const { repoId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const repo = await db.repository.findUnique({
    where: { id: repoId, userId: session.user.id },
  });

  if (!repo) redirect("/dashboard");

  const chatSessions = await db.chatSession.findMany({
    where: { repositoryId: repoId, userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  return (
    <ChatClient
      repo={{ id: repo.id, name: repo.name }}
      chatSessions={chatSessions}
      user={{ name: session.user.name, image: session.user.image }}
    />
  );
}
