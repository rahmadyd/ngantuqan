import type { Metadata, Viewport } from "next";
import { Fredoka, Space_Grotesk } from "next/font/google";
import { LocaleProvider } from "@/lib/i18n/client";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { LOCALE_HTML_LANG } from "@/lib/i18n/config";
import "./globals.css";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ngantuqan: Creative Design Studio",
    template: "%s | ngantuqan",
  },
  description:
    "ngantuqan is an independent creative design studio offering brand identity, social media, presentation, banner, and UI/UX design services, plus downloadable design templates.",
  keywords: [
    "creative design studio",
    "branding",
    "social media design",
    "presentation design",
    "UI UX design",
    "digital templates",
  ],
  openGraph: {
    type: "website",
    siteName: "ngantuqan",
    locale: "en_US",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#F7EED8",
  colorScheme: "light",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // The language tag has to be right in the first byte of HTML, so it is read
  // on the server rather than patched in the browser.
  const locale = await getLocale();
  const dictionary = await getDictionary();

  return (
    <html
      lang={LOCALE_HTML_LANG[locale]}
      className={`${fredoka.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background font-body text-text">
        <LocaleProvider locale={locale} dictionary={dictionary}>
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
