"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { PlanTier, BillingInterval } from "@/lib/payments/paddle";
import { getPriceId } from "@/lib/payments/paddle";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  planTier: PlanTier;
  billingInterval: BillingInterval;
  planName: string;
  price: string;
}

export function CheckoutModal({
  isOpen,
  onClose,
  planTier,
  billingInterval,
  planName,
  price,
}: CheckoutModalProps) {
  const t = useTranslations('checkout.modal');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paddleReady, setPaddleReady] = useState(false);

  useEffect(() => {
    const checkPaddle = () => {
      if (window.Paddle) {
        setPaddleReady(true);
        return true;
      }
      return false;
    };

    if (!checkPaddle()) {
      const interval = setInterval(() => {
        if (checkPaddle()) {
          clearInterval(interval);
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, []);

  const handleCheckout = async () => {
    if (!paddleReady || !window.Paddle) {
      setError("Paddle is not ready. Please try again.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const priceId = getPriceId(planTier, billingInterval);

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planTier,
          billingInterval,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Checkout failed:", {
          status: response.status,
          error: data.error,
          details: data.details,
          fullResponse: data
        });
        throw new Error(data.error || "Failed to create checkout session");
      }

      window.Paddle.Checkout.open({
        settings: {
          displayMode: "overlay",
          theme: "light",
          locale: "en",
          successUrl: data.successUrl || `${window.location.origin}/dashboard?checkout=success`,
        },
        items: [
          {
            priceId: priceId,
            quantity: 1,
          },
        ],
        customer: data.customer ? {
          email: data.customer.email,
        } : undefined,
        customData: {
          userId: data.userId,
          planTier: planTier,
          billingInterval: billingInterval,
        },
      });

      onClose();
    } catch (err) {
      console.error("Checkout error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {planName} - {t(`title.${billingInterval}`)}
          </DialogTitle>
          <DialogDescription>
            {t('description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{planName} {t('plan')}</p>
                <p className="text-sm text-muted-foreground">
                  {t(`billing.${billingInterval === "perpetual" ? "oneTime" : billingInterval}`)}
                </p>
              </div>
              <p className="text-2xl font-bold">{price}</p>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button
            onClick={handleCheckout}
            disabled={isLoading || !paddleReady}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('button.loading')}
              </>
            ) : !paddleReady ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Initializing...
              </>
            ) : (
              t('button.proceed')
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            {t('footer')}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

declare global {
  interface Window {
    Paddle?: {
      Initialize: (config: { token: string }) => void;
      Environment: {
        set: (env: "sandbox" | "production") => void;
      };
      Checkout: {
        open: (options: {
          settings?: {
            displayMode?: "overlay" | "inline";
            theme?: "light" | "dark";
            locale?: string;
            successUrl?: string;
          };
          items: Array<{
            priceId: string;
            quantity: number;
          }>;
          customer?: {
            email?: string;
            address?: {
              countryCode?: string;
              postalCode?: string;
              region?: string;
            };
          };
          customData?: Record<string, unknown>;
        }) => void;
      };
    };
  }
}
