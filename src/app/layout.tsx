import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ClientLayout } from "@/components/ClientLayout";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#6366f1',
};

export const metadata: Metadata = {
  title: "TCG Vault — ติดตามราคาการ์ด TCG | Card Price Tracker",
  description: "ฐานข้อมูลการ์ดโปเกม่อน One Piece ครบทุกเซ็ต พร้อมราคาอัปเดต จัดการคอลเลกชัน พูดคุยกับนักสะสมคนอื่น",
  icons: {
    icon: "/favicon.ico",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TCG Vault",
  },
  openGraph: {
    title: "TCG Vault — Card Price Tracker & Marketplace",
    description: "Track Pokemon & One Piece TCG card prices, manage your collection, and connect with collectors",
    siteName: "TCG Vault",
    type: "website",
    images: ["/icon-512.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="antialiased">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}