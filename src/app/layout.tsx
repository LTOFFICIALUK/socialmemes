import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WalletContextProvider } from "@/contexts/WalletContext";
import { GlobalWalletSetup } from "@/components/global-wallet-setup";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://www.socialmemes.fun'),
  title: "Social Memes",
  description: "Share memes and tag tokens on the ultimate crypto meme platform",
  viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" }
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ],
    other: [
      { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" }
    ]
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "Social Memes",
    description: "Share memes and tag tokens on the ultimate crypto meme platform",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Social Memes - Crypto Meme Platform"
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Social Memes",
    description: "Share memes and tag tokens on the ultimate crypto meme platform",
    images: ["/twitter-image.png"]
  }
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
        {/* SVG Gradients for Pro Icons */}
        <svg width="0" height="0" style={{ position: 'absolute' }}>
          <defs>
            <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#A855F7" />
              <stop offset="25%" stopColor="#9333EA" />
              <stop offset="50%" stopColor="#7C3AED" />
              <stop offset="75%" stopColor="#9333EA" />
              <stop offset="100%" stopColor="#A855F7" />
            </linearGradient>
          </defs>
        </svg>
        <WalletContextProvider>
          {children}
          <GlobalWalletSetup />
        </WalletContextProvider>
      </body>
    </html>
  );
}
