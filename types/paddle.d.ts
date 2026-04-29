interface PaddleCheckoutItem {
  priceId: string
  quantity: number
}

interface PaddleCheckoutCustomerAddress {
  countryCode?: string
  postalCode?: string
  region?: string
}

interface PaddleCheckoutCustomer {
  email?: string
  address?: PaddleCheckoutCustomerAddress
}

interface PaddleCheckoutSettings {
  successUrl?: string
  displayMode?: 'overlay' | 'inline'
  theme?: 'light' | 'dark'
  locale?: string
}

interface PaddleCheckoutOptions {
  items: PaddleCheckoutItem[]
  customer?: PaddleCheckoutCustomer
  customData?: Record<string, unknown>
  settings?: PaddleCheckoutSettings
}

interface PaddleCheckout {
  open(options: PaddleCheckoutOptions): void
}

interface PaddleEnvironment {
  set(env: 'sandbox' | 'production'): void
}

interface PaddleInstance {
  Initialize(options: { token: string }): void
  Checkout: PaddleCheckout
  Environment: PaddleEnvironment
}

interface Window {
  Paddle?: PaddleInstance
}
