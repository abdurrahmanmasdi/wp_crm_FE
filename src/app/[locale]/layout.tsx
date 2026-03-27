import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { getLocale } from 'next-intl/server';
import { ThemeProvider } from '@/components/theme-provider';
import { QueryProvider } from '@/components/query-provider';
import { AuthInitializer } from '@/components/AuthInitializer';
import { Toaster } from '@/components/ui/sonner';
import '@/app/globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Navigation');
  const commonT = await getTranslations('Common');

  return {
    title: `${t('dashboard')} - TourCRM`,
    description: commonT('appDescription'),
  };
}

interface RootLayoutProps {
  children: React.ReactNode;
}

export default async function RootLocaleLayout({ children }: RootLayoutProps) {
  // Get messages for the current locale
  const messages = await getMessages();
  const locale = await getLocale();
  const isRTL = locale === 'ar';
  const direction = isRTL ? 'rtl' : 'ltr';

  return (
    <html
      lang={locale}
      dir={direction}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem={true}
          disableTransitionOnChange={true}
        >
          <NextIntlClientProvider messages={messages}>
            <QueryProvider>
              <AuthInitializer />
              {children}
              <Toaster theme="dark" />
            </QueryProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
