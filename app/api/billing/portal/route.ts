import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userSettings = await db.userSettings.findUnique({
      where: { userId: session.user.id },
    });

    if (!stripe || !process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Stripe Customer Portal is not configured in this environment." },
        { status: 400 }
      );
    }

    if (!userSettings?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No active Stripe customer found. Please make a payment first." },
        { status: 400 }
      );
    }

    const host = req.headers.get("origin") || req.headers.get("host") || "http://localhost:3000";
    const baseUrl = host.startsWith("http") ? host : `https://${host}`;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: userSettings.stripeCustomerId,
      return_url: `${baseUrl}/dashboard/repositories/settings?tab=billing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error: any) {
    console.error("[BILLING_PORTAL_ERROR]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to open billing portal" },
      { status: 500 }
    );
  }
}
