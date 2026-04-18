import type { Metadata } from "next";
import { Space_Grotesk, Work_Sans } from "next/font/google";
import "./globals.css";

import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { BottomNav } from "@/components/BottomNav";
import { Drawers } from "@/components/Drawers";
import { DayNightProvider } from "@/components/DayNightProvider";

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

export const metadata: Metadata = {
  title: "QueueBuddy | Real-Time Multiplayer Server Browser",
  description: "Find players. Revive games. Play instantly. No login required.",
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
      <body className={`${spaceGrotesk.variable} ${workSans.variable} antialiased`}>
        <DayNightProvider>
          <Header />
          <div className="flex flex-1 min-h-0 flex-col md:flex-row max-w-[1440px] mx-auto w-full">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-surface-container-low relative pb-20 lg:pb-8">
              {children}
            </main>
          </div>
          <BottomNav />
          <Drawers />
        </DayNightProvider>
      </body>
    </html>
  );
}

