export const PRODUCT_PRICES = {
  BASIC_MONTHLY: process.env.NEXT_PUBLIC_PADDLE_PRICE_BASIC_MONTHLY || "",
  BASIC_ANNUALLY: process.env.NEXT_PUBLIC_PADDLE_PRICE_BASIC_ANNUALLY || "",
  PRO_MONTHLY: process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO_MONTHLY || "",
  PRO_ANNUALLY: process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO_ANNUALLY || "",
  ENTERPRISE_MONTHLY: process.env.NEXT_PUBLIC_PADDLE_PRICE_ENTERPRISE_MONTHLY || "",
  ENTERPRISE_ANNUALLY: process.env.NEXT_PUBLIC_PADDLE_PRICE_ENTERPRISE_ANNUALLY || "",

  BASIC_PERPETUAL: process.env.NEXT_PUBLIC_PADDLE_PRICE_BASIC_PERPETUAL || "",
  PRO_PERPETUAL: process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO_PERPETUAL || "",
  ENTERPRISE_PERPETUAL: process.env.NEXT_PUBLIC_PADDLE_PRICE_ENTERPRISE_PERPETUAL || "",
};

export const PLAN_CONFIG = {
  basic: {
    name: "Basic",
    deviceLimit: 1,
    monthly: PRODUCT_PRICES.BASIC_MONTHLY,
    ANNUALLY: PRODUCT_PRICES.BASIC_ANNUALLY,
    perpetual: PRODUCT_PRICES.BASIC_PERPETUAL,
  },
  pro: {
    name: "Pro",
    deviceLimit: 3,
    monthly: PRODUCT_PRICES.PRO_MONTHLY,
    ANNUALLY: PRODUCT_PRICES.PRO_ANNUALLY,
    perpetual: PRODUCT_PRICES.PRO_PERPETUAL,
  },
  enterprise: {
    name: "Enterprise",
    deviceLimit: 999999,
    monthly: PRODUCT_PRICES.ENTERPRISE_MONTHLY,
    ANNUALLY: PRODUCT_PRICES.ENTERPRISE_ANNUALLY,
    perpetual: PRODUCT_PRICES.ENTERPRISE_PERPETUAL,
  },
};

export type PlanTier = keyof typeof PLAN_CONFIG;
export type BillingInterval = "monthly" | "ANNUALLY" | "perpetual";

export function getPriceId(
  planTier: PlanTier,
  billingInterval: BillingInterval
): string {
  const plan = PLAN_CONFIG[planTier];

  if (!plan) {
    throw new Error(`Invalid plan tier: ${planTier}`);
  }

  const priceId = plan[billingInterval];

  if (!priceId) {
    throw new Error(`No price ID found for ${planTier} ${billingInterval}`);
  }

  return priceId;
}

export function getDeviceLimit(planTier: PlanTier): number {
  return PLAN_CONFIG[planTier]?.deviceLimit || 1;
}

export interface PaddleCheckoutOptions {
  priceId: string;
  userId: string;
  userEmail: string;
  planTier: PlanTier;
  billingInterval: BillingInterval;
  successUrl?: string;
}

export function getClientToken(): string {
  const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || "";

  if (!token) {
    throw new Error("NEXT_PUBLIC_PADDLE_CLIENT_TOKEN is not set in environment variables");
  }

  return token;
}

export function getEnvironment(): "sandbox" | "production" {
  const env = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT || "production";
  return env === "sandbox" ? "sandbox" : "production";
}
