import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { Nav } from "@/components/Nav";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Dynasty — Build the greatest team ever assembled",
  description:
    "Draft all-time NBA and Soccer legends, simulate a season or a World Cup, and chase immortality on the leaderboard.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-ink font-sans antialiased">
        <AuthProvider>
          <Nav />
          <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-4 sm:px-6">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
