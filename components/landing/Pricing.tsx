'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Loader2 } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { useCurrency } from '@/hooks/useCurrency'
import { CheckoutModal } from '@/components/checkout/CheckoutModal'
import type { PlanTier, BillingInterval } from '@/lib/payments/paddle'

const pricingData = {
  subscription: {
    basic: { monthly: 9.99, annually: 101.99 },
    pro: { monthly: 14.99, annually: 152.99 },
    enterprise: { monthly: 29.99, annually: 305.99 },
  },
  perpetual: {
    basic: 99.99,
    pro: 149.99,
    enterprise: 299.99,
  },
}

type LicenseType = 'subscription' | 'perpetual'
type BillingPeriod = 'monthly' | 'annually'

interface PricingProps {
  user?: {
    id?: string
    name?: string | null
    email?: string
  } | null
}

export function Pricing({ user }: PricingProps) {
  const t = useTranslations('landing.pricing')
  const [licenseType, setLicenseType] = useState<LicenseType>('subscription')
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly')
  const { currency, isLoading, convertPrice } = useCurrency()

  // Checkout modal state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<{
    tier: PlanTier
    interval: BillingInterval
    name: string
    price: string
  } | null>(null)

  const getPrice = (plan: 'basic' | 'pro' | 'enterprise') => {
    if (licenseType === 'perpetual') {
      return pricingData.perpetual[plan]
    }
    return pricingData.subscription[plan][billingPeriod]
  }

  const getPeriodText = () => {
    if (licenseType === 'perpetual') return t('period.oneTime')
    return billingPeriod === 'monthly' ? t('period.month') : t('period.year')
  }

  const handlePlanSelect = (plan: 'basic' | 'pro' | 'enterprise') => {
    // If user is logged in, open checkout modal
    if (user?.id) {
      const usdPrice = getPrice(plan)
      const convertedPrice = convertPrice(usdPrice)
      const formattedPrice = `${currency.symbol}${convertedPrice.toLocaleString()}`

      const billingInterval: BillingInterval =
        licenseType === 'perpetual' ? 'perpetual' : (billingPeriod === 'annually' ? 'ANNUALLY' : 'monthly')

      setSelectedPlan({
        tier: plan as PlanTier,
        interval: billingInterval,
        name: plan.charAt(0).toUpperCase() + plan.slice(1),
        price: formattedPrice,
      })
      setIsCheckoutOpen(true)
    }
    // If not logged in, buttons will use Link to /auth/signup
  }

  const renderPrice = (plan: 'basic' | 'pro' | 'enterprise') => {
    const usdPrice = getPrice(plan)
    const convertedPrice = convertPrice(usdPrice)
    const showConversion = currency.code !== 'USD'

    if (isLoading) {
      return (
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Converting...</span>
        </div>
      )
    }

    return (
      <div>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-4xl font-bold text-foreground">
            {currency.symbol}{convertedPrice.toLocaleString()}
          </span>
          <span className="text-muted-foreground ml-1">{getPeriodText()}</span>
        </div>
        {showConversion && (
          <div className="text-xs text-muted-foreground mt-1">
            (~${usdPrice.toLocaleString()} USD)
          </div>
        )}
      </div>
    )
  }

  return (
    <section id="pricing" className="py-24 bg-background">
      <div className="container px-4 mx-auto">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground">
            {t('heading')}
          </h2>
          <p className="text-xl text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>

        {/* License type toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-4 p-1 rounded-full bg-muted">
            <button
              onClick={() => setLicenseType('subscription')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                licenseType === 'subscription'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('toggle.subscription')}
            </button>
            <button
              onClick={() => setLicenseType('perpetual')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                licenseType === 'perpetual'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('toggle.perpetual')}
            </button>
          </div>
        </div>

        {/* Billing period toggle (only for subscription) */}
        {licenseType === 'subscription' && (
          <div className="flex justify-center mb-12">
            <div className="inline-flex items-center gap-4 p-1 rounded-lg bg-muted/50 border border-border">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-4 py-1.5 rounded text-sm font-medium transition-all ${
                  billingPeriod === 'monthly'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod('annually')}
                className={`px-4 py-1.5 rounded text-sm font-medium transition-all ${
                  billingPeriod === 'annually'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                annually
                {billingPeriod === 'annually' && (
                  <span className="ml-1.5 text-xs text-green-600 dark:text-green-400">
                    (Save 15%)
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Basic Plan */}
          <Card className="hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="text-2xl">{t('plans.basic.name')}</CardTitle>
              <CardDescription>{t('plans.basic.description')}</CardDescription>
              <div className="mt-4">
                {renderPrice('basic')}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {user?.id ? (
                <Button onClick={() => handlePlanSelect('basic')} className="w-full" variant="outline">
                  {t('plans.basic.ctaLoggedIn')}
                </Button>
              ) : (
                <Button asChild className="w-full" variant="outline">
                  <Link href="/auth/signup">{t('plans.basic.cta')}</Link>
                </Button>
              )}
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">{t('features.basic.member_management')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">{t('features.basic.checkin_system')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">{t('features.basic.single_device')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">
                    {licenseType === 'subscription'
                      ? t('features.support.immediate')
                      : t('features.support.within_24hrs')}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">{t('features.pro.payment_tracking')}</span>
                </li>
                <li className="flex items-start gap-2 opacity-40">
                  <Check className="w-5 h-5 shrink-0 mt-0.5" />
                  <span className="text-sm line-through">{t('features.disabled.reports')}</span>
                </li>
                <li className="flex items-start gap-2 opacity-40">
                  <Check className="w-5 h-5 shrink-0 mt-0.5" />
                  <span className="text-sm line-through">{t('features.disabled.whatsapp')}</span>
                </li>
                <li className="flex items-start gap-2 opacity-40">
                  <Check className="w-5 h-5 shrink-0 mt-0.5" />
                  <span className="text-sm line-through">{t('features.disabled.financial_dashboard')}</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Pro Plan - Popular */}
          <Card className="border-primary shadow-xl scale-105 relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground px-6 py-1">
                {t('plans.pro.badge')}
              </Badge>
            </div>
            <CardHeader>
              <CardTitle className="text-2xl">{t('plans.pro.name')}</CardTitle>
              <CardDescription>{t('plans.pro.description')}</CardDescription>
              <div className="mt-4">
                {renderPrice('pro')}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {user?.id ? (
                <Button onClick={() => handlePlanSelect('pro')} className="w-full">
                  {t('plans.pro.ctaLoggedIn')}
                </Button>
              ) : (
                <Button asChild className="w-full">
                  <Link href="/auth/signup">{t('plans.pro.cta')}</Link>
                </Button>
              )}
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">{t('features.basic.member_management')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">{t('features.basic.checkin_system')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">{t('features.pro.multi_device_5')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">
                    {licenseType === 'subscription'
                      ? t('features.support.immediate')
                      : t('features.support.within_24hrs')}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">{t('features.pro.payment_tracking')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">{t('features.pro.reports_analytics')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">{t('features.enterprise.financial_dashboard')}</span>
                </li>
                <li className="flex items-start gap-2 opacity-40">
                  <Check className="w-5 h-5 shrink-0 mt-0.5" />
                  <span className="text-sm line-through">{t('features.disabled.whatsapp')}</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Enterprise Plan */}
          <Card className="hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="text-2xl">{t('plans.enterprise.name')}</CardTitle>
              <CardDescription>{t('plans.enterprise.description')}</CardDescription>
              <div className="mt-4">
                {renderPrice('enterprise')}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {user?.id ? (
                <Button onClick={() => handlePlanSelect('enterprise')} className="w-full" variant="default">
                  {t('plans.enterprise.ctaLoggedIn')}
                </Button>
              ) : (
                <Button asChild className="w-full" variant="default">
                  <Link href="/auth/signup">{t('plans.enterprise.cta')}</Link>
                </Button>
              )}
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">{t('features.basic.member_management')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">{t('features.basic.checkin_system')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">{t('features.enterprise.unlimited_devices')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">
                    {licenseType === 'subscription'
                      ? t('features.support.immediate')
                      : t('features.support.within_24hrs')}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">{t('features.pro.payment_tracking')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">{t('features.pro.reports_analytics')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">{t('features.pro.whatsapp_notifications')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">{t('features.enterprise.financial_dashboard')}</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Note about trial */}
        <p className="text-center text-muted-foreground mt-12 text-sm">
          {t('note')}
        </p>
      </div>

      {/* Checkout Modal (only shows when user is logged in) */}
      {user?.id && selectedPlan && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          planTier={selectedPlan.tier}
          billingInterval={selectedPlan.interval}
          planName={selectedPlan.name}
          price={selectedPlan.price}
        />
      )}
    </section>
  )
}
