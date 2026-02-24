"use client";

import Link from "next/link";
import { Mic, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

// 議事録が存在しない場合の空の状態表示
export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center">
          <FileText className="h-12 w-12 text-blue-300" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
          <Mic className="h-5 w-5 text-blue-400" />
        </div>
      </div>
      <h2 className="text-xl font-semibold text-gray-800 mb-2">
        議事録がまだありません
      </h2>
      <p className="text-gray-500 text-center mb-8 max-w-md">
        マイクボタンを押して音声を録音し、会議の内容を自動で
        テキスト化しましょう。議事録の作成がもっと簡単になります。
      </p>
      <Link href="/record">
        <Button size="lg" className="gap-2 text-base px-8">
          <Mic className="h-5 w-5" />
          新しい議事録を作成
        </Button>
      </Link>
    </div>
  );
}
