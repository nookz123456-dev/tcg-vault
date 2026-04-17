import type { Metadata } from "next";
import "./globals.css";
import { ClientLayout } from "@/components/ClientLayout";

export const metadata: Metadata = {
  title: "TCG Vault — ติดตามราคาการ์ด TCG | Card Price Tracker",
  description: "ฐานข้อมูลการ์ดโปเกม่อน One Piece ครบทุกเซ็ต พร้อมราคาอัปเดต จัดการคอลเลกชัน พูดคุยกับนักสะสมคนอื่น",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className="antialiased">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}