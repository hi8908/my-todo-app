// 議事録のデータ型定義

export interface MeetingMinutes {
  id: string;
  title: string;
  participants: string[];
  agenda: string;
  createdAt: string;
  updatedAt: string;
  duration: number;
  entries: TranscriptEntry[];
  summary: string[];
  decisions: Decision[];
  actions: ActionItem[];
}

export interface TranscriptEntry {
  id: string;
  text: string;
  timestamp: number;
  isImportant: boolean;
  isManual: boolean;
}

export interface Decision {
  id: string;
  text: string;
  isCompleted: boolean;
}

export interface ActionItem {
  id: string;
  task: string;
  assignee: string;
  deadline: string;
  isCompleted: boolean;
}
