import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { memberId } = await params;
    const { role } = await req.json();

    const updated = await db.teamMember.updateMany({
      where: {
        id: memberId,
        userId: session.user.id,
      },
      data: { role },
    });

    if (updated.count === 0) {
      return NextResponse.json(
        { error: "Team member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, role });
  } catch (error: any) {
    console.error("[TEAM_PATCH_ERROR]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update member role" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { memberId } = await params;

    const deleted = await db.teamMember.deleteMany({
      where: {
        id: memberId,
        userId: session.user.id,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: "Team member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[TEAM_DELETE_ERROR]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete member" },
      { status: 500 }
    );
  }
}
