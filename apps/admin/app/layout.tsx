
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NEET-PG Master Admin",
  description: "Admin dashboard for NEET-PG Master",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
