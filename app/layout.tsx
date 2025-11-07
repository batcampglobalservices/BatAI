import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BatAI - Your Friendly AI Assistant",
  description: "AI-powered chat assistant with multiple personalities and capabilities",
  metadataBase: new URL('https://batcamp-globals-ai.vercel.app'),
  authors: [{ name: "BatCamp Global Services" }],
  openGraph: {
    title: "BatAI - Your Friendly AI Assistant",
    description: "AI-powered chat assistant with multiple personalities and capabilities",
    url: 'https://batcamp-globals-ai.vercel.app',
    siteName: 'BatAI',
    locale: 'en_US',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
