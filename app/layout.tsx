import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "半个 PPT",
  description: "给水课做一份能交的 PPT。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
