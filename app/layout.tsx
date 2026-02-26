import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ORIN Admin Dashboard",
  description: "Admin operations for ORIN"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
