import { Providers } from '@/components/providers';
import type { Metadata } from 'next';
import { Amiri, Playfair_Display } from 'next/font/google';
import './globals.css';

// Arabic Typography
const amiri = Amiri({
  subsets: ['arabic', 'latin'],
  weight: ['400', '700'],
  variable: '--font-amiri',
  display: 'swap',
});

// English Typography (Premium)
const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Authentic Hadith - Islamic Education Platform',
  description: 'Explore 36,245 authentic hadith with AI-powered explanations, safe learning environment, and personalized study paths.',
  keywords: ['hadith', 'Islamic education', 'Quran', 'Islamic studies', 'learning'],
  authors: [{ name: 'Authentic Hadith' }],
  creator: 'Authentic Hadith Team',
  publisher: 'Authentic Hadith',
  formatDetection: {
    email: false,
    telephone: false,
    address: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://authentic-hadith.app',
    siteName: 'Authentic Hadith',
    title: 'Authentic Hadith - Islamic Education Platform',
    description: 'Explore 36,245 authentic hadith with AI-powered explanations',
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_APP_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Authentic Hadith',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Authentic Hadith - Islamic Education Platform',
    description: 'Explore 36,245 authentic hadith with AI-powered explanations',
    images: [`${process.env.NEXT_PUBLIC_APP_URL}/og-image.png`],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${amiri.variable} ${playfair.variable}`}
      suppressHydrationWarning
    >
      <head>
        <meta name="theme-color" content="#0f0f0f" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Authentic Hadith" />
      </head>
      <body className="min-h-screen bg-islamic-dark text-text-primary font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
