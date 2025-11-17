import { apiClient } from './client';

export interface PricingTier {
  id: string;
  name: string;
  price: number;
  monthlyMinutes: number;
  features: Record<string, boolean>;
  exportQuality: string;
  watermark: boolean;
}

export interface CreditPack {
  id: string;
  minutes: number;
  price: number;
}

export async function getPricingInfo(): Promise<{
  success: boolean;
  tiers: PricingTier[];
  creditPacks: CreditPack[];
}> {
  return apiClient.get('/payment/pricing');
}

export async function createCheckoutSession(tier: string, type: 'subscription' | 'credit_pack' = 'subscription'): Promise<{
  success: boolean;
  sessionId: string;
  url: string;
}> {
  return apiClient.post('/payment/create-checkout-session', { tier, type });
}

export async function createPortalSession(): Promise<{
  success: boolean;
  url: string;
}> {
  return apiClient.post('/payment/create-portal-session');
}
