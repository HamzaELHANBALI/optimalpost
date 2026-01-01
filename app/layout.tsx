import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AssetLibraryProvider } from "@/hooks/use-asset-library";
import { AuthProvider } from "@/hooks/use-auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ProvenPost - Content Optimization Lab",
  description: "Analyze viral content and generate high-performing variations. Double down on what works and experiment with new angles.",
  keywords: ["content optimization", "viral content", "content analysis", "AI writing"],
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
        <AuthProvider>
          <AssetLibraryProvider>
            {children}
            <Toaster richColors position="bottom-right" />
          </AssetLibraryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
