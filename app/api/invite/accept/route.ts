import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be signed in to accept this invitation" },
        { status: 401 }
      );
    }

    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Missing invitation token" }, { status: 400 });
    }

    const invite = await db.teamMember.findUnique({
      where: { inviteToken: token },
    });

    if (!invite) {
      return NextResponse.json(
        { error: "This invitation link is invalid or has expired" },
        { status: 404 }
      );
    }

    // Update member status to active and record user name
    const updated = await db.teamMember.update({
      where: { id: invite.id },
      data: {
        status: "active",
        name: session.user.name || session.user.email?.split("@")[0] || invite.name,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Invitation accepted! Welcome to the workspace.",
      member: updated,
    });
  } catch (error: any) {
    console.error("[INVITE_ACCEPT_ERROR]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to accept invitation" },
      { status: 500 }
    );
  }
}
