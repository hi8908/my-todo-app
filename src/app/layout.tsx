import type { Metadata } from "next";
import "./globals.css";
import { ErrorBoundary } from "@/components/meeting/ErrorBoundary";

export const metadata: Metadata = {
  title: {
    default: "Gijiroku - 音声議事録作成アプリ",
    template: "%s | Gijiroku",
  },
  description:
    "ブラウザの音声認識を使って、会議の音声をリアルタイムでテキスト化し、議事録として整理・保存するアプリ",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📝</text></svg>",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased min-h-screen">
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}
