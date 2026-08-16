import { db } from "@/lib/db";

export async function GET() {
  try {
    const result = await db.$queryRaw`SELECT NOW()`;

    return Response.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error("DB TEST ERROR:", error);

    return Response.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 },
    );
  }
}
