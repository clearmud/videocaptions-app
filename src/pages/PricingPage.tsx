import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getPricingInfo, createCheckoutSession, PricingTier, CreditPack } from '../services/api/payment';

export function PricingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [creditPacks, setCreditPacks] = useState<CreditPack[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    loadPricing();
  }, []);

  const loadPricing = async () => {
    try {
      const response = await getPricingInfo();
      setTiers(response.tiers);
      setCreditPacks(response.creditPacks);
    } catch (error) {
      console.error('Failed to load pricing:', error);
    }
  };

  const handleSubscribe = async (tierId: string) => {
    if (!user) {
      navigate('/register');
      return;
    }

    setLoading(tierId);
    try {
      const response = await createCheckoutSession(tierId, 'subscription');
      window.location.href = response.url;
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      setLoading(null);
    }
  };

  const handleBuyCreditPack = async (packId: string) => {
    if (!user) {
      navigate('/register');
      return;
    }

    setLoading(packId);
    try {
      const response = await createCheckoutSession(packId, 'credit_pack');
      window.location.href = response.url;
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-gray-400">Start free, upgrade when you need more</p>
        </div>

        {/* Subscription Tiers */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={`rounded-2xl p-8 ${
                tier.id === 'starter'
                  ? 'bg-gradient-to-br from-purple-600 to-pink-600 transform scale-105'
                  : 'bg-gray-800'
              }`}
            >
              {tier.id === 'starter' && (
                <span className="inline-block bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-sm font-bold mb-4">
                  MOST POPULAR
                </span>
              )}
              <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
              <div className="mb-6">
                <span className="text-5xl font-bold">${tier.price}</span>
                <span className="text-gray-400">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  {tier.monthlyMinutes} minutes/month
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  {tier.exportQuality} export
                </li>
                <li className="flex items-center gap-2">
                  <span className={tier.watermark ? 'text-red-400' : 'text-green-400'}>
                    {tier.watermark ? '✗' : '✓'}
                  </span>
                  {tier.watermark ? 'Watermarked' : 'No watermark'}
                </li>
                <li className="flex items-center gap-2">
                  <span className={tier.features.priorityProcessing ? 'text-green-400' : 'text-gray-600'}>
                    {tier.features.priorityProcessing ? '✓' : '✗'}
                  </span>
                  Priority processing
                </li>
                <li className="flex items-center gap-2">
                  <span className={tier.features.apiAccess ? 'text-green-400' : 'text-gray-600'}>
                    {tier.features.apiAccess ? '✓' : '✗'}
                  </span>
                  API access
                </li>
              </ul>
              <button
                onClick={() => handleSubscribe(tier.id)}
                disabled={loading === tier.id || (user?.subscription_tier === tier.id)}
                className={`w-full py-3 px-4 rounded-lg font-bold text-center transition-all ${
                  user?.subscription_tier === tier.id
                    ? 'bg-gray-600 cursor-not-allowed'
                    : tier.id === 'starter'
                    ? 'bg-white text-purple-600 hover:bg-gray-100'
                    : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {loading === tier.id
                  ? 'Loading...'
                  : user?.subscription_tier === tier.id
                  ? 'Current Plan'
                  : tier.price === 0
                  ? 'Current Plan'
                  : 'Get Started'}
              </button>
            </div>
          ))}
        </div>

        {/* Credit Packs */}
        {user && user.subscription_tier !== 'free' && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Need Extra Minutes?</h2>
              <p className="text-gray-400">Buy one-time credit packs (never expire)</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {creditPacks.map((pack) => (
                <div key={pack.id} className="bg-gray-800 rounded-lg p-6 text-center">
                  <h3 className="text-xl font-bold mb-2">{pack.minutes} Minutes</h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold">${pack.price}</span>
                  </div>
                  <p className="text-sm text-gray-400 mb-4">One-time purchase</p>
                  <button
                    onClick={() => handleBuyCreditPack(pack.id)}
                    disabled={loading === pack.id}
                    className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900 rounded-lg font-semibold transition-all"
                  >
                    {loading === pack.id ? 'Loading...' : 'Buy Now'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center mt-12">
          <button
            onClick={() => navigate(user ? '/dashboard' : '/')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Back to {user ? 'Dashboard' : 'Home'}
          </button>
        </div>
      </div>
    </div>
  );
}
