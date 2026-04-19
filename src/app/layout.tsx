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
  title: "HoloCheck — ตรวจราคาการ์ดโปเกม่อน | Card Price Tracker",
  description: "ฐานข้อมูลการ์ดโปเกม่อน ครบทุกเซ็ต พร้อมราคาอัปเดต จัดการคอลเลกชัน พูดคุยกับนักสะสมคนอื่น",
  icons: {
    icon: "/icon.svg",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HoloCheck",
  },
  openGraph: {
    title: "HoloCheck — Card Price Tracker & Community",
    description: "Track Pokemon TCG card prices, manage your collection, and connect with collectors",
    siteName: "HoloCheck",
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
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body className="antialiased">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}