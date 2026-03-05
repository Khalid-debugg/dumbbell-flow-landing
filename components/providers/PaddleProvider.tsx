"use client";

import { useEffect } from "react";
import Script from "next/script";
import { getClientToken, getEnvironment } from "@/lib/payments/paddle";

export function PaddleProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (window.Paddle) {
      const environment = getEnvironment();
      if (environment === "sandbox") {
        window.Paddle.Environment.set("sandbox");
      }
      window.Paddle.Initialize({
        token: getClientToken(),
      });
    }
  }, []);

  return (
    <>
      <Script
        src="https://cdn.paddle.com/paddle/v2/paddle.js"
        strategy="afterInteractive"
        onLoad={() => {
          if (window.Paddle) {
            const environment = getEnvironment();
            if (environment === "sandbox") {
              window.Paddle.Environment.set("sandbox");
            }
            window.Paddle.Initialize({
              token: getClientToken(),
            });
          }
        }}
      />
      {children}
    </>
  );
}

export { PaddleProvider as LemonSqueezyProvider };
