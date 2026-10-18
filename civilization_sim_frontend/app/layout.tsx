import type { Metadata } from "next";
import { Pixelify_Sans, Silkscreen } from "next/font/google";
import "./globals.css";

const pixel = Pixelify_Sans({
  variable: "--font-pixel",
  subsets: ["latin"],
});

const pixelNum = Silkscreen({
  variable: "--font-pixel-num",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "My Little Town",
  description:
    "A friendly little town that grows. Help your people by building farms, houses and shops.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${pixel.variable} ${pixelNum.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
