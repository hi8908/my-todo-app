import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import type { TranscriptEntry } from "@/types/meeting";

export const maxDuration = 30;

interface SummarizeRequest {
  entries: TranscriptEntry[];
  title: string;
  participants: string[];
  agenda: string;
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export async function POST(request: NextRequest) {
  try {
    const body: SummarizeRequest = await request.json();
    const { entries, title, participants, agenda } = body;

    if (!entries || !Array.isArray(entries)) {
      return NextResponse.json({ error: "Invalid entries" }, { status: 400 });
    }

    if (entries.length === 0) {
      return NextResponse.json({ summary: [], decisions: [], actions: [] });
    }

    const participantsStr =
      participants.length > 0 ? participants.join("、") : "未設定";
    const agendaStr = agenda || "なし";
    const transcriptText = entries
      .map((e) => `[${formatTimestamp(e.timestamp)}] ${e.text}`)
      .join("\n");

    const prompt = `以下の会議議事録を分析し、JSON形式のみで返してください。

【会議情報】
タイトル: ${title}
参加者: ${participantsStr}
アジェンダ: ${agendaStr}

【議事録テキスト】
${transcriptText}

【出力フォーマット（このJSONのみ返してください）】
{
  "summary": ["要点1", "要点2", "要点3"],
  "decisions": [{"text": "決定内容"}],
  "actions": [{"task": "タスク内容", "assignee": "担当者名", "deadline": "YYYY-MM-DD"}]
}

ルール:
- summaryは3〜7項目で会議の要点を簡潔にまとめる
- decisionsは会議で合意・決定された事項のみ
- actionsは具体的なTODO・ネクストアクションのみ。担当者・期限が不明な場合は空文字
- 該当する内容がない場合は空配列を返す
- JSON以外のテキストは絶対に含めない`;

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      system:
        "あなたは日本語の会議議事録を分析・要約する専門アシスタントです。必ず有効なJSONのみを返してください。",
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    const jsonText = content.text
      .replace(/^```json\s*/m, "")
      .replace(/^```\s*/m, "")
      .replace(/```\s*$/m, "")
      .trim();

    const parsed = JSON.parse(jsonText);

    return NextResponse.json({
      summary: Array.isArray(parsed.summary) ? parsed.summary : [],
      decisions: Array.isArray(parsed.decisions)
        ? parsed.decisions.map((d: { text: string }) => ({
            id: crypto.randomUUID(),
            text: d.text || "",
            isCompleted: false,
          }))
        : [],
      actions: Array.isArray(parsed.actions)
        ? parsed.actions.map(
            (a: { task: string; assignee: string; deadline: string }) => ({
              id: crypto.randomUUID(),
              task: a.task || "",
              assignee: a.assignee || "",
              deadline: a.deadline || "",
              isCompleted: false,
            })
          )
        : [],
    });
  } catch (error) {
    console.error("Summarize API error:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "AI応答のパースに失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "AI要約の生成に失敗しました" },
      { status: 500 }
    );
  }
}
