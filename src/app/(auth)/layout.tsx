import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - Authentic Hadith',
  description: 'Sign in to your Authentic Hadith account',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-islamic-dark via-islamic-darker to-black px-4">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-green/5 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="text-center">
            <h1 className="text-3xl font-playfair font-bold text-gold mb-2">
              Authentic Hadith
            </h1>
            <p className="text-sm text-gray-400">
              Islamic Education Platform
            </p>
          </div>
        </div>

        {/* Forms */}
        {children}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-700 text-center text-sm text-gray-400">
          <p>
            Part of the{' '}
            <span className="text-gold font-semibold">
              Authentic Hadith
            </span>{' '}
            ecosystem
          </p>
        </div>
      </div>
    </div>
  );
}
