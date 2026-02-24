"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Mic, Search } from "lucide-react";
import { Header } from "@/components/meeting/Header";
import { EmptyState } from "@/components/meeting/EmptyState";
import { MeetingCard } from "@/components/meeting/MeetingCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAllMeetings } from "@/lib/storage";
import type { MeetingMinutes } from "@/types/meeting";

// ホーム画面：議事録一覧
export default function HomePage() {
  const [meetings, setMeetings] = useState<MeetingMinutes[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setMeetings(getAllMeetings());
    setIsLoaded(true);
  }, []);

  // 検索フィルタリング
  const filteredMeetings = useMemo(() => {
    if (!searchQuery.trim()) return meetings;
    const lower = searchQuery.toLowerCase();
    return meetings.filter((m) => {
      const titleMatch = m.title.toLowerCase().includes(lower);
      const textMatch = m.entries.some((e) =>
        e.text.toLowerCase().includes(lower)
      );
      const participantMatch = m.participants.some((p) =>
        p.toLowerCase().includes(lower)
      );
      return titleMatch || textMatch || participantMatch;
    });
  }, [meetings, searchQuery]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded-lg w-1/3" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-xl" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {meetings.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* ヘッダー部分：タイトルと新規作成ボタン */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">議事録一覧</h1>
                <p className="text-sm text-gray-500 mt-1">
                  {meetings.length}件の議事録
                </p>
              </div>
              <Link href="/record">
                <Button size="lg" className="gap-2 w-full sm:w-auto">
                  <Mic className="h-5 w-5" />
                  新しい議事録を作成
                </Button>
              </Link>
            </div>

            {/* 検索バー */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="タイトル・本文・参加者で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                aria-label="議事録を検索"
              />
            </div>

            {/* 議事録カード一覧 */}
            {filteredMeetings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMeetings.map((meeting) => (
                  <MeetingCard key={meeting.id} meeting={meeting} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  「{searchQuery}」に一致する議事録が見つかりません
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
