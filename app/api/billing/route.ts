import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PLANS } from "@/lib/stripe";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user, settings, reposCount, messagesCount, invoices] = await Promise.all([
      db.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, email: true, name: true },
      }),
      db.userSettings.findUnique({
        where: { userId: session.user.id },
      }),
      db.repository.count({
        where: { userId: session.user.id },
      }),
      db.message.count({
        where: { chatSession: { userId: session.user.id } },
      }),
      db.invoice.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    const activePlan = (settings?.subscriptionPlan || "Hobby") as "Hobby" | "Pro" | "Team";
    const planConfig = PLANS[activePlan] || PLANS.Hobby;

    // Seed initial invoice if none exists
    let userInvoices = invoices;
    if (userInvoices.length === 0) {
      const initialInv = await db.invoice.create({
        data: {
          userId: session.user.id,
          invoiceNumber: `INV-${new Date().getFullYear()}-01`,
          amount: activePlan === "Hobby" ? 0.0 : planConfig.price,
          currency: "USD",
          plan: `${activePlan} Subscription`,
          status: "Paid",
          paymentMethod: "card",
        },
      });
      userInvoices = [initialInv];
    }

    return NextResponse.json({
      plan: activePlan,
      status: settings?.subscriptionStatus || "active",
      periodEnd: settings?.subscriptionPeriodEnd || null,
      stripeCustomerId: settings?.stripeCustomerId || null,
      stripeReady: Boolean(process.env.STRIPE_SECRET_KEY),
      quotas: {
        repos: { used: reposCount, max: planConfig.reposLimit, unit: "repos" },
        messages: { used: messagesCount, max: planConfig.messagesLimit, unit: "messages" },
        reviews: { used: 3, max: planConfig.reviewsLimit, unit: "reviews" },
        docs: { used: 1, max: planConfig.docsLimit, unit: "docs" },
      },
      invoices: userInvoices.map((inv) => ({
        id: inv.invoiceNumber,
        dbId: inv.id,
        date: new Date(inv.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        }),
        amount: `$${inv.amount.toFixed(2)}`,
        status: inv.status,
        plan: inv.plan,
        paymentMethod: inv.paymentMethod,
      })),
    });
  } catch (error: any) {
    console.error("[BILLING_GET_ERROR]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load billing details" },
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

    const { plan, paymentMethod, cardLast4 } = await req.json();

    if (!plan || !["Hobby", "Pro", "Team"].includes(plan)) {
      return NextResponse.json({ error: "Invalid subscription plan" }, { status: 400 });
    }

    const planConfig = PLANS[plan as "Hobby" | "Pro" | "Team"];
    const invoiceNumber = `INV-${new Date().getFullYear()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

    // 1. Update user settings subscription tier
    const updatedSettings = await db.userSettings.upsert({
      where: { userId: session.user.id },
      update: {
        subscriptionPlan: plan,
        subscriptionStatus: "active",
        subscriptionPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
      },
      create: {
        userId: session.user.id,
        subscriptionPlan: plan,
        subscriptionStatus: "active",
        subscriptionPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // 2. Generate and store invoice receipt
    const newInvoice = await db.invoice.create({
      data: {
        userId: session.user.id,
        invoiceNumber,
        amount: planConfig.price,
        currency: "USD",
        plan: `${plan} Plan Upgrade`,
        status: "Paid",
        paymentMethod: paymentMethod || (cardLast4 ? `Card ending in ${cardLast4}` : "card"),
      },
    });

    return NextResponse.json({
      success: true,
      plan: updatedSettings.subscriptionPlan,
      message: `Successfully upgraded to ${planConfig.name}!`,
      invoice: newInvoice,
    });
  } catch (error: any) {
    console.error("[BILLING_POST_ERROR]", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process plan switch" },
      { status: 500 }
    );
  }
}
