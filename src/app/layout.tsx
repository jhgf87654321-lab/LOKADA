import type { Metadata } from "next";
import { Public_Sans } from "next/font/google";
import "./globals.css";
import Providers from "@/providers";

const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-public-sans",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "LOKADA AI - 产品开发服务",
  description: "智能产品开发服务 - 工装定制 AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${publicSans.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
