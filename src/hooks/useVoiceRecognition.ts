"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { TranscriptEntry } from "@/types/meeting";
import { generateId } from "@/lib/storage";

export type VoiceRecognitionError =
  | "not-supported"
  | "permission-denied"
  | "network"
  | "unknown"
  | null;

interface UseVoiceRecognitionReturn {
  isListening: boolean;
  isPaused: boolean;
  entries: TranscriptEntry[];
  interimTranscript: string;
  elapsedTime: number;
  error: VoiceRecognitionError;
  isSupported: boolean;
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  addManualEntry: (text: string) => void;
  toggleImportant: (id: string) => void;
  setEntries: React.Dispatch<React.SetStateAction<TranscriptEntry[]>>;
}

export function useVoiceRecognition(): UseVoiceRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [entries, setEntries] = useState<TranscriptEntry[]>([]);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [error, setError] = useState<VoiceRecognitionError>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const isListeningRef = useRef(false);
  const isPausedRef = useRef(false);
  const shouldRestartRef = useRef(false);

  // ブラウザ対応チェック
  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  // 経過時間タイマーの管理
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      if (!isPausedRef.current) {
        const now = Date.now();
        const elapsed = Math.floor(
          (now - startTimeRef.current - pausedTimeRef.current) / 1000
        );
        setElapsedTime(elapsed);
      }
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // SpeechRecognitionインスタンスの初期化
  const createRecognition = useCallback(() => {
    if (!isSupported) return null;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = "ja-JP";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          const text = result[0].transcript.trim();
          if (text) {
            const now = Date.now();
            const timestamp = Math.floor(
              (now - startTimeRef.current - pausedTimeRef.current) / 1000
            );
            setEntries((prev) => [
              ...prev,
              {
                id: generateId(),
                text,
                timestamp,
                isImportant: false,
                isManual: false,
              },
            ]);
          }
          setInterimTranscript("");
        } else {
          interim += result[0].transcript;
        }
      }
      if (interim) {
        setInterimTranscript(interim);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "not-allowed") {
        setError("permission-denied");
        setIsListening(false);
        isListeningRef.current = false;
        stopTimer();
      } else if (event.error === "network") {
        setError("network");
      } else if (event.error === "aborted") {
        // 手動停止時はエラーとして扱わない
      } else if (event.error !== "no-speech") {
        // no-speechは無視（自動再開する）
        console.warn("音声認識エラー:", event.error);
      }
    };

    // 認識が途中で停止した場合の自動再開
    recognition.onend = () => {
      if (isListeningRef.current && !isPausedRef.current && shouldRestartRef.current) {
        try {
          recognition.start();
        } catch {
          // すでに開始中の場合は無視
        }
      }
    };

    return recognition;
  }, [isSupported, stopTimer]);

  // 録音開始
  const start = useCallback(() => {
    if (!isSupported) {
      setError("not-supported");
      return;
    }

    setError(null);
    const recognition = createRecognition();
    if (!recognition) return;

    recognitionRef.current = recognition;
    startTimeRef.current = Date.now();
    pausedTimeRef.current = 0;
    shouldRestartRef.current = true;

    try {
      recognition.start();
      setIsListening(true);
      isListeningRef.current = true;
      setIsPaused(false);
      isPausedRef.current = false;
      setElapsedTime(0);
      setEntries([]);
      setInterimTranscript("");
      startTimer();
    } catch {
      setError("unknown");
    }
  }, [isSupported, createRecognition, startTimer]);

  // 一時停止
  const pause = useCallback(() => {
    if (recognitionRef.current && isListeningRef.current) {
      shouldRestartRef.current = false;
      recognitionRef.current.stop();
      setIsPaused(true);
      isPausedRef.current = true;
      pausedTimeRef.current -= Date.now(); // 一時停止開始時刻を記録（負の値を加算）
      setInterimTranscript("");
    }
  }, []);

  // 再開
  const resume = useCallback(() => {
    if (recognitionRef.current && isPausedRef.current) {
      pausedTimeRef.current += Date.now(); // 一時停止期間を計算
      shouldRestartRef.current = true;
      const recognition = createRecognition();
      if (!recognition) return;
      recognitionRef.current = recognition;
      try {
        recognition.start();
        setIsPaused(false);
        isPausedRef.current = false;
      } catch {
        setError("unknown");
      }
    }
  }, [createRecognition]);

  // 停止
  const stop = useCallback(() => {
    shouldRestartRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    isListeningRef.current = false;
    setIsPaused(false);
    isPausedRef.current = false;
    setInterimTranscript("");
    stopTimer();
  }, [stopTimer]);

  // 手動メモ追加
  const addManualEntry = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      const timestamp = isListeningRef.current
        ? Math.floor(
            (Date.now() - startTimeRef.current - pausedTimeRef.current) / 1000
          )
        : elapsedTime;
      setEntries((prev) => [
        ...prev,
        {
          id: generateId(),
          text: text.trim(),
          timestamp,
          isImportant: false,
          isManual: true,
        },
      ]);
    },
    [elapsedTime]
  );

  // 重要マーク切り替え
  const toggleImportant = useCallback((id: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, isImportant: !e.isImportant } : e))
    );
  }, []);

  // クリーンアップ
  useEffect(() => {
    return () => {
      shouldRestartRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      stopTimer();
    };
  }, [stopTimer]);

  return {
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
    setEntries,
  };
}
