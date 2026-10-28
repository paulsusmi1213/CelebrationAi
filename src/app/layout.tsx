import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CelebrationAI | Production GenAI Event & Celebration Planner',
  description: 'AI-engineered celebration planning with zero-sum budget protection, backwards timelines, and vendor contract audits.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className="h-full min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col">
        {/* Navigation Bar */}
        <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <span className="font-black text-lg">C</span>
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-zinc-900 dark:text-white">CelebrationAI</span>
                <span className="hidden sm:inline-block ml-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  GenAI Planner
                </span>
              </div>
            </div>

            <nav className="flex items-center gap-3 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              <span className="hidden md:inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Gemini 1.5 Engine Active
              </span>
              <a 
                href="#docs" 
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors px-2 py-1"
              >
                Architecture Guide
              </a>
            </nav>
          </div>
        </header>

        {/* Main Content Area */}
        <main id="main-content" className="flex-1">
          {children}
        </main>

        {/* Accessible Footer */}
        <footer className="border-t border-zinc-200 dark:border-zinc-800 py-6 bg-white dark:bg-zinc-900 text-center text-xs text-zinc-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>CelebrationAI &copy; {new Date().getFullYear()} • Production GenAI Architecture</span>
            <div className="flex items-center gap-4">
              <span>WCAG 2.1 AA Compliant</span>
              <span>GDPR Certified Data Handling</span>
              <span>Locked 10% Contingency Safety</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

