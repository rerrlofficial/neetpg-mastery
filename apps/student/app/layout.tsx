import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NEET-PG Master",
  description: "NEET-PG preparation and MCQ practice platform",
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
