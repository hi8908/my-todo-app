"use client";

import Link from "next/link";
import { FileText } from "lucide-react";

interface HeaderProps {
  title?: string;
  showBack?: boolean;
}

// 全画面共通のヘッダーコンポーネント
export function Header({ title, showBack = false }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            {showBack && (
              <Link
                href="/"
                className="text-gray-500 hover:text-gray-700 transition-colors mr-1"
                aria-label="ホームに戻る"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </Link>
            )}
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-900 hover:text-blue-600 transition-colors"
              aria-label="Gijiroku ホーム"
            >
              <FileText className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold tracking-tight">
                Gijiroku
              </span>
            </Link>
          </div>
          {title && (
            <h1 className="text-sm font-medium text-gray-500 truncate max-w-[50%]">
              {title}
            </h1>
          )}
        </div>
      </div>
    </header>
  );
}
