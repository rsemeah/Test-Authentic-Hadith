'use client';

import { useEffect, useState } from 'react';

interface UserProfile {
  id: string;
  email: string;
  name?: string;
  tier: 'free' | 'premium' | 'lifetime';
  ai_queries_used: number;
  ai_queries_limit: number;
  saved_count: number;
  created_at: string;
}

interface SubscriptionTier {
  name: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  recommended?: boolean;
}

const TIERS: Record<string, SubscriptionTier> = {
  free: {
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: [
      'Access to 36,245 hadith',
      '5 AI questions per day',
      'Save up to 50 hadith',
      'Basic search',
    ],
    cta: 'Current Plan',
  },
  premium: {
    name: 'Premium',
    price: '$9.99',
    period: '/month',
    features: [
      'Everything in Free',
      'Unlimited AI questions',
      'Unlimited saved hadith',
      'Advanced search filters',
      'Priority support',
    ],
    cta: 'Upgrade',
    recommended: true,
  },
  lifetime: {
    name: 'Lifetime',
    price: '$199.99',
    period: 'one-time',
    features: [
      'Everything in Premium',
      'Lifetime access',
      'Ad-free experience',
      'Offline downloads',
      'VIP support',
    ],
    cta: 'Upgrade',
  },
};

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/user/profile');
        const data = await response.json();
        setProfile(data.profile);
      } catch (err) {
        setError('Failed to load profile');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleUpgrade = async (tier: string) => {
    try {
      const response = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Upgrade failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="space-y-6">
          <div className="card animate-pulse h-40 bg-islamic-darker" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card animate-pulse h-80 bg-islamic-darker" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Profile Section */}
      <div className="mb-12">
        <h1 className="text-4xl font-playfair font-bold mb-8">Settings</h1>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-8 text-red-400">
            {error}
          </div>
        )}

        {profile && (
          <div className="card">
            <div className="flex items-start justify-between mb-6 pb-6 border-b border-gray-700">
              <div>
                <h2 className="text-2xl font-semibold text-white mb-1">
                  {profile.name || profile.email}
                </h2>
                <p className="text-gray-400">{profile.email}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400 mb-1">Current Plan</p>
                <p className="text-2xl font-bold text-gold capitalize">
                  {profile.tier}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-400 mb-1">AI Questions</p>
                <p className="text-2xl font-bold text-white">
                  {profile.ai_queries_used} / {profile.ai_queries_limit}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Saved Hadith</p>
                <p className="text-2xl font-bold text-white">
                  {profile.saved_count}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Member Since</p>
                <p className="text-2xl font-bold text-white">
                  {new Date(profile.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Subscription Tiers */}
      <div className="mb-12">
        <h2 className="text-2xl font-playfair font-bold mb-8">Upgrade Your Plan</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(TIERS).map(([key, tier]) => (
            <div
              key={key}
              className={`card flex flex-col ${
                tier.recommended ? 'border-gold/50 relative' : ''
              }`}
            >
              {tier.recommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 badge-gold">
                  Recommended
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">
                  {tier.name}
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-gold">
                    {tier.price}
                  </span>
                  <span className="text-gray-400 text-sm">{tier.period}</span>
                </div>
              </div>

              <ul className="space-y-3 flex-1 mb-6">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-300">
                    <span className="text-gold">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade(key)}
                disabled={profile?.tier === key}
                className={`w-full py-3 rounded-lg font-semibold transition ${
                  profile?.tier === key
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'btn-gold'
                }`}
              >
                {tier.cta}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Account Actions */}
      <div className="card">
        <h3 className="text-xl font-bold text-white mb-6">Account</h3>
        <div className="space-y-3">
          <button className="w-full text-left p-3 rounded-lg hover:bg-islamic-dark transition text-gray-300 hover:text-gold">
            Change Password
          </button>
          <button className="w-full text-left p-3 rounded-lg hover:bg-islamic-dark transition text-gray-300 hover:text-gold">
            Email Preferences
          </button>
          <button className="w-full text-left p-3 rounded-lg hover:bg-islamic-dark transition text-red-400 hover:text-red-300">
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
