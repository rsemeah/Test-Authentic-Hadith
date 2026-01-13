'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
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

  if (loading) {
    return (
      <div className="p-8">
        <div className="card animate-pulse h-96 bg-islamic-darker" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-red-400">
          {error || 'Failed to load profile'}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-4xl font-playfair font-bold mb-8">Profile</h1>

      {/* Profile Card */}
      <div className="card mb-8">
        <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-700">
          <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center text-4xl">
            👤
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-white mb-1">
              {profile.name || profile.email}
            </h2>
            <p className="text-gray-400">{profile.email}</p>
            <p className="text-sm text-gold mt-2">
              Tier: <span className="capitalize font-semibold">{profile.tier}</span>
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 text-center">
          <div>
            <p className="text-3xl font-bold text-gold mb-1">
              {profile.saved_count || 0}
            </p>
            <p className="text-sm text-gray-400">Saved Hadith</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-emerald-bright mb-1">
              {profile.ai_queries_limit || 5}
            </p>
            <p className="text-sm text-gray-400">Daily AI Limit</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-blue-400 mb-1">
              {profile.tier === 'premium' ? '∞' : profile.ai_queries_limit || 5}
            </p>
            <p className="text-sm text-gray-400">Questions Left</p>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="space-y-4">
        <Link href="/settings" className="block card-hover p-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-white">Settings & Subscription</span>
            <span className="text-gold">→</span>
          </div>
        </Link>
        <Link href="/saved" className="block card-hover p-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-white">Saved Hadith</span>
            <span className="text-gold">→</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
