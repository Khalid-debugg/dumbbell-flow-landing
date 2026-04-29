'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'
import { Link } from '@/i18n/routing'
import { CheckoutModal } from '@/components/checkout/CheckoutModal'
import type { PlanTier, BillingInterval } from '@/lib/payments/paddle'

const pricingData = {
  basic: { monthly: 29, annually: 290 },
  pro: { monthly: 79, annually: 790 },
  premium: { monthly: 199, annually: 1990 },
}

const ANNUAL_SAVINGS_PERCENT = 17

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
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly')

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<{
    tier: PlanTier
    interval: BillingInterval
    name: string
    price: string
  } | null>(null)

  const getPrice = (plan: PlanTier) => pricingData[plan][billingPeriod]

  const getPeriodText = () =>
    billingPeriod === 'monthly' ? t('period.month') : t('period.year')

  const handlePlanSelect = (plan: PlanTier) => {
    if (!user?.id) return

    setSelectedPlan({
      tier: plan,
      interval: billingPeriod as BillingInterval,
      name: plan.charAt(0).toUpperCase() + plan.slice(1),
      price: `$${getPrice(plan).toLocaleString()}`,
    })
    setIsCheckoutOpen(true)
  }

  const renderPrice = (plan: PlanTier) => (
    <div className="flex items-baseline gap-2">
      <span className="font-display text-4xl font-bold text-foreground">
        ${getPrice(plan).toLocaleString()}
      </span>
      <span className="text-muted-foreground ml-1">{getPeriodText()}</span>
    </div>
  )

  return (
    <section id="pricing" className="py-24 bg-background">
      <div className="container px-4 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-foreground">
            {t('heading')}
          </h2>
          <p className="text-xl text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>

        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-muted/50 border border-border">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-5 py-2 rounded text-sm font-medium transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annually')}
              className={`flex items-center gap-2 px-5 py-2 rounded text-sm font-medium transition-all ${
                billingPeriod === 'annually'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Annually
              <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                Save {ANNUAL_SAVINGS_PERCENT}%
              </span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="text-2xl">{t('plans.basic.name')}</CardTitle>
              <CardDescription>{t('plans.basic.description')}</CardDescription>
              <div className="mt-4">{renderPrice('basic')}</div>
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
                  <span className="text-sm">{t('features.support.immediate')}</span>
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

          <Card className="border-primary shadow-xl scale-105 relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground px-6 py-1">
                {t('plans.pro.badge')}
              </Badge>
            </div>
            <CardHeader>
              <CardTitle className="text-2xl">{t('plans.pro.name')}</CardTitle>
              <CardDescription>{t('plans.pro.description')}</CardDescription>
              <div className="mt-4">{renderPrice('pro')}</div>
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
                  <span className="text-sm">{t('features.support.immediate')}</span>
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
                  <span className="text-sm">{t('features.premium.financial_dashboard')}</span>
                </li>
                <li className="flex items-start gap-2 opacity-40">
                  <Check className="w-5 h-5 shrink-0 mt-0.5" />
                  <span className="text-sm line-through">{t('features.disabled.whatsapp')}</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="text-2xl">{t('plans.premium.name')}</CardTitle>
              <CardDescription>{t('plans.premium.description')}</CardDescription>
              <div className="mt-4">{renderPrice('premium')}</div>
            </CardHeader>
            <CardContent className="space-y-6">
              {user?.id ? (
                <Button onClick={() => handlePlanSelect('premium')} className="w-full" variant="default">
                  {t('plans.premium.ctaLoggedIn')}
                </Button>
              ) : (
                <Button asChild className="w-full" variant="default">
                  <Link href="/auth/signup">{t('plans.premium.cta')}</Link>
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
                  <span className="text-sm">{t('features.premium.unlimited_devices')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">{t('features.support.immediate')}</span>
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
                  <span className="text-sm">{t('features.premium.financial_dashboard')}</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-muted-foreground mt-12 text-sm">
          {t('note')}
        </p>
      </div>

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
