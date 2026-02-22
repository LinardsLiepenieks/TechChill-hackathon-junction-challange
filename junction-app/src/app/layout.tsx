import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { JudgingProvider } from "@/context/JudgingContext";
import { getStore, getVisibleParticipants } from "@/lib/store";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hackathon Judging Dashboard",
  description: "Judge and score hackathon team submissions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const store = getStore();
  const participants = getVisibleParticipants(store);

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <JudgingProvider participants={participants}>
          {children}
        </JudgingProvider>
      </body>
    </html>
  );
}
