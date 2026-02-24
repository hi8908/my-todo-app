"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Edit3,
  Eye,
  Trash2,
  Copy,
  FileText,
  Clock,
  Users,
  Calendar,
  Star,
  ChevronUp,
  ChevronDown,
  Plus,
  X,
  Check,
  Save,
} from "lucide-react";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Header } from "@/components/meeting/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { getMeetingById, saveMeeting, deleteMeeting, generateId } from "@/lib/storage";
import { formatElapsedTime, exportToMarkdown, exportToText } from "@/lib/export";
import type {
  MeetingMinutes,
  TranscriptEntry,
  Decision,
  ActionItem,
} from "@/types/meeting";

export default function MinutesDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [meeting, setMeeting] = useState<MeetingMinutes | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // 編集用の一時状態
  const [editTitle, setEditTitle] = useState("");
  const [editEntries, setEditEntries] = useState<TranscriptEntry[]>([]);
  const [editSummary, setEditSummary] = useState<string[]>([]);
  const [editDecisions, setEditDecisions] = useState<Decision[]>([]);
  const [editActions, setEditActions] = useState<ActionItem[]>([]);

  // 新規入力用
  const [newSummary, setNewSummary] = useState("");
  const [newDecision, setNewDecision] = useState("");
  const [newAction, setNewAction] = useState({ task: "", assignee: "", deadline: "" });

  // データ読み込み
  useEffect(() => {
    const data = getMeetingById(id);
    if (data) {
      setMeeting(data);
      setEditTitle(data.title);
      setEditEntries([...data.entries]);
      setEditSummary([...data.summary]);
      setEditDecisions([...data.decisions]);
      setEditActions([...data.actions]);
    }
    setIsLoaded(true);
  }, [id]);

  // 編集モード切替
  const toggleEdit = useCallback(() => {
    if (isEditing && meeting) {
      // 編集内容を保存
      const updated: MeetingMinutes = {
        ...meeting,
        title: editTitle,
        entries: editEntries,
        summary: editSummary,
        decisions: editDecisions,
        actions: editActions,
        updatedAt: new Date().toISOString(),
      };
      saveMeeting(updated);
      setMeeting(updated);
    }
    setIsEditing(!isEditing);
  }, [isEditing, meeting, editTitle, editEntries, editSummary, editDecisions, editActions]);

  // エントリテキストの編集
  const handleEntryTextChange = useCallback((entryId: string, text: string) => {
    setEditEntries((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, text } : e))
    );
  }, []);

  // エントリの重要マーク切替
  const handleToggleImportant = useCallback((entryId: string) => {
    setEditEntries((prev) =>
      prev.map((e) =>
        e.id === entryId ? { ...e, isImportant: !e.isImportant } : e
      )
    );
  }, []);

  // エントリの並び替え
  const handleMoveEntry = useCallback((index: number, direction: "up" | "down") => {
    setEditEntries((prev) => {
      const newEntries = [...prev];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newEntries.length) return prev;
      [newEntries[index], newEntries[targetIndex]] = [
        newEntries[targetIndex],
        newEntries[index],
      ];
      return newEntries;
    });
  }, []);

  // 要点まとめの追加
  const handleAddSummary = useCallback(() => {
    if (newSummary.trim()) {
      setEditSummary((prev) => [...prev, newSummary.trim()]);
      setNewSummary("");
    }
  }, [newSummary]);

  // 要点まとめの削除
  const handleRemoveSummary = useCallback((index: number) => {
    setEditSummary((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // 決定事項の追加
  const handleAddDecision = useCallback(() => {
    if (newDecision.trim()) {
      setEditDecisions((prev) => [
        ...prev,
        { id: generateId(), text: newDecision.trim(), isCompleted: false },
      ]);
      setNewDecision("");
    }
  }, [newDecision]);

  // 決定事項の完了切替
  const handleToggleDecision = useCallback((decisionId: string) => {
    setEditDecisions((prev) =>
      prev.map((d) =>
        d.id === decisionId ? { ...d, isCompleted: !d.isCompleted } : d
      )
    );
  }, []);

  // 決定事項の削除
  const handleRemoveDecision = useCallback((decisionId: string) => {
    setEditDecisions((prev) => prev.filter((d) => d.id !== decisionId));
  }, []);

  // アクションアイテムの追加
  const handleAddAction = useCallback(() => {
    if (newAction.task.trim()) {
      setEditActions((prev) => [
        ...prev,
        {
          id: generateId(),
          task: newAction.task.trim(),
          assignee: newAction.assignee.trim(),
          deadline: newAction.deadline,
          isCompleted: false,
        },
      ]);
      setNewAction({ task: "", assignee: "", deadline: "" });
    }
  }, [newAction]);

  // アクションアイテムの完了切替
  const handleToggleAction = useCallback((actionId: string) => {
    setEditActions((prev) =>
      prev.map((a) =>
        a.id === actionId ? { ...a, isCompleted: !a.isCompleted } : a
      )
    );
  }, []);

  // アクションアイテムの削除
  const handleRemoveAction = useCallback((actionId: string) => {
    setEditActions((prev) => prev.filter((a) => a.id !== actionId));
  }, []);

  // 議事録の削除
  const handleDelete = useCallback(() => {
    deleteMeeting(id);
    router.push("/");
  }, [id, router]);

  // クリップボードにコピー
  const handleCopy = useCallback(
    async (type: "markdown" | "text") => {
      if (!meeting) return;

      // 現在の編集状態を反映
      const current: MeetingMinutes = isEditing
        ? {
            ...meeting,
            title: editTitle,
            entries: editEntries,
            summary: editSummary,
            decisions: editDecisions,
            actions: editActions,
          }
        : meeting;

      const content =
        type === "markdown"
          ? exportToMarkdown(current)
          : exportToText(current);

      try {
        await navigator.clipboard.writeText(content);
        setCopySuccess(type === "markdown" ? "Markdown" : "テキスト");
        setTimeout(() => setCopySuccess(null), 2000);
      } catch {
        // フォールバック
        const textarea = document.createElement("textarea");
        textarea.value = content;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        setCopySuccess(type === "markdown" ? "Markdown" : "テキスト");
        setTimeout(() => setCopySuccess(null), 2000);
      }
    },
    [meeting, isEditing, editTitle, editEntries, editSummary, editDecisions, editActions]
  );

  // 読み込み中
  if (!isLoaded) {
    return (
      <div className="min-h-screen">
        <Header showBack />
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/2" />
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-64 bg-gray-200 rounded-xl" />
          </div>
        </main>
      </div>
    );
  }

  // 見つからない場合
  if (!meeting) {
    return (
      <div className="min-h-screen">
        <Header showBack />
        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            議事録が見つかりません
          </h2>
          <p className="text-gray-500 mb-6">
            指定された議事録は存在しないか、削除されました。
          </p>
          <Button onClick={() => router.push("/")} variant="outline">
            ホームに戻る
          </Button>
        </main>
      </div>
    );
  }

  const dateStr = format(new Date(meeting.createdAt), "yyyy年M月d日 (E) HH:mm", {
    locale: ja,
  });

  // 表示用のデータ（編集中は編集状態、それ以外は保存済み）
  const displayEntries = isEditing ? editEntries : meeting.entries;
  const displaySummary = isEditing ? editSummary : meeting.summary;
  const displayDecisions = isEditing ? editDecisions : meeting.decisions;
  const displayActions = isEditing ? editActions : meeting.actions;
  const displayTitle = isEditing ? editTitle : meeting.title;

  return (
    <div className="min-h-screen pb-8">
      <Header title={displayTitle} showBack />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 会議基本情報 */}
        <section className="mb-8" aria-label="会議基本情報">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="text-2xl font-bold mb-2"
                  aria-label="会議タイトル"
                />
              ) : (
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {meeting.title}
                </h1>
              )}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {dateStr}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {meeting.participants.length > 0
                    ? meeting.participants.join("、")
                    : "参加者未設定"}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatElapsedTime(meeting.duration)}
                </span>
              </div>
            </div>

            {/* アクションボタン群 */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant={isEditing ? "default" : "outline"}
                size="sm"
                onClick={toggleEdit}
                className="gap-1"
              >
                {isEditing ? (
                  <>
                    <Save className="h-4 w-4" />
                    保存
                  </>
                ) : (
                  <>
                    <Edit3 className="h-4 w-4" />
                    編集
                  </>
                )}
              </Button>
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  削除
                </Button>
              )}
            </div>
          </div>

          {/* アジェンダ表示 */}
          {meeting.agenda && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                アジェンダ
              </h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {meeting.agenda}
              </p>
            </div>
          )}
        </section>

        {/* 全文テキスト */}
        <section className="mb-8" aria-label="議事録テキスト">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            議事録テキスト ({displayEntries.length}件)
          </h2>
          {displayEntries.length > 0 ? (
            <div className="space-y-2">
              {displayEntries.map((entry, index) => (
                <Card
                  key={entry.id}
                  className={`transition-colors ${
                    entry.isImportant ? "border-yellow-300 bg-yellow-50" : ""
                  } ${entry.isManual ? "border-blue-200 bg-blue-50" : ""}`}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      {/* 並び替えボタン（編集モード時のみ） */}
                      {isEditing && (
                        <div className="flex flex-col shrink-0">
                          <button
                            onClick={() => handleMoveEntry(index, "up")}
                            disabled={index === 0}
                            className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                            aria-label="上に移動"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleMoveEntry(index, "down")}
                            disabled={index === displayEntries.length - 1}
                            className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                            aria-label="下に移動"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                        </div>
                      )}

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
                        {isEditing ? (
                          <Input
                            value={entry.text}
                            onChange={(e) =>
                              handleEntryTextChange(entry.id, e.target.value)
                            }
                            className="text-sm"
                            aria-label={`発言内容 ${index + 1}`}
                          />
                        ) : (
                          <p className="text-sm text-gray-800">{entry.text}</p>
                        )}
                      </div>

                      {/* 重要マーク */}
                      <button
                        onClick={() => handleToggleImportant(entry.id)}
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
          ) : (
            <p className="text-sm text-gray-400 italic">テキストなし</p>
          )}
        </section>

        {/* 要点まとめセクション */}
        <section className="mb-8" aria-label="要点まとめ">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            要点まとめ
          </h2>
          {displaySummary.length > 0 && (
            <ul className="space-y-2 mb-4">
              {displaySummary.map((item, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-gray-700 bg-white rounded-lg border border-gray-200 p-3"
                >
                  <span className="text-blue-500 shrink-0 mt-0.5">&#x2022;</span>
                  <span className="flex-1">{item}</span>
                  {isEditing && (
                    <button
                      onClick={() => handleRemoveSummary(index)}
                      className="text-gray-400 hover:text-red-500 shrink-0 cursor-pointer"
                      aria-label="要点を削除"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {isEditing && (
            <div className="flex gap-2">
              <Input
                value={newSummary}
                onChange={(e) => setNewSummary(e.target.value)}
                placeholder="要点を追加..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddSummary();
                  }
                }}
                aria-label="新しい要点"
              />
              <Button onClick={handleAddSummary} size="sm" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
          {!isEditing && displaySummary.length === 0 && (
            <p className="text-sm text-gray-400 italic">
              編集モードで要点を追加できます
            </p>
          )}
        </section>

        {/* 決定事項セクション */}
        <section className="mb-8" aria-label="決定事項">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            決定事項
          </h2>
          {displayDecisions.length > 0 && (
            <ul className="space-y-2 mb-4">
              {displayDecisions.map((decision) => (
                <li
                  key={decision.id}
                  className="flex items-center gap-3 text-sm bg-white rounded-lg border border-gray-200 p-3"
                >
                  <button
                    onClick={() => handleToggleDecision(decision.id)}
                    className={`shrink-0 h-5 w-5 rounded border-2 flex items-center justify-center transition-colors cursor-pointer ${
                      decision.isCompleted
                        ? "bg-green-500 border-green-500 text-white"
                        : "border-gray-300 hover:border-green-400"
                    }`}
                    aria-label={
                      decision.isCompleted
                        ? "未完了にする"
                        : "完了にする"
                    }
                  >
                    {decision.isCompleted && (
                      <Check className="h-3 w-3" />
                    )}
                  </button>
                  <span
                    className={`flex-1 ${
                      decision.isCompleted
                        ? "line-through text-gray-400"
                        : "text-gray-700"
                    }`}
                  >
                    {decision.text}
                  </span>
                  {isEditing && (
                    <button
                      onClick={() => handleRemoveDecision(decision.id)}
                      className="text-gray-400 hover:text-red-500 shrink-0 cursor-pointer"
                      aria-label="決定事項を削除"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {isEditing && (
            <div className="flex gap-2">
              <Input
                value={newDecision}
                onChange={(e) => setNewDecision(e.target.value)}
                placeholder="決定事項を追加..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddDecision();
                  }
                }}
                aria-label="新しい決定事項"
              />
              <Button onClick={handleAddDecision} size="sm" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
          {!isEditing && displayDecisions.length === 0 && (
            <p className="text-sm text-gray-400 italic">
              編集モードで決定事項を追加できます
            </p>
          )}
        </section>

        {/* アクションアイテムセクション */}
        <section className="mb-8" aria-label="アクションアイテム">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            次回アクション
          </h2>
          {displayActions.length > 0 && (
            <ul className="space-y-2 mb-4">
              {displayActions.map((action) => (
                <li
                  key={action.id}
                  className="flex items-start gap-3 text-sm bg-white rounded-lg border border-gray-200 p-3"
                >
                  <button
                    onClick={() => handleToggleAction(action.id)}
                    className={`shrink-0 h-5 w-5 rounded border-2 flex items-center justify-center transition-colors mt-0.5 cursor-pointer ${
                      action.isCompleted
                        ? "bg-green-500 border-green-500 text-white"
                        : "border-gray-300 hover:border-green-400"
                    }`}
                    aria-label={
                      action.isCompleted ? "未完了にする" : "完了にする"
                    }
                  >
                    {action.isCompleted && (
                      <Check className="h-3 w-3" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <span
                      className={`block ${
                        action.isCompleted
                          ? "line-through text-gray-400"
                          : "text-gray-700"
                      }`}
                    >
                      {action.task}
                    </span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {action.assignee && (
                        <Badge variant="secondary" className="text-[10px]">
                          担当: {action.assignee}
                        </Badge>
                      )}
                      {action.deadline && (
                        <Badge variant="outline" className="text-[10px]">
                          期限: {action.deadline}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {isEditing && (
                    <button
                      onClick={() => handleRemoveAction(action.id)}
                      className="text-gray-400 hover:text-red-500 shrink-0 cursor-pointer"
                      aria-label="アクションアイテムを削除"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {isEditing && (
            <div className="space-y-2 bg-gray-50 rounded-lg p-4">
              <Input
                value={newAction.task}
                onChange={(e) =>
                  setNewAction((prev) => ({ ...prev, task: e.target.value }))
                }
                placeholder="タスク内容"
                aria-label="タスク内容"
              />
              <div className="flex gap-2">
                <Input
                  value={newAction.assignee}
                  onChange={(e) =>
                    setNewAction((prev) => ({
                      ...prev,
                      assignee: e.target.value,
                    }))
                  }
                  placeholder="担当者"
                  aria-label="担当者"
                />
                <Input
                  type="date"
                  value={newAction.deadline}
                  onChange={(e) =>
                    setNewAction((prev) => ({
                      ...prev,
                      deadline: e.target.value,
                    }))
                  }
                  aria-label="期限"
                />
              </div>
              <Button
                onClick={handleAddAction}
                size="sm"
                variant="outline"
                className="gap-1"
              >
                <Plus className="h-4 w-4" />
                追加
              </Button>
            </div>
          )}
          {!isEditing && displayActions.length === 0 && (
            <p className="text-sm text-gray-400 italic">
              編集モードでアクションアイテムを追加できます
            </p>
          )}
        </section>

        {/* エクスポートボタン */}
        <section className="mb-8" aria-label="エクスポート">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            エクスポート
          </h2>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => handleCopy("markdown")}
            >
              <Copy className="h-4 w-4" />
              Markdown形式でコピー
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => handleCopy("text")}
            >
              <FileText className="h-4 w-4" />
              テキスト形式でコピー
            </Button>
          </div>
          {copySuccess && (
            <p
              className="text-sm text-green-600 mt-2 flex items-center gap-1"
              role="status"
            >
              <Check className="h-4 w-4" />
              {copySuccess}形式でコピーしました
            </p>
          )}
        </section>
      </main>

      {/* 削除確認ダイアログ */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent onClose={() => setShowDeleteDialog(false)}>
          <DialogHeader>
            <DialogTitle>議事録を削除しますか？</DialogTitle>
            <DialogDescription>
              「{meeting.title}」を削除します。この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              キャンセル
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              削除する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
