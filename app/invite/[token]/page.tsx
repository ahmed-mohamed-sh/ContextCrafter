import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import InviteClient from "./InviteClient";
import Link from "next/link";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await auth();

  const invite = await db.teamMember.findUnique({
    where: { inviteToken: token },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          image: true,
          repositories: {
            select: { id: true, name: true },
            take: 3,
          },
        },
      },
    },
  });

  if (!invite) {
    return (
      <div className="min-h-screen bg-[#0b1326] flex items-center justify-center p-6">
        <div
          className="max-w-md w-full rounded-2xl p-8 border border-white/10 text-center space-y-5"
          style={{ background: "#131b2e", backdropFilter: "blur(16px)" }}
        >
          <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center bg-red-500/10 border border-red-500/20">
            <span className="material-symbols-outlined text-[28px] text-red-400">
              link_off
            </span>
          </div>
          <h2
            style={{
              fontFamily: "Geist, sans-serif",
              fontSize: 22,
              fontWeight: 700,
              color: "#dae2fd",
            }}
          >
            Invalid or Expired Invitation
          </h2>
          <p
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: 13,
              color: "#918fa1",
            }}
          >
            This invitation link is no longer valid or may have been revoked by
            the workspace owner.
          </p>
          <Link
            href="/dashboard"
            className="inline-block px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <InviteClient
      token={token}
      invite={{
        id: invite.id,
        email: invite.email,
        role: invite.role,
        status: invite.status,
        inviter: {
          name: invite.user.name || "A workspace owner",
          email: invite.user.email || "",
          image: invite.user.image,
          reposCount: invite.user.repositories.length,
          sampleRepos: invite.user.repositories.map((r) => r.name),
        },
      }}
      currentUser={
        session?.user
          ? {
              id: session.user.id,
              name: session.user.name,
              email: session.user.email,
              image: session.user.image,
            }
          : null
      }
    />
  );
}
