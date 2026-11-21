import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "600", "800"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Quantum Playground",
  description:
    "Build quantum circuits. Hunt treasure with Grover's algorithm. Free, in your browser.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "Quantum Playground",
    description:
      "Build quantum circuits. Hunt treasure with Grover's algorithm. Free, in your browser.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={mono.variable}>
      <body>{children}</body>
    </html>
  );
}
