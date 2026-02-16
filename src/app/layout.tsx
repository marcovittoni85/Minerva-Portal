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

// Unico blocco metadata corretto
export const metadata: Metadata = {
  title: "Minerva Partners Board",
  description: "Private Marketplace - Confederazione del Valore",
  icons: {
    icon: "/icon.png", 
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#001220] text-white`}
      >
        {children}
      </body>
    </html>
  );
}