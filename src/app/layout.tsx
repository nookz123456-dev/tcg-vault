import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ClientLayout } from "@/components/ClientLayout";
import { CmdKSearch } from "@/components/CmdKSearch";
import CosmicBackground from "@/components/CosmicBackground";
import { getServerLocale } from "@/lib/i18n.server";
import { Analytics } from "@vercel/analytics/next";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#08080f',
};

export const metadata: Metadata = {
  title: "Vaultverse — ราคากลางการ์ด Marvel Hero Rush โดยสมาคมผู้คลั่งไคล้ SuperHero",
  description: "ศูนย์รวมราคากลางการ์ด Marvel Hero Rush โดยสมาคมผู้คลั่งไคล้ SuperHero ครบทุกใบทุกเซ็ต พร้อมจัดการคอลเลกชัน",
  metadataBase: new URL('https://marvel-hero-rush-thailand.vercel.app'),
  icons: {
    icon: "/icon.svg",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Vaultverse",
  },
  openGraph: {
    title: "Marvel Hero Rush Thailand · ราคากลางการ์ด",
    description: "ราคากลางการ์ด Marvel Hero Rush โดยสมาคมผู้คลั่งไคล้ SuperHero ครบทุกใบทุกเซ็ต",
    siteName: "Marvel Hero Rush Thailand",
    type: "website",
    locale: "th_TH",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Marvel Hero Rush Thailand" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Marvel Hero Rush Thailand · ราคากลางการ์ด",
    description: "ราคากลางการ์ด Marvel Hero Rush โดยสมาคมผู้คลั่งไคล้ SuperHero ครบทุกใบทุกเซ็ต",
    images: ["/og.jpg"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getServerLocale();
  return (
    <html lang={locale}>
      <head>
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body className="antialiased">
        {/* global animated cosmic backdrop behind every page */}
        <div className="fixed inset-0 -z-10 pointer-events-none">
          <CosmicBackground />
        </div>
        <ClientLayout initialLocale={locale}>
          {children}
          <CmdKSearch />
        </ClientLayout>
        <Analytics />
      </body>
    </html>
  );
}