import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "White World",
  description: "Three.js WebGPU white world",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
