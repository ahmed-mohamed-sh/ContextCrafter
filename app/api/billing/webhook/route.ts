import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json({ message: "Stripe webhook not configured" }, { status: 200 });
    }

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
    }

    let event: any;
    try {
      event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      console.error(`[STRIPE_WEBHOOK_VERIFY_ERROR] ${err.message}`);
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan || "Pro";

        if (userId) {
          await db.userSettings.upsert({
            where: { userId },
            update: {
              subscriptionPlan: plan,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              subscriptionStatus: "active",
            },
            create: {
              userId,
              subscriptionPlan: plan,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              subscriptionStatus: "active",
            },
          });

          await db.invoice.create({
            data: {
              userId,
              invoiceNumber: `INV-${new Date().getFullYear()}-${session.id.slice(-6).toUpperCase()}`,
              amount: (session.amount_total || 2900) / 100,
              currency: session.currency?.toUpperCase() || "USD",
              plan: `${plan} Plan (Stripe)`,
              status: "Paid",
              paymentMethod: "Stripe Checkout",
            },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const userSettings = await db.userSettings.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        });

        if (userSettings) {
          await db.userSettings.update({
            where: { id: userSettings.id },
            data: {
              subscriptionPlan: "Hobby",
              subscriptionStatus: "canceled",
            },
          });
        }
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("[STRIPE_WEBHOOK_ERROR]", error);
    return NextResponse.json(
      { error: error?.message || "Webhook handler failed" },
      { status: 500 }
    );
  }
}
