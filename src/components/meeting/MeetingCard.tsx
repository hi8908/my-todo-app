"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Clock, Users, FileText } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatElapsedTime } from "@/lib/export";
import type { MeetingMinutes } from "@/types/meeting";

interface MeetingCardProps {
  meeting: MeetingMinutes;
}

// 議事録一覧のカードコンポーネント
export function MeetingCard({ meeting }: MeetingCardProps) {
  const dateStr = format(new Date(meeting.createdAt), "M月d日 (E) HH:mm", {
    locale: ja,
  });

  // 最初の3エントリからプレビューテキストを生成
  const preview = meeting.entries
    .slice(0, 3)
    .map((e) => e.text)
    .join(" ");
  const truncatedPreview =
    preview.length > 120 ? preview.slice(0, 120) + "..." : preview;

  return (
    <Link href={`/minutes/${meeting.id}`} className="block group">
      <Card className="hover:shadow-md hover:border-blue-200 transition-all duration-200 h-full">
        <CardHeader className="pb-3">
          <CardTitle className="group-hover:text-blue-600 transition-colors line-clamp-1">
            {meeting.title || "無題の議事録"}
          </CardTitle>
          <p className="text-xs text-gray-400 mt-1">{dateStr}</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {meeting.participants.length}名
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatElapsedTime(meeting.duration)}
            </span>
            <span className="flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              {meeting.entries.length}件
            </span>
          </div>
          {truncatedPreview && (
            <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">
              {truncatedPreview}
            </p>
          )}
          {!truncatedPreview && (
            <p className="text-sm text-gray-400 italic">テキストなし</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
