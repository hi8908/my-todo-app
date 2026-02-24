"use client";

import type { MeetingMinutes } from "@/types/meeting";

const STORAGE_KEY = "gijiroku_meetings";

// localStorageから全議事録を取得
export function getAllMeetings(): MeetingMinutes[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data) as MeetingMinutes[];
  } catch {
    return [];
  }
}

// IDで議事録を取得
export function getMeetingById(id: string): MeetingMinutes | undefined {
  const meetings = getAllMeetings();
  return meetings.find((m) => m.id === id);
}

// 議事録を保存（新規作成・更新兼用）
export function saveMeeting(meeting: MeetingMinutes): void {
  const meetings = getAllMeetings();
  const index = meetings.findIndex((m) => m.id === meeting.id);
  if (index >= 0) {
    meetings[index] = { ...meeting, updatedAt: new Date().toISOString() };
  } else {
    meetings.unshift(meeting);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(meetings));
}

// 議事録を削除
export function deleteMeeting(id: string): void {
  const meetings = getAllMeetings().filter((m) => m.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(meetings));
}

// 議事録を検索（タイトル・本文で全文検索）
export function searchMeetings(query: string): MeetingMinutes[] {
  if (!query.trim()) return getAllMeetings();
  const lower = query.toLowerCase();
  return getAllMeetings().filter((m) => {
    const titleMatch = m.title.toLowerCase().includes(lower);
    const textMatch = m.entries.some((e) =>
      e.text.toLowerCase().includes(lower)
    );
    const participantMatch = m.participants.some((p) =>
      p.toLowerCase().includes(lower)
    );
    return titleMatch || textMatch || participantMatch;
  });
}

// UUID生成
export function generateId(): string {
  return crypto.randomUUID();
}
