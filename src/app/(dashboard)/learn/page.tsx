'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface LearningPath {
  id: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  lessons_count: number;
  completed_count: number;
  progress: number;
  image?: string;
}

export default function LearnPage() {
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPaths = async () => {
      try {
        const response = await fetch('/api/learning-paths');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setPaths(data.paths || []);
      } catch (err) {
        setError('Failed to load learning paths');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPaths();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-4xl font-playfair font-bold mb-8">Learn</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card animate-pulse h-64 bg-islamic-darker" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-12">
        <h1 className="text-4xl font-playfair font-bold mb-2">Learn</h1>
        <p className="text-gray-400">
          Structured learning paths to deepen your knowledge of hadith
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-red-400 mb-8">
          {error}
        </div>
      )}

      {/* Featured Paths */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-white mb-6">Featured Paths</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paths.slice(0, 3).map((path) => (
            <Link key={path.id} href={`/learn/${path.id}`} className="group">
              <div className="card-hover p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white group-hover:text-gold transition">
                    {path.title}
                  </h3>
                  <span className="text-xs badge-sahih px-2 py-1">
                    {path.difficulty}
                  </span>
                </div>
                <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                  {path.description}
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-gold font-semibold">
                      {path.completed_count}/{path.lessons_count}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-gold to-emerald-bright rounded-full transition-all duration-300"
                      style={{ width: `${path.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* All Paths */}
      {paths.length > 3 && (
        <div>
          <h2 className="text-2xl font-semibold text-white mb-6">All Learning Paths</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paths.slice(3).map((path) => (
              <Link key={path.id} href={`/learn/${path.id}`} className="group">
                <div className="card-hover p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white group-hover:text-gold transition">
                      {path.title}
                    </h3>
                    <span className="text-xs badge-hasan px-2 py-1">
                      {path.difficulty}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                    {path.description}
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-gold font-semibold">
                        {path.completed_count}/{path.lessons_count}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-gold to-emerald-bright rounded-full transition-all duration-300"
                        style={{ width: `${path.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {!error && paths.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-400 mb-6">No learning paths available yet</p>
        </div>
      )}
    </div>
  );
}
