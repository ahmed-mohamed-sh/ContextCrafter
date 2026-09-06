import Stripe from "stripe";

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-02-24.acacia" as any,
    })
  : null;

export const PLANS = {
  Hobby: {
    id: "hobby",
    name: "Hobby Plan",
    price: 0,
    reposLimit: 3,
    messagesLimit: 100,
    reviewsLimit: 10,
    docsLimit: 5,
    stripePriceId: process.env.STRIPE_PRICE_HOBBY || null,
  },
  Pro: {
    id: "pro",
    name: "Pro Developer",
    price: 29,
    reposLimit: 50,
    messagesLimit: 2000,
    reviewsLimit: 150,
    docsLimit: 100,
    stripePriceId: process.env.STRIPE_PRICE_PRO || "price_1Q_pro_developer",
  },
  Team: {
    id: "team",
    name: "Team & Enterprise",
    price: 79,
    reposLimit: 500,
    messagesLimit: 10000,
    reviewsLimit: 1000,
    docsLimit: 500,
    stripePriceId: process.env.STRIPE_PRICE_TEAM || "price_1Q_team_scale",
  },
};
