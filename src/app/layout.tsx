import { Nav } from '@/components/layout/nav';
import { SessionProvider } from '@/components/layout/session-provider';
import { ThemeProvider } from '@/components/layout/theme-provider';
import type { Metadata } from 'next';
import { Geist_Mono, Sora } from 'next/font/google';
import './globals.css';

const sora = Sora({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'DotHub \u2014 Discover & share developer setups',
  description:
    'DotHub is the home for developer dotfiles. Browse configurations, discover new tools, and share your setup with the community.',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [{ url: '/apple-icon.svg', type: 'image/svg+xml', sizes: '180x180' }],
    shortcut: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex h-full flex-col">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <SessionProvider>
            <Nav />
            <main className="flex-1">{children}</main>
            <footer className="border-t border-border py-8 text-center text-sm">
              <div className="container text-muted-fg mx-auto max-w-6xl px-6">
                DotHub &mdash; open-source dotfiles community. Built by developers, for developers.
              </div>
            </footer>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
