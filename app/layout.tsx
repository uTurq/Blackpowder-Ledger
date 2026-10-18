import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Blackpowder Ledger — AC-3 Field Armory",
  description: "A tactile combat and ammunition companion for the AC-3 Gunsmith.",
  manifest: "/manifest.webmanifest",
  applicationName: "Blackpowder Ledger",
  appleWebApp: {
    capable: true,
    title: "Blackpowder",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: [
      { url: "/blackpowder-icon.svg", type: "image/svg+xml" },
      { url: "/blackpowder-icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/blackpowder-icon.svg",
    apple: "/blackpowder-icon-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
