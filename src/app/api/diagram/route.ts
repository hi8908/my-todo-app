import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import type { TranscriptEntry } from "@/types/meeting";

export const maxDuration = 30;

interface DiagramRequest {
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
    const body: DiagramRequest = await request.json();
    const { entries, title, participants, agenda } = body;

    if (!entries || !Array.isArray(entries)) {
      return NextResponse.json({ error: "Invalid entries" }, { status: 400 });
    }

    if (entries.length === 0) {
      return NextResponse.json({ diagram: "" });
    }

    const participantsStr =
      participants.length > 0 ? participants.join("、") : "未設定";
    const agendaStr = agenda || "なし";
    const transcriptText = entries
      .map((e) => `[${formatTimestamp(e.timestamp)}] ${e.text}`)
      .join("\n");

    const prompt = `以下の会議議事録を分析し、Mermaid記法のmindmapダイアグラムのみを返してください。

【会議情報】
タイトル: ${title}
参加者: ${participantsStr}
アジェンダ: ${agendaStr}

【議事録テキスト】
${transcriptText}

【出力フォーマット】
以下のMermaid mindmap形式のコードのみを返してください。\`\`\`mermaid や \`\`\` などのコードブロックマーカーは含めないでください。

mindmap
  root((${title}))
    トピック1
      サブトピック
    トピック2
      サブトピック

ルール:
- 会議の主要トピックを3〜6個の第1階層ノードにまとめる
- 各トピックに関連する具体的な内容を第2〜3階層に配置する
- ノードのテキストは20文字以内で簡潔にまとめる
- 日本語で記述する
- 特殊文字（()[]{}）はノードテキスト内で使わない
- Mermaid構文のみ返す。説明文は不要`;

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      system:
        "あなたは会議内容を視覚的なマインドマップに変換する専門アシスタントです。必ず有効なMermaid mindmap記法のみを返してください。",
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    const diagramText = content.text
      .replace(/^```mermaid\s*/m, "")
      .replace(/^```\s*/m, "")
      .replace(/```\s*$/m, "")
      .trim();

    return NextResponse.json({ diagram: diagramText });
  } catch (error) {
    console.error("Diagram API error:", error);
    return NextResponse.json(
      { error: "図解の生成に失敗しました" },
      { status: 500 }
    );
  }
}
