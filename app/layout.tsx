import type { Metadata } from "next";
import { Space_Grotesk, Work_Sans, VT323, Press_Start_2P } from "next/font/google";
import "typeface-minecraft";
import "./globals.css";

import Link from "next/link";
import { DayNightProvider } from "@/components/DayNightProvider";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { BottomNav } from "@/components/BottomNav";
import { Drawers } from "@/components/Drawers";
import { Footer } from "@/components/Footer";
import { WelcomeToast } from "../components/WelcomeToast";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "600", "700", "900"],
});

const vt323 = VT323({
  variable: "--font-vt323",
  subsets: ["latin"],
  weight: ["400"],
});

const pressStart2P = Press_Start_2P({
  variable: "--font-press-start",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "QueueBuddy | Find Minecraft Servers & LFG Gaming Lobbies",
  description: "QueueBuddy is the ultimate real-time multiplayer server browser. Find live Minecraft servers, recruit raid squads, and play instantly with no login required. Revive dying games today.",
  keywords: ["Minecraft Server Browser", "LFG Gaming", "Multiplayer Lobbies", "Minecraft Community", "Gaming Squad Finder", "QueueBuddy"],
  authors: [{ name: "Rehan Aslam", url: "https://github.com/RehanAslam2004" }],
  openGraph: {
    title: "QueueBuddy | Real-Time Gaming Lobbies",
    description: "Find players. Revive games. Play instantly. Join the ultimate server browser for Minecraft and more.",
    type: "website",
    url: "https://queue-buddy.netlify.app",
    images: [{ url: "/Queuebuddy.png" }],
  },
  verification: {
    google: "Im1kzFOyGRtS9nF43eSC8hW8k6eo8MkJ4sZ3EEFyQNk",
  },
  icons: {
    icon: [
      { url: '/Queuebuddy.png', sizes: '32x32', type: 'image/png' },
      { url: '/Queuebuddy.png', sizes: 'any' },
    ],
    apple: [
      { url: '/Queuebuddy.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${spaceGrotesk.variable} ${workSans.variable} ${vt323.variable} ${pressStart2P.variable} antialiased`}>
        <DayNightProvider>
          <Header />
          <div className="flex flex-1 min-h-0 flex-col md:flex-row max-w-[1440px] mx-auto w-full">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-surface-container-low relative pb-20 lg:pb-8">
              {children}
            </main>
          </div>
          <Footer />
          <BottomNav />
          <Drawers />
          <WelcomeToast />
          <div className="fixed inset-0 pointer-events-none z-[9999] opacity-[0.03] scanlines" />
        </DayNightProvider>
      </body>
    </html>
  );
}

