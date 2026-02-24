# Gijiroku - 音声議事録作成アプリ

ブラウザの Web Speech API を使って、会議の音声をリアルタイムでテキスト化し、議事録として整理・保存する Web アプリケーションです。外部 API キー不要で、ブラウザだけで完結します。

## 主な機能

- **音声認識**: ブラウザのWeb Speech APIを使ったリアルタイム音声テキスト化
- **議事録管理**: 議事録の作成・編集・検索・削除
- **議事録整理**: 要点まとめ、決定事項、アクションアイテムの管理
- **エクスポート**: Markdown形式・テキスト形式でのクリップボードコピー
- **オフライン対応**: localStorageによるデータ永続化

## 技術スタック

| 技術 | 用途 |
|------|------|
| Next.js 16 (App Router) | フレームワーク |
| TypeScript (strict mode) | 言語 |
| Tailwind CSS v4 | スタイリング |
| shadcn/ui ベースコンポーネント | UIコンポーネント |
| Web Speech API | 音声認識 |
| localStorage | データ永続化 |
| date-fns | 日時フォーマット |
| Lucide React | アイコン |

## セットアップ手順

### 前提条件

- Node.js 18.0 以上
- npm 9.0 以上

### インストール

```bash
# リポジトリをクローン
git clone <repository-url>
cd gijiroku

# 依存パッケージのインストール
npm install

# 開発サーバーの起動
npm run dev
```

ブラウザで http://localhost:3000 を開いてアプリにアクセスしてください。

### ビルド

```bash
# プロダクションビルド
npm run build

# プロダクションサーバーの起動
npm start
```

## 使い方

### 1. 議事録の作成

1. ホーム画面で「新しい議事録を作成」ボタンをクリック
2. 会議タイトル（必須）、参加者、アジェンダを入力
3. マイクボタンを押して録音を開始
4. 音声がリアルタイムでテキスト化されます
5. 必要に応じて手動メモを追加、重要マークを付与
6. 「議事録を保存」ボタンで保存

### 2. 議事録の編集

1. ホーム画面から議事録カードをクリック
2. 「編集」ボタンで編集モードに切替
3. テキストの修正、発言の並び替え、要点・決定事項・アクションアイテムの追加が可能
4. 「保存」ボタンで変更を保存

### 3. 議事録のエクスポート

- 詳細画面下部の「Markdown形式でコピー」または「テキスト形式でコピー」をクリック
- クリップボードにコピーされるので、任意のエディタに貼り付け可能

## 画面構成

| 画面 | パス | 説明 |
|------|------|------|
| ホーム | `/` | 議事録一覧（検索・カード表示） |
| 録音 | `/record` | 新規議事録の作成・音声録音 |
| 詳細 | `/minutes/[id]` | 議事録の閲覧・編集・エクスポート |

## ブラウザ対応状況

Web Speech API を使用しているため、対応ブラウザに制限があります。

| ブラウザ | 対応状況 |
|----------|----------|
| Google Chrome（デスクトップ/Android） | 対応 |
| Microsoft Edge | 対応 |
| Safari（macOS/iOS） | 部分対応（一部制限あり） |
| Firefox | 非対応 |

**推奨**: Google Chrome の最新版をご利用ください。

## ディレクトリ構成

```
src/
├── app/
│   ├── globals.css          # グローバルスタイル
│   ├── layout.tsx           # ルートレイアウト
│   ├── page.tsx             # ホーム画面
│   ├── record/
│   │   ├── layout.tsx       # 録音画面レイアウト
│   │   └── page.tsx         # 録音画面
│   └── minutes/
│       └── [id]/
│           ├── layout.tsx   # 詳細画面レイアウト
│           └── page.tsx     # 詳細画面
├── components/
│   ├── ui/                  # 基本UIコンポーネント
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   └── textarea.tsx
│   └── meeting/             # 議事録関連コンポーネント
│       ├── EmptyState.tsx
│       ├── ErrorBoundary.tsx
│       ├── Header.tsx
│       └── MeetingCard.tsx
├── hooks/
│   └── useVoiceRecognition.ts  # 音声認識カスタムフック
├── lib/
│   ├── export.ts            # エクスポートユーティリティ
│   ├── storage.ts           # localStorage管理
│   └── utils.ts             # ユーティリティ関数
└── types/
    └── meeting.ts           # 型定義
```

## ライセンス

MIT
