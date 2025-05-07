import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Minimal Speech to Text",
  description: "A minimal Next.js speech-to-text application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}