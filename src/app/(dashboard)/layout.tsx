import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard - Authentic Hadith',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-islamic-dark text-text-primary">
      {/* Sidebar - will be a client component */}
      <div className="w-64 bg-islamic-darker border-r border-gray-700 hidden lg:block overflow-y-auto">
        <DashboardSidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-islamic-darker border-b border-gray-700 px-6 py-4">
          <DashboardHeader />
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      {/* Mobile sidebar trigger */}
      <div className="lg:hidden fixed bottom-4 right-4 z-40">
        <MobileMenuButton />
      </div>
    </div>
  );
}

function DashboardSidebar() {
  return (
    <nav className="p-6 space-y-8">
      {/* Logo */}
      <div className="mb-8">
        <h2 className="text-lg font-playfair font-bold text-gold">Authentic</h2>
        <p className="text-xs text-gray-400">Hadith</p>
      </div>

      {/* Navigation */}
      <div className="space-y-2">
        <NavLink href="/dashboard" icon="📚">
          Home
        </NavLink>
        <NavLink href="/collections" icon="📖">
          Collections
        </NavLink>
        <NavLink href="/search" icon="🔍">
          Search
        </NavLink>
        <NavLink href="/daily" icon="📅">
          Daily Hadith
        </NavLink>
        <NavLink href="/learn" icon="🎓">
          Learn
        </NavLink>
        <NavLink href="/saved" icon="❤️">
          Saved
        </NavLink>
        <NavLink href="/assistant" icon="✨">
          AI Assistant
        </NavLink>
        <NavLink href="/notes" icon="📝">
          Study Notes
        </NavLink>
      </div>

      {/* Separator */}
      <div className="border-t border-gray-700" />

      {/* Settings */}
      <div className="space-y-2">
        <NavLink href="/settings" icon="⚙️">
          Settings
        </NavLink>
        <NavLink href="/profile" icon="👤">
          Profile
        </NavLink>
      </div>
    </nav>
  );
}

function DashboardHeader() {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-xl font-playfair font-semibold">Dashboard</h1>
      <div className="flex items-center gap-4">
        {/* Search bar placeholder */}
        <input
          type="search"
          placeholder="Search hadith..."
          className="hidden md:block px-4 py-2 bg-islamic-dark border border-gray-600 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gold"
        />
        {/* User menu placeholder */}
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-islamic-dark transition">
          <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold text-sm font-bold">
            U
          </div>
        </button>
      </div>
    </div>
  );
}

function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 px-4 py-2 rounded-lg text-gray-300 hover:bg-islamic-dark hover:text-gold transition"
    >
      <span className="text-lg">{icon}</span>
      <span className="text-sm">{children}</span>
    </a>
  );
}

function MobileMenuButton() {
  return (
    <button className="w-14 h-14 rounded-full bg-gold text-islamic-dark flex items-center justify-center shadow-lg hover:bg-gold/90 transition font-bold text-lg">
      ☰
    </button>
  );
}
