import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/db/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Calendar, Package, AlertCircle } from "lucide-react";
import Link from "next/link";

export default async function BillingPage({
  params,
}: {
  params: { locale: string };
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/${params.locale}/auth/signin` as any);
  }

  // Fetch user with subscription details
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      subscriptionStatus: true,
      subscriptionType: true,
      planTier: true,
      deviceLimit: true,
      subscriptionEndsAt: true,
    },
  });

  if (!user) {
    redirect(`/${params.locale}/auth/signin` as any);
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      trial: "secondary",
      active: "default",
      cancelled: "destructive",
      expired: "destructive",
      past_due: "destructive",
      paused: "outline",
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {status.charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}
      </Badge>
    );
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isTrialActive = user.subscriptionStatus === "trial";
  const hasActiveSubscription =
    user.subscriptionStatus === "active" &&
    user.subscriptionType === "subscription";

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing details
        </p>
      </div>

      <div className="space-y-6">
        {/* Current Plan */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Current Plan
                </CardTitle>
                <CardDescription>Your subscription details</CardDescription>
              </div>
              {getStatusBadge(user.subscriptionStatus)}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Plan Tier</p>
                <p className="text-lg font-semibold capitalize">
                  {user.planTier || "Trial"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Subscription Type
                </p>
                <p className="text-lg font-semibold capitalize">
                  {user.subscriptionType || "Trial"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Device Activations
                </p>
                <p className="text-lg font-semibold">
                  {user.deviceLimit === 999999
                    ? "Unlimited"
                    : user.deviceLimit}
                </p>
              </div>
              {isTrialActive && (
                <div>
                  <p className="text-sm text-muted-foreground">Trial Ends</p>
                  <p className="text-lg font-semibold">
                    {formatDate(user.subscriptionEndsAt)}
                  </p>
                </div>
              )}
            </div>

            {isTrialActive && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/50 bg-amber-500/10 p-4">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                <div className="flex-1">
                  <p className="font-medium">Trial Period Active</p>
                  <p className="text-sm text-muted-foreground">
                    Your trial expires on {formatDate(user.subscriptionEndsAt)}.
                    Upgrade now to continue using Dumbbellflow after your trial
                    ends.
                  </p>
                </div>
              </div>
            )}

          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Manage Subscription
            </CardTitle>
            <CardDescription>
              Change your plan or update billing details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isTrialActive && (
              <Link href={{ pathname: '/', hash: 'pricing' }}>
                <Button className="w-full" size="lg">
                  Upgrade Now
                </Button>
              </Link>
            )}

            {hasActiveSubscription && (
              <>
                <Link href={{ pathname: '/', hash: 'pricing' }}>
                  <Button variant="outline" className="w-full">
                    Change Plan
                  </Button>
                </Link>
                <p className="text-sm text-muted-foreground">
                  To manage your billing details, cancel, or view invoices,
                  please visit the Paddle customer portal.
                </p>
                <Button variant="secondary" className="w-full" asChild>
                  <a
                    href="https://customer.paddle.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open Customer Portal
                  </a>
                </Button>
              </>
            )}

            {user.subscriptionStatus === "cancelled" && (
              <>
                <p className="text-sm text-destructive">
                  Your subscription has been cancelled and will expire soon.
                </p>
                <Link href={{ pathname: '/', hash: 'pricing' }}>
                  <Button className="w-full">Reactivate Subscription</Button>
                </Link>
              </>
            )}

            {user.subscriptionStatus === "past_due" && (
              <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
                <p className="font-medium text-destructive">
                  Payment Issue Detected
                </p>
                <p className="text-sm text-muted-foreground">
                  Your last payment failed. Please update your payment method
                  to continue using Dumbbellflow.
                </p>
                <Button
                  variant="destructive"
                  className="mt-3 w-full"
                  asChild
                >
                  <a
                    href="https://customer.paddle.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Update Payment Method
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Billing History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Billing History
            </CardTitle>
            <CardDescription>View your payment history and invoices</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              To view your complete billing history and download invoices,
              visit the Paddle customer portal.
            </p>
            <Button variant="outline" className="mt-4 w-full" asChild>
              <a
                href="https://customer.paddle.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                View Billing History
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
