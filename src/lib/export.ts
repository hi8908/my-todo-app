import { format } from "date-fns";
import { ja } from "date-fns/locale";
import type { MeetingMinutes } from "@/types/meeting";

// 経過秒数をMM:SS形式に変換
export function formatElapsedTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// 議事録をMarkdown形式に変換
export function exportToMarkdown(meeting: MeetingMinutes): string {
  const date = format(new Date(meeting.createdAt), "yyyy年M月d日 HH:mm", {
    locale: ja,
  });
  const lines: string[] = [];

  lines.push(`# ${meeting.title}`);
  lines.push("");
  lines.push(`- **日時**: ${date}`);
  lines.push(
    `- **参加者**: ${meeting.participants.length > 0 ? meeting.participants.join("、") : "未設定"}`
  );
  lines.push(`- **録音時間**: ${formatElapsedTime(meeting.duration)}`);

  if (meeting.agenda) {
    lines.push("");
    lines.push("## アジェンダ");
    lines.push("");
    lines.push(meeting.agenda);
  }

  lines.push("");
  lines.push("## 議事録");
  lines.push("");
  for (const entry of meeting.entries) {
    const ts = formatElapsedTime(entry.timestamp);
    const important = entry.isImportant ? " ⭐" : "";
    const manual = entry.isManual ? " [手動メモ]" : "";
    lines.push(`- [${ts}] ${entry.text}${important}${manual}`);
  }

  if (meeting.summary.length > 0) {
    lines.push("");
    lines.push("## 要点まとめ");
    lines.push("");
    for (const s of meeting.summary) {
      lines.push(`- ${s}`);
    }
  }

  if (meeting.decisions.length > 0) {
    lines.push("");
    lines.push("## 決定事項");
    lines.push("");
    for (const d of meeting.decisions) {
      const check = d.isCompleted ? "x" : " ";
      lines.push(`- [${check}] ${d.text}`);
    }
  }

  if (meeting.actions.length > 0) {
    lines.push("");
    lines.push("## アクションアイテム");
    lines.push("");
    for (const a of meeting.actions) {
      const check = a.isCompleted ? "x" : " ";
      const assignee = a.assignee ? ` (担当: ${a.assignee})` : "";
      const deadline = a.deadline ? ` [期限: ${a.deadline}]` : "";
      lines.push(`- [${check}] ${a.task}${assignee}${deadline}`);
    }
  }

  lines.push("");
  return lines.join("\n");
}

// 議事録をテキスト形式に変換
export function exportToText(meeting: MeetingMinutes): string {
  const date = format(new Date(meeting.createdAt), "yyyy年M月d日 HH:mm", {
    locale: ja,
  });
  const lines: string[] = [];

  lines.push(`議事録: ${meeting.title}`);
  lines.push(`日時: ${date}`);
  lines.push(
    `参加者: ${meeting.participants.length > 0 ? meeting.participants.join("、") : "未設定"}`
  );
  lines.push(`録音時間: ${formatElapsedTime(meeting.duration)}`);
  lines.push("─".repeat(40));

  if (meeting.agenda) {
    lines.push("");
    lines.push("【アジェンダ】");
    lines.push(meeting.agenda);
    lines.push("");
  }

  lines.push("【議事録】");
  for (const entry of meeting.entries) {
    const ts = formatElapsedTime(entry.timestamp);
    const important = entry.isImportant ? " ★" : "";
    const manual = entry.isManual ? " [手動メモ]" : "";
    lines.push(`[${ts}] ${entry.text}${important}${manual}`);
  }

  if (meeting.summary.length > 0) {
    lines.push("");
    lines.push("【要点まとめ】");
    for (const s of meeting.summary) {
      lines.push(`・${s}`);
    }
  }

  if (meeting.decisions.length > 0) {
    lines.push("");
    lines.push("【決定事項】");
    for (const d of meeting.decisions) {
      const check = d.isCompleted ? "✓" : "□";
      lines.push(`${check} ${d.text}`);
    }
  }

  if (meeting.actions.length > 0) {
    lines.push("");
    lines.push("【アクションアイテム】");
    for (const a of meeting.actions) {
      const check = a.isCompleted ? "✓" : "□";
      const assignee = a.assignee ? ` (担当: ${a.assignee})` : "";
      const deadline = a.deadline ? ` [期限: ${a.deadline}]` : "";
      lines.push(`${check} ${a.task}${assignee}${deadline}`);
    }
  }

  lines.push("");
  return lines.join("\n");
}
