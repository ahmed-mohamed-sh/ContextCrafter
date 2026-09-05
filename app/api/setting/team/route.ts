import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { sendInviteEmail } from "@/lib/email";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user, members] = await Promise.all([
      db.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, name: true, email: true, image: true },
      }),
      db.teamMember.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const owner = {
      id: user?.id || "owner",
      name: user?.name || "Owner",
      email: user?.email || "",
      image: user?.image || null,
      role: "Owner",
      status: "active",
      isCurrent: true,
    };

    const formattedMembers = members.map((m) => ({
      id: m.id,
      name: m.name || m.email.split("@")[0],
      email: m.email,
      image: null,
      role: m.role,
      status: m.status,
      inviteToken: m.inviteToken,
      createdAt: m.createdAt,
    }));

    return NextResponse.json({
      members: [owner, ...formattedMembers],
    });
  } catch (error: any) {
    console.error("[TEAM_GET_ERROR]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load team members" },
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

    const { email, role } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "A valid email address is required" },
        { status: 400 }
      );
    }

    // Check if member already exists
    const existing = await db.teamMember.findFirst({
      where: { userId: session.user.id, email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An invitation has already been sent to this email address" },
        { status: 400 }
      );
    }

    const inviteToken = `inv_${crypto.randomBytes(16).toString("hex")}`;

    const newMember = await db.teamMember.create({
      data: {
        userId: session.user.id,
        email,
        name: email.split("@")[0],
        role: role || "Developer",
        status: "invited",
        inviteToken,
      },
    });

    const host = req.headers.get("origin") || req.headers.get("host") || "http://localhost:3000";
    const fullInviteLink = host.startsWith("http") ? `${host}/invite/${inviteToken}` : `https://${host}/invite/${inviteToken}`;

    // Send real invitation email
    const emailResult = await sendInviteEmail({
      to: email,
      inviterName: session.user.name || "A workspace owner",
      inviterEmail: session.user.email || "",
      role: role || "Developer",
      inviteLink: fullInviteLink,
    });

    return NextResponse.json({
      success: true,
      member: {
        id: newMember.id,
        name: newMember.name,
        email: newMember.email,
        image: null,
        role: newMember.role,
        status: newMember.status,
        inviteToken: newMember.inviteToken,
        createdAt: newMember.createdAt,
      },
      inviteLink: `/invite/${inviteToken}`,
      fullInviteLink,
      emailSent: emailResult.success,
      emailError: emailResult.error,
      emailProvider: emailResult.provider,
      message: emailResult.success
        ? `Invitation email sent to ${email} via ${emailResult.provider}`
        : `Invitation created in DB! (Email notice: ${emailResult.error || "Check Resend domain"})`,
    });
  } catch (error: any) {
    console.error("[TEAM_POST_ERROR]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create team invitation" },
      { status: 500 }
    );
  }
}
