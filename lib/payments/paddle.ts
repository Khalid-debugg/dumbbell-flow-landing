const isSandbox =
  (process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT || "sandbox") === "sandbox";

const env = isSandbox ? "SANDBOX" : "PRODUCTION";

export const PRODUCT_PRICES = {
  BASIC_MONTHLY:   process.env[`NEXT_PUBLIC_PADDLE_PRICE_BASIC_MONTHLY_${env}`]   || "",
  BASIC_ANNUALLY:  process.env[`NEXT_PUBLIC_PADDLE_PRICE_BASIC_ANNUALLY_${env}`]  || "",
  PRO_MONTHLY:     process.env[`NEXT_PUBLIC_PADDLE_PRICE_PRO_MONTHLY_${env}`]     || "",
  PRO_ANNUALLY:    process.env[`NEXT_PUBLIC_PADDLE_PRICE_PRO_ANNUALLY_${env}`]    || "",
  PREMIUM_MONTHLY: process.env[`NEXT_PUBLIC_PADDLE_PRICE_PREMIUM_MONTHLY_${env}`] || "",
  PREMIUM_ANNUALLY:process.env[`NEXT_PUBLIC_PADDLE_PRICE_PREMIUM_ANNUALLY_${env}`]|| "",
};

export const PLAN_CONFIG = {
  basic: {
    name: "Basic",
    deviceLimit: 1,
    monthly: PRODUCT_PRICES.BASIC_MONTHLY,
    annually: PRODUCT_PRICES.BASIC_ANNUALLY,
  },
  pro: {
    name: "Pro",
    deviceLimit: 5,
    monthly: PRODUCT_PRICES.PRO_MONTHLY,
    annually: PRODUCT_PRICES.PRO_ANNUALLY,
  },
  premium: {
    name: "Premium",
    deviceLimit: 999999,
    monthly: PRODUCT_PRICES.PREMIUM_MONTHLY,
    annually: PRODUCT_PRICES.PREMIUM_ANNUALLY,
  },
};

export type PlanTier = keyof typeof PLAN_CONFIG;
export type BillingInterval = "monthly" | "annually";

export function getPriceId(
  planTier: PlanTier,
  billingInterval: BillingInterval
): string {
  const plan = PLAN_CONFIG[planTier];
  const priceId = plan[billingInterval];

  if (!priceId) {
    throw new Error(`No price ID configured for ${planTier} ${billingInterval} (${env})`);
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
  const token = process.env[`NEXT_PUBLIC_PADDLE_CLIENT_TOKEN_${env}`] || "";

  if (!token) {
    throw new Error(`NEXT_PUBLIC_PADDLE_CLIENT_TOKEN_${env} is not set`);
  }

  return token;
}

export function getEnvironment(): "sandbox" | "production" {
  return isSandbox ? "sandbox" : "production";
}
