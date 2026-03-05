import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { ThemeProvider } from 'next-themes'
import { Antonio, Inter } from 'next/font/google'
import { TopLoader } from '@/components/ui/TopLoader'
import { PaddleProvider } from '@/components/providers/PaddleProvider'
import '../globals.css'

const antonio = Antonio({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-antonio',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Dumbbellflow - Gym Management Software',
  description: 'Powerful software to manage members, payments, and operations for your fitness center',
}

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages()

  // Determine text direction based on locale
  const direction = locale === 'ar' ? 'rtl' : 'ltr'

  return (
    <html lang={locale} dir={direction} suppressHydrationWarning>
      <body className={`${inter.variable} ${antonio.variable} font-sans antialiased`}>
        <TopLoader />
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <PaddleProvider>
              {children}
            </PaddleProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
