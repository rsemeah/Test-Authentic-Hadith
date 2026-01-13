'use client';

import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    todayHadith: 1,
    totalSaved: 0,
    aiQueries: 0,
    streakDays: 0,
  });

  useEffect(() => {
    // Fetch user stats from /api/user/profile
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/user/profile');
        const data = await response.json();
        if (data.profile) {
          setStats({
            todayHadith: 1,
            totalSaved: data.profile.saved_count || 0,
            aiQueries: data.profile.ai_queries_used || 0,
            streakDays: 0,
          });
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="p-8 space-y-8">
      {/* Welcome Section */}
      <div className="mb-12">
        <h1 className="text-4xl font-playfair font-bold text-white mb-2">
          Welcome Back
        </h1>
        <p className="text-gray-400">
          Continue your Islamic learning journey with authentic hadith
        </p>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Today's Hadith"
          value={stats.todayHadith}
          icon="📿"
          color="from-gold to-gold/80"
        />
        <StatCard
          label="Saved Hadith"
          value={stats.totalSaved}
          icon="❤️"
          color="from-emerald-green to-emerald-green/80"
        />
        <StatCard
          label="AI Questions"
          value={stats.aiQueries}
          icon="✨"
          color="from-blue-500 to-blue-600"
        />
        <StatCard
          label="Learning Streak"
          value={`${stats.streakDays} days`}
          icon="🔥"
          color="from-orange-500 to-orange-600"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Featured Collection */}
        <div className="lg:col-span-2 bg-islamic-darker rounded-lg border border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Featured Collection
          </h2>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-gold/20 to-gold/10 rounded-lg flex items-center justify-center text-4xl">
              📖
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">
                Sahih Al-Bukhari
              </h3>
              <p className="text-sm text-gray-400 mb-3">
                The most authentic collection of hadith with 7,563 traditions
              </p>
              <a
                href="/collections"
                className="inline-block px-4 py-2 bg-gold/20 hover:bg-gold/30 text-gold rounded-lg text-sm font-medium transition"
              >
                Browse Collection →
              </a>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-islamic-darker rounded-lg border border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <QuickAction href="/search" icon="🔍" label="Search Hadith" />
            <QuickAction href="/learn" icon="🎓" label="Learn Paths" />
            <QuickAction href="/assistant" icon="✨" label="Ask AI" />
            <QuickAction href="/settings" icon="⚙️" label="Settings" />
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="bg-gradient-to-r from-islamic-darker to-islamic-darker/50 rounded-lg border border-gold/20 p-8">
        <h2 className="text-2xl font-playfair font-bold text-gold mb-4">
          About Authentic Hadith
        </h2>
        <p className="text-gray-300 mb-4">
          Authentic Hadith is a safe, evidence-based Islamic education platform featuring:
        </p>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-300">
          <li className="flex items-center gap-2">
            <span className="text-gold">✓</span> 36,245+ authenticated hadith
          </li>
          <li className="flex items-center gap-2">
            <span className="text-gold">✓</span> AI-powered explanations
          </li>
          <li className="flex items-center gap-2">
            <span className="text-gold">✓</span> Safety-first approach
          </li>
          <li className="flex items-center gap-2">
            <span className="text-gold">✓</span> Multiple translations
          </li>
        </ul>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: string;
  color: string;
}) {
  return (
    <div className={`bg-gradient-to-br ${color} rounded-lg p-6 text-white`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-3xl">{icon}</span>
      </div>
      <p className="text-sm opacity-90 mb-1">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  label,
}: {
  href: string;
  icon: string;
  label: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 p-3 rounded-lg bg-islamic-dark hover:bg-islamic-dark/80 text-gray-300 hover:text-gold transition"
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </a>
  );
}
