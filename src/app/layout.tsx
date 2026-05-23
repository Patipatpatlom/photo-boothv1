import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const spaceMono = Space_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "THEBESTFILM — Step Inside the Booth",
  description:
    "A hyper-realistic Y2K photo booth experience. Enter the chrome portal and capture your moment.",
  keywords: ["photo booth", "Y2K", "retro", "chrome", "3D", "interactive"],
  authors: [{ name: "THEBESTFILM" }],
  openGraph: {
    title: "THEBESTFILM — Step Inside the Booth",
    description: "A hyper-realistic Y2K photo booth experience.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a12",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${spaceMono.variable} h-full`}
    >
      <body className="h-full w-full overflow-hidden bg-[hsl(232,28%,4%)] scanlines vignette">
        {children}
      </body>
    </html>
  );
}
