import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CelebrationAI - GenAI Celebration & Event Planner',
  description: 'Production-ready GenAI event planning application for weddings, milestone birthdays, and community gatherings.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased min-h-screen font-sans selection:bg-fuchsia-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}

