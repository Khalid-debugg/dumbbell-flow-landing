import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import {
  getPriceId,
  type PlanTier,
  type BillingInterval,
} from "@/lib/payments/paddle";

export const runtime = "nodejs";

interface CheckoutRequestBody {
  planTier: PlanTier;
  billingInterval: BillingInterval;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const body: CheckoutRequestBody = await request.json();
    const { planTier, billingInterval } = body;

    if (!["basic", "pro", "enterprise"].includes(planTier)) {
      return NextResponse.json(
        { error: "Invalid plan tier" },
        { status: 400 }
      );
    }

    if (!["monthly", "ANNUALLY", "perpetual"].includes(billingInterval)) {
      return NextResponse.json(
        { error: "Invalid billing interval" },
        { status: 400 }
      );
    }

    let priceId: string;
    try {
      priceId = getPriceId(planTier, billingInterval);
    } catch (error) {
      console.error("Error getting price ID:", error);
      return NextResponse.json(
        {
          error:
            "Product price not configured. Please contact support or check environment variables.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      priceId,
      userId: session.user.id,
      customer: {
        email: session.user.email,
      },
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/dashboard?checkout=success`,
    });
  } catch (error) {
    console.error("Checkout API error:", error);

    return NextResponse.json(
      {
        error: "Failed to prepare checkout session",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
