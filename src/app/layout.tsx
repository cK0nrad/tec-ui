import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LIVE TEC NETWORK",
  description: "Unofficial LETEC map",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  userScalable: false,
};

import { DM_Sans } from "next/font/google";
const dmsans = DM_Sans({
  subsets: ["latin"],
  weight: "400",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={dmsans.className}>
      <meta name="theme-color" />
      {children}
    </html>
  );
}
