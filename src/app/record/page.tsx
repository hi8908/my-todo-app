"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Mic,
  MicOff,
  Pause,
  Play,
  Square,
  Star,
  Plus,
  Save,
  X,
  AlertCircle,
} from "lucide-react";
import { Header } from "@/components/meeting/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import { saveMeeting, generateId } from "@/lib/storage";
import { formatElapsedTime } from "@/lib/export";
import type { MeetingMinutes } from "@/types/meeting";

export default function RecordPage() {
  const router = useRouter();
  const {
    isListening,
    isPaused,
    entries,
    interimTranscript,
    elapsedTime,
    error,
    isSupported,
    start,
    pause,
    resume,
    stop,
    addManualEntry,
    toggleImportant,
  } = useVoiceRecognition();

  // 会議情報
  const [title, setTitle] = useState("");
  const [participantInput, setParticipantInput] = useState("");
  const [participants, setParticipants] = useState<string[]>([]);
  const [agenda, setAgenda] = useState("");

  // 手動メモ入力
  const [manualNote, setManualNote] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);

  // 保存状態
  const [isSaving, setIsSaving] = useState(false);

  // 参加者の追加
  const handleAddParticipant = useCallback(() => {
    const names = participantInput
      .split(/[,、]/)
      .map((n) => n.trim())
      .filter((n) => n && !participants.includes(n));
    if (names.length > 0) {
      setParticipants((prev) => [...prev, ...names]);
      setParticipantInput("");
    }
  }, [participantInput, participants]);

  // 参加者の削除
  const handleRemoveParticipant = useCallback((name: string) => {
    setParticipants((prev) => prev.filter((p) => p !== name));
  }, []);

  // 手動メモの追加
  const handleAddManualNote = useCallback(() => {
    if (manualNote.trim()) {
      addManualEntry(manualNote);
      setManualNote("");
      setShowManualInput(false);
    }
  }, [manualNote, addManualEntry]);

  // 議事録の保存
  const handleSave = useCallback(() => {
    if (!title.trim()) {
      alert("会議タイトルを入力してください。");
      return;
    }

    // 録音中なら停止
    if (isListening) {
      stop();
    }

    setIsSaving(true);

    const meeting: MeetingMinutes = {
      id: generateId(),
      title: title.trim(),
      participants,
      agenda: agenda.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      duration: elapsedTime,
      entries,
      summary: [],
      decisions: [],
      actions: [],
    };

    saveMeeting(meeting);
    router.push(`/minutes/${meeting.id}`);
  }, [title, participants, agenda, elapsedTime, entries, isListening, stop, router]);

  // エラーメッセージの表示
  const errorMessage = (() => {
    switch (error) {
      case "not-supported":
        return "このブラウザは音声認識に対応していません。Chrome をお使いください。";
      case "permission-denied":
        return "マイクの使用が拒否されました。ブラウザの設定でマイクの権限を許可してください。";
      case "network":
        return "ネットワークエラーが発生しました。インターネット接続を確認してください。";
      case "unknown":
        return "音声認識でエラーが発生しました。もう一度お試しください。";
      default:
        return null;
    }
  })();

  return (
    <div className="min-h-screen pb-24">
      <Header title="新しい議事録" showBack />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 会議情報入力セクション */}
        <section className="mb-8" aria-label="会議情報">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            会議情報
          </h2>

          <div className="space-y-4">
            {/* 会議タイトル */}
            <div>
              <label
                htmlFor="meeting-title"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                会議タイトル <span className="text-red-500">*</span>
              </label>
              <Input
                id="meeting-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例：第10回 プロジェクト定例会議"
                required
                aria-required="true"
              />
            </div>

            {/* 参加者 */}
            <div>
              <label
                htmlFor="participants"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                参加者
              </label>
              <div className="flex gap-2">
                <Input
                  id="participants"
                  value={participantInput}
                  onChange={(e) => setParticipantInput(e.target.value)}
                  placeholder="名前をカンマ区切りで入力"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddParticipant();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddParticipant}
                  aria-label="参加者を追加"
                >
                  追加
                </Button>
              </div>
              {participants.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2" role="list" aria-label="参加者リスト">
                  {participants.map((name) => (
                    <Badge
                      key={name}
                      variant="secondary"
                      className="gap-1 pr-1"
                      role="listitem"
                    >
                      {name}
                      <button
                        onClick={() => handleRemoveParticipant(name)}
                        className="ml-1 rounded-full hover:bg-gray-300 p-0.5 transition-colors"
                        aria-label={`${name}を削除`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* アジェンダ */}
            <div>
              <label
                htmlFor="agenda"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                アジェンダ / メモ
              </label>
              <Textarea
                id="agenda"
                value={agenda}
                onChange={(e) => setAgenda(e.target.value)}
                placeholder="会議のアジェンダや事前メモを入力..."
                rows={3}
              />
            </div>
          </div>
        </section>

        {/* エラー表示 */}
        {errorMessage && (
          <div
            className="flex items-start gap-3 p-4 mb-6 bg-red-50 border border-red-200 rounded-lg"
            role="alert"
          >
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
        )}

        {/* ブラウザ非対応メッセージ */}
        {!isSupported && (
          <div
            className="flex items-start gap-3 p-4 mb-6 bg-amber-50 border border-amber-200 rounded-lg"
            role="alert"
          >
            <MicOff className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                音声認識に非対応
              </p>
              <p className="text-sm text-amber-700 mt-1">
                このブラウザは音声認識に対応していません。Chrome
                をお使いください。
              </p>
            </div>
          </div>
        )}

        {/* 音声認識コントロール */}
        <section className="mb-8" aria-label="音声認識コントロール">
          <div className="flex flex-col items-center py-8">
            {/* 経過時間 */}
            <div
              className="text-4xl font-mono font-bold text-gray-800 mb-6 tabular-nums"
              aria-live="polite"
              aria-label={`経過時間: ${formatElapsedTime(elapsedTime)}`}
            >
              {formatElapsedTime(elapsedTime)}
            </div>

            {/* マイクボタン群 */}
            <div className="flex items-center gap-4">
              {/* 一時停止/再開ボタン */}
              {isListening && (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full"
                  onClick={isPaused ? resume : pause}
                  aria-label={isPaused ? "録音を再開" : "一時停止"}
                >
                  {isPaused ? (
                    <Play className="h-5 w-5" />
                  ) : (
                    <Pause className="h-5 w-5" />
                  )}
                </Button>
              )}

              {/* メインマイクボタン */}
              {!isListening ? (
                <button
                  onClick={start}
                  disabled={!isSupported}
                  className="relative h-20 w-20 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg cursor-pointer"
                  aria-label="録音を開始"
                >
                  <Mic className="h-8 w-8" />
                </button>
              ) : (
                <button
                  className={`relative h-20 w-20 rounded-full flex items-center justify-center text-white shadow-lg cursor-pointer ${
                    isPaused
                      ? "bg-orange-500 mic-pulse-paused"
                      : "bg-red-500 mic-pulse"
                  }`}
                  onClick={stop}
                  aria-label="録音を停止"
                >
                  <Mic className="h-8 w-8" />
                </button>
              )}

              {/* 停止ボタン */}
              {isListening && (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full border-red-300 text-red-500 hover:bg-red-50 hover:text-red-600"
                  onClick={stop}
                  aria-label="録音を完全停止"
                >
                  <Square className="h-5 w-5" />
                </Button>
              )}
            </div>

            {/* ステータス表示 */}
            <p className="text-sm text-gray-500 mt-4">
              {!isListening && !entries.length && "マイクボタンを押して録音開始"}
              {!isListening && entries.length > 0 && "録音停止中"}
              {isListening && !isPaused && "録音中..."}
              {isListening && isPaused && "一時停止中"}
            </p>
          </div>
        </section>

        {/* 中間結果表示 */}
        {interimTranscript && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-400 italic" aria-live="polite">
              {interimTranscript}
            </p>
          </div>
        )}

        {/* テキスト表示エリア */}
        {entries.length > 0 && (
          <section className="mb-8" aria-label="認識テキスト一覧">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                認識テキスト ({entries.length}件)
              </h2>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1"
                onClick={() => setShowManualInput(!showManualInput)}
                aria-label="手動メモを追加"
              >
                <Plus className="h-4 w-4" />
                メモ追加
              </Button>
            </div>

            {/* 手動メモ入力 */}
            {showManualInput && (
              <div className="flex gap-2 mb-4">
                <Input
                  value={manualNote}
                  onChange={(e) => setManualNote(e.target.value)}
                  placeholder="手動メモを入力..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddManualNote();
                    }
                  }}
                  aria-label="手動メモ入力"
                />
                <Button onClick={handleAddManualNote} size="sm">
                  追加
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowManualInput(false);
                    setManualNote("");
                  }}
                  aria-label="手動メモ入力を閉じる"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* エントリ一覧 */}
            <div className="space-y-2">
              {entries.map((entry) => (
                <Card
                  key={entry.id}
                  className={`transition-colors ${
                    entry.isImportant ? "border-yellow-300 bg-yellow-50" : ""
                  } ${entry.isManual ? "border-blue-200 bg-blue-50" : ""}`}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-gray-400 shrink-0">
                            {formatElapsedTime(entry.timestamp)}
                          </span>
                          {entry.isManual && (
                            <Badge variant="outline" className="text-[10px] py-0">
                              手動メモ
                            </Badge>
                          )}
                          {entry.isImportant && (
                            <Badge
                              variant="default"
                              className="text-[10px] py-0 bg-yellow-500"
                            >
                              重要
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-800">{entry.text}</p>
                      </div>
                      <button
                        onClick={() => toggleImportant(entry.id)}
                        className={`shrink-0 p-1 rounded transition-colors cursor-pointer ${
                          entry.isImportant
                            ? "text-yellow-500 hover:text-yellow-600"
                            : "text-gray-300 hover:text-yellow-400"
                        }`}
                        aria-label={
                          entry.isImportant
                            ? "重要マークを解除"
                            : "重要マークを付ける"
                        }
                      >
                        <Star
                          className="h-4 w-4"
                          fill={entry.isImportant ? "currentColor" : "none"}
                        />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* 保存ボタン（固定フッター） */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 p-4">
        <div className="max-w-3xl mx-auto">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            size="lg"
            className="w-full gap-2"
          >
            <Save className="h-5 w-5" />
            {isSaving ? "保存中..." : "議事録を保存"}
          </Button>
        </div>
      </div>
    </div>
  );
}
