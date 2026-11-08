import type { Metadata } from 'next';
import { Noto_Sans_Bengali } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { TabProvider } from '@/contexts/TabContext';
import { Navbar } from '@/components/Navbar';

const notoSansBengali = Noto_Sans_Bengali({
  subsets: ['bengali', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-bengali',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'HealthMatch BD - হাসপাতাল ও টেস্ট ফাইন্ডার',
  description: 'Find verified diagnostic tests, doctors, and hospitals in Dhaka, Bangladesh',
};

// Anti-flash script — sets both .dark class and dataset.theme before hydration
const themeScript = `
(function() {
  try {
    var t = localStorage.getItem('theme');
    var isDark = t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.dataset.theme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.dataset.theme = 'light';
    }
  } catch(e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" className={notoSansBengali.variable} suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ThemeProvider>
          <LanguageProvider>
            <TabProvider>
              <Navbar />
              <main>{children}</main>
            </TabProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
