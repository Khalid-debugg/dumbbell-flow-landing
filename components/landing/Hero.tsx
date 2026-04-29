'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { ArrowRight, Award, Shield, Zap, BarChart3, Users, Clock } from 'lucide-react'
import { Link } from '@/i18n/routing'
import Image from 'next/image'

interface HeroProps {
  user?: {
    id?: string
    name?: string | null
    email?: string
  } | null
}

export function Hero({ user }: HeroProps = {}) {
  const t = useTranslations('landing.hero')

  return (
    <section className="relative flex items-center justify-center overflow-hidden bg-background">
      {/* Background pattern - adapts to theme */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10 dark:from-primary/10 dark:via-background dark:to-primary/5" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,hsl(var(--primary)/0.15),transparent_50%)]" />

      {/* Animated grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_2px,transparent_2px),linear-gradient(to_bottom,hsl(var(--border))_2px,transparent_2px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)] opacity-20" />

      <div className="container relative z-10 px-4 py-8 mx-auto">
        {/* Dumbbellflow Title at Top Center */}
        <div className="flex justify-center mb-16" dir='ltr'>
          <h2 className="font-display font-black text-6xl md:text-7xl lg:text-8xl xl:text-9xl tracking-tight relative group cursor-default">
            <span className="relative inline-block bg-gradient-to-r from-primary via-primary/90 to-primary bg-clip-text text-transparent drop-shadow-[0_0_30px_hsl(var(--primary)/0.5)] animate-pulse-subtle">
              Dumbbell
            </span>
            <span className="relative inline-block text-foreground drop-shadow-[0_4px_20px_hsl(var(--foreground)/0.3)] group-hover:drop-shadow-[0_4px_30px_hsl(var(--foreground)/0.5)] transition-all duration-300">
              Flow
            </span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Center column - Main hero image and text overlay */}
          <div className="relative">
            <div className="relative min-h-[600px] flex items-end justify-center pb-8">
              {/* Large overlaid text - positioned at bottom */}
              <div className="relative z-20 pointer-events-none select-none">
                <h1 className="font-display font-black text-[9vw] lg:text-[5.5rem] xl:text-[8rem] leading-none tracking-tighter">
                  <span
                    className="block text-transparent drop-shadow-[0_4px_20px_hsl(var(--background)/0.8)]"
                    style={{
                      WebkitTextStroke: '3px hsl(var(--foreground)/0.5)',
                      filter: 'drop-shadow(0 0 40px hsl(var(--background))) drop-shadow(0 0 20px hsl(var(--background)))'
                    }}
                  >
                    POWERING GYMS
                  </span>
                  <span
                    className="block text-primary drop-shadow-[0_4px_30px_hsl(var(--primary)/0.6)]"
                    style={{
                      filter: 'drop-shadow(0 0 40px hsl(var(--background))) drop-shadow(0 0 20px hsl(var(--primary)/0.4))'
                    }}
                  >
                    DRIVING RESULTS
                  </span>
                </h1>
              </div>

              {/* Hero Image */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[75%] max-w-md aspect-[3/4] z-10">
                <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl ring-1 ring-primary/20">
                  {/* Replace this src with your actual image path */}
                  <Image
                    src="/hero-gym-image.jpg"
                    alt="Gym workout"
                    fill
                    sizes="(max-width: 1024px) 75vw, 448px"
                    className="object-cover"
                    priority
                  />
                  {/* Enhanced gradient overlay - adapts to theme */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-background/40" />
                </div>
              </div>

              {/* Decorative elements - theme aware */}
              <div className="absolute top-0 right-0 w-32 h-32 border-4 border-primary/20 rounded-full opacity-50 blur-sm animate-pulse" />
              <div className="absolute bottom-0 left-0 w-24 h-24 border-4 border-primary/30 rounded-full opacity-70" />
              <div className="absolute top-1/4 -left-8 w-16 h-16 bg-primary/10 rounded-full blur-2xl" />
              <div className="absolute bottom-1/4 -right-8 w-20 h-20 bg-primary/10 rounded-full blur-2xl" />
            </div>
          </div>

          {/* Right column - Content and CTA */}
          <div className="flex flex-col gap-8 h-full justify-between">
            <div className="space-y-4">
              {/* Tagline */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-medium text-foreground uppercase tracking-wider">
                  {t('tagline', { default: 'Transform Your Business' })}
                </span>
              </div>

              <p className="text-muted-foreground text-base leading-relaxed">
                {t('description', {
                  default: 'With Dumbbellflow, your gym doesn\'t just grow — it thrives. Our proven management system focuses on member engagement, revenue growth, and operational excellence.'
                })}
              </p>

              <Button
                asChild
                variant="outline"
                className="group w-full sm:w-auto"
              >
                <Link href="#features">
                  {t('cta.learnMore', { default: 'Explore Features' })}
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>

            {/* System Perks Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-6">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm hover:bg-card transition-colors">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    {t('features.security', { default: 'Secure Platform' })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t('features.securityDesc', { default: 'Enterprise-grade security' })}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm hover:bg-card transition-colors">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    {t('features.performance', { default: 'Lightning Fast' })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t('features.performanceDesc', { default: 'Optimized performance' })}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm hover:bg-card transition-colors">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    {t('features.analytics', { default: 'Advanced Analytics' })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t('features.analyticsDesc', { default: 'Real-time insights' })}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm hover:bg-card transition-colors">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    {t('features.management', { default: 'Member Management' })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t('features.managementDesc', { default: 'Complete control' })}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm hover:bg-card transition-colors">
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    {t('features.support', { default: '24/7 Support' })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t('features.supportDesc', { default: 'Always available' })}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-xl bg-card/50 border border-border/50 backdrop-blur-sm hover:bg-card transition-colors">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <Award className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    {t('features.certified', { default: 'Industry Certified' })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t('features.certifiedDesc', { default: 'Trusted by experts' })}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom CTA Bar - Only show if user is NOT logged in */}
            {!user?.id && (
              <div className="flex items-center gap-4 justify-end">
                <Button
                  asChild
                  variant="outline"
                  className="rounded-full px-6 group"
                >
                  <Link href="/auth/signin">
                    {t('cta.login', { default: 'Sign In' })}
                  </Link>
                </Button>

                <Button
                  asChild
                  size="lg"
                  className="rounded-full px-8 group shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
                >
                  <Link href="/auth/signup">
                    {t('cta.primary', { default: 'Start Free Trial' })}
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 animate-bounce hidden lg:block">
        <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/20 flex items-start justify-center p-2">
          <div className="w-1.5 h-3 bg-muted-foreground/40 rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  )
}
