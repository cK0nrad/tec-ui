import type { Metadata, Viewport } from "next";
import styles from "./layout.module.css";

import { DM_Sans } from "next/font/google";
const dmsans = DM_Sans({
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "FEEDBACK",
  description: "Unofficial LETEC map",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  userScalable: false,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html className={dmsans.className} lang="en">
      <meta name="theme-color" />
      <body style={{height: "100%", display: "flex", flexDirection: "column"}}>
        <div
          style={{
            flex: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            padding: 20,
            fontSize: "1.5em",
          }}
        >
          TLN FEEDBACK
        </div>
        <div style={{
            flex: 1,
            overflow: "auto",
        }}>{children}</div>
      </body>
    </html>
  );
}
