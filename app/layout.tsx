import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Brick Blast | 벽돌 깨기",
  description: "키보드와 터치로 즐기는 클래식 벽돌 깨기 게임",
  openGraph: { title: "Brick Blast | 벽돌 깨기", description: "키보드와 터치로 즐기는 클래식 벽돌 깨기 게임", images: ["/og.png"] },
  twitter: { card: "summary_large_image", title: "Brick Blast | 벽돌 깨기", images: ["/og.png"] },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
