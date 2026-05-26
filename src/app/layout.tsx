import type { Metadata } from 'next';
import './globals.css';
import { Shell } from '@/components/layout/Shell';

export const metadata: Metadata = {
  title: 'CAT OS — Your Elite Prep Dashboard',
  description: 'Personal CAT 2026 preparation operating system. Track mocks, daily study, revision, and analytics in one powerful dashboard.',
  keywords: ['CAT 2026', 'CAT preparation', 'MBA prep', 'mock analysis', 'study tracker'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
