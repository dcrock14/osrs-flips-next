import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "1K → Max | OSRS Flips",
  description: "Track flipping progress from 1,000 GP to max cash in Old School RuneScape.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
