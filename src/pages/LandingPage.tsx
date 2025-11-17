import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPricingInfo, PricingTier } from '../services/api/payment';

export function LandingPage() {
  const [tiers, setTiers] = useState<PricingTier[]>([]);

  useEffect(() => {
    loadPricing();
  }, []);

  const loadPricing = async () => {
    try {
      const response = await getPricingInfo();
      setTiers(response.tiers);
    } catch (error) {
      console.error('Failed to load pricing:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
            CaptionCraft AI
          </h1>
          <div className="flex gap-4">
            <Link
              to="/login"
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
          AI-Powered Video Captions
          <br />
          In Seconds
        </h1>
        <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto">
          Stop spending hours on captions. Upload your video, let AI do the work, and export
          professional-quality captions in under 60 seconds.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/register"
            className="px-8 py-4 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold text-lg transition-all transform hover:scale-105"
          >
            Start Free Trial
          </Link>
          <a
            href="#pricing"
            className="px-8 py-4 border-2 border-purple-600 hover:bg-purple-600/10 rounded-lg font-bold text-lg transition-all"
          >
            View Pricing
          </a>
        </div>
        <p className="mt-6 text-gray-500">
          🎉 First 500 users get 50% off for 6 months
        </p>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-16">Why CaptionCraft?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-gray-800 p-8 rounded-2xl">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-2xl font-bold mb-4">Lightning Fast</h3>
            <p className="text-gray-400">
              Generate accurate captions in under 60 seconds. No more 2-hour manual captioning sessions.
            </p>
          </div>
          <div className="bg-gray-800 p-8 rounded-2xl">
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="text-2xl font-bold mb-4">Real-Time Editor</h3>
            <p className="text-gray-400">
              See exactly what your captions will look like. No export-preview-repeat cycles.
            </p>
          </div>
          <div className="bg-gray-800 p-8 rounded-2xl">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-2xl font-bold mb-4">AI-Powered</h3>
            <p className="text-gray-400">
              Gemini 2.0 Flash delivers industry-leading transcription accuracy.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-4">Simple, Transparent Pricing</h2>
        <p className="text-center text-gray-400 mb-16">Start free, upgrade when you need more</p>

        <div className="grid md:grid-cols-3 gap-8">
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
              <Link
                to={tier.price === 0 ? '/register' : '/register'}
                className={`block w-full py-3 px-4 rounded-lg font-bold text-center transition-all ${
                  tier.id === 'starter'
                    ? 'bg-white text-purple-600 hover:bg-gray-100'
                    : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {tier.price === 0 ? 'Start Free' : 'Get Started'}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-4xl font-bold mb-6">Ready to save hours on video captions?</h2>
        <p className="text-xl text-gray-400 mb-8">
          Join hundreds of creators already using CaptionCraft AI
        </p>
        <Link
          to="/register"
          className="inline-block px-8 py-4 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold text-lg transition-all transform hover:scale-105"
        >
          Start Creating Now →
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-20">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center text-gray-500">
          <p>&copy; 2025 CaptionCraft AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
