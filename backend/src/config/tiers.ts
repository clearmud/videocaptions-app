export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    monthlyMinutes: 10,
    maxVideoLength: 10, // minutes
    maxFileSize: 100, // MB
    exportQuality: '720p',
    watermark: true,
    features: {
      basicEditing: true,
      animations: true,
      srtExport: true,
      videoExport: true,
      customFonts: false,
      batchProcessing: false,
      priorityProcessing: false,
      apiAccess: false,
      whiteLabel: false,
    },
  },
  starter: {
    name: 'Starter',
    price: 14, // USD per month
    stripePriceId: process.env.STRIPE_STARTER_PRICE_ID || '',
    monthlyMinutes: 90,
    maxVideoLength: 30,
    maxFileSize: 500,
    exportQuality: '1080p',
    watermark: false,
    features: {
      basicEditing: true,
      animations: true,
      srtExport: true,
      videoExport: true,
      customFonts: false,
      batchProcessing: false,
      priorityProcessing: true,
      apiAccess: false,
      whiteLabel: false,
    },
  },
  pro: {
    name: 'Pro',
    price: 39,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || '',
    monthlyMinutes: 360,
    maxVideoLength: 60,
    maxFileSize: 2000, // 2GB
    exportQuality: '4k',
    watermark: false,
    features: {
      basicEditing: true,
      animations: true,
      srtExport: true,
      videoExport: true,
      customFonts: true,
      batchProcessing: true,
      priorityProcessing: true,
      apiAccess: true,
      whiteLabel: true,
    },
  },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;

export const CREDIT_PACKS = {
  small: {
    minutes: 50,
    price: 8,
    stripePriceId: process.env.STRIPE_CREDIT_PACK_SMALL || '',
  },
  medium: {
    minutes: 150,
    price: 20,
    stripePriceId: process.env.STRIPE_CREDIT_PACK_MEDIUM || '',
  },
  large: {
    minutes: 500,
    price: 60,
    stripePriceId: process.env.STRIPE_CREDIT_PACK_LARGE || '',
  },
} as const;

export function getTierConfig(tier: SubscriptionTier) {
  return SUBSCRIPTION_TIERS[tier];
}

export function hasFeatureAccess(tier: SubscriptionTier, feature: string): boolean {
  const config = SUBSCRIPTION_TIERS[tier];
  return config.features[feature as keyof typeof config.features] || false;
}
