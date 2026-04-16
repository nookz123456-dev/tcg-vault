import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TCG Vault — Card Collection Tracker",
  description: "Track your Pokemon and One Piece card collections with real-time pricing",
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
        {children}
      </body>
    </html>
  );
}