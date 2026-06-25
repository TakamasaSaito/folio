# FOLIO — Codex 引き継ぎドキュメント

## プロジェクト概要

**FOLIO** は資産ポートフォリオ管理Webアプリ。
マネーフォワード等のスクリーンショットをChatGPTでJSON化し、
FOLIOにインポートして資産推移を可視化する。

- **GitHub**: https://github.com/TakamasaSaito/folio
- **本番URL**: Netlify（GitHub pushで自動デプロイ）
- **開発環境**: WSL/Ubuntu + Claude Code

---

## 技術スタック

| 項目 | 内容 |
|------|------|
| フロント | HTML / CSS / Vanilla JavaScript |
| グラフ | Chart.js 4.4.1（CDN） |
| フォント | Google Fonts（Noto Sans JP / DM Serif Display / JetBrains Mono） |
| AI連携 | なし（ChatGPT経由のJSONインポート方式） |
| データ保存 | localStorage のみ |
| デプロイ | Netlify（mainブランチ自動デプロイ） |

---

## ファイル構成

```
folio/
├── index.html          # メインHTML
├── css/
│   ├── base.css        # CSS変数・リセット・アニメーション
│   ├── components.css  # 共通UIコンポーネント
│   └── screens.css     # 各画面スタイル
├── js/
│   ├── main.js         # 初期化・ルーティング・イベント
│   ├── api.js          # Gemini APIラッパー（現在未使用）
│   ├── data.js         # localStorage CRUD
│   ├── charts.js       # Chart.js描画
│   ├── dashboard.js    # ホーム・ダッシュボード描画
│   ├── risk.js         # リスクスコア計算・描画
│   ├── simulation.js   # シミュレーション計算・描画
│   └── settings.js     # カテゴリ・目標・インポート・エクスポート
├── CLAUDE.md
└── netlify.toml
```

---

## 画面構成（現在）

| 画面 | ID | 内容 |
|------|-----|------|
| ホーム | sc-home | スパークライン・メトリクス・JSONインポート・変換プロンプト |
| ダッシュボード | sc-dash | KPI・折れ線・ドーナツ・棒グラフ・テーブル・インサイト |
| リスク診断 | sc-risk | リスクスコア・3軸メーター・アドバイス・ボラティリティ |
| シミュレーション | sc-sim | 積立シミュレーション・シナリオ比較 |
| 設定 | sc-settings | カテゴリ管理・目標設定・データ管理 |

**ナビ（サイドバー・PC / ボトムナビ・モバイル）：**
ホーム / ダッシュボード / リスク診断 / シミュレーション / 設定

---

## データフロー（重要）

```
① iPhoneでマネーフォワード等のスクショを撮影
② ChatGPTに以下のプロンプトと一緒にスクショを投げる：

「以下のスクリーンショットをFOLIO用JSONに変換してください。
Exifの撮影日時から月（YYYY-MM形式）を特定してください。
出力形式（このJSONのみ出力・説明文不要）:
{
  "version": 1,
  "allData": [
    {
      "month": "YYYY-MM",
      "total": 数値,
      "categories": {
        "株式": 数値,
        "投資信託": 数値,
        "現金・預金": 数値,
        "その他": 数値
      },
      "note": "アプリ名"
    }
  ]
}」

③ ChatGPTが出力したJSONをFOLIOのホーム画面の
   テキストエリアに貼り付けて「貼り付けてインポート」
④ ダッシュボードで可視化
```

---

## データ構造（localStorage）

```javascript
// 月次データ（キー: folio_data）
[
  {
    month: "2026-06",        // YYYY-MM
    total: 43275922,         // 総資産（円）
    categories: {
      "株式": 15991046,
      "投資信託": 2613557,
      "現金・預金": 24671319,
      "その他": 0
    },
    note: "マネーフォワード ME"
  }
]

// カテゴリ設定（キー: folio_cats）
[
  { name: "株式", color: "#c9a84c" },
  { name: "投資信託", color: "#4fa3e8" },
  { name: "現金・預金", color: "#2dd4a0" },
  { name: "その他", color: "#f5a623" }
]

// 目標設定（キー: folio_goal）
{ amount: 0, date: "" }  // amount は万円単位
```

---

## デザインシステム

```css
/* Gold luxury dark theme */
--ink: #07080e;       /* 最暗背景 */
--deep: #0b0d16;
--card: #10131f;      /* カード背景 */
--raise: #161b2a;     /* 一段上の背景 */
--gold: #c9a84c;      /* メインアクセント */
--gold-grad: linear-gradient(135deg, #b8882e 0%, #e8c97a 45%, #c9a84c 100%);
--emerald: #2dd4a0;   /* 上昇・成功 */
--ruby: #f05c6e;      /* 下降・エラー */
--txt: #e8edf8;       /* メインテキスト */
--txt2: #8b92a8;      /* サブテキスト */
--txt3: #3e4560;      /* ミュートテキスト */
```

**フォント使い分け：**
- `DM Serif Display` — 数値・タイトル
- `JetBrains Mono` — ラベル・日付・コード的情報
- `Noto Sans JP` — 本文・ボタン

---

## 現在の既知の課題・TODO

| 優先度 | 内容 |
|--------|------|
| 高 | スパークラインの見栄え改善（高さ・ポイント・ラベル表示） |
| 高 | クイックナビの「AIレポート」タイルを削除（3タイルに） |
| 中 | モバイル表示の最適化（現在PC向けが主） |
| 中 | JSONインポート時の重複データ処理の改善 |
| 低 | ダッシュボードのグラフタップ時モーダルの改善 |

---

## 開発ルール

1. **Chart.jsは再描画前に必ず `destroy()`** を呼ぶこと
2. **データは必ず `saveData()` で localStorage に保存**
3. **同じ month のデータは上書き**（重複禁止）
4. **インポート後は必ず日付順ソート**
5. **pushするたびにNetlifyが自動デプロイ**

---

## Codexでの開発開始コマンド

```bash
cd ~/folio && git pull
```

最初の指示例：
```
CLAUDE.mdを読んでください。
現在の課題はスパークラインの改善とAIレポートタイルの削除です。
```

---

## 連絡事項

- Gemini APIは使用しない方針（クレジット枯渇のため）
- ChatGPT経由のJSONインポートが主要なデータ入力フロー
- AIレポート機能は今後削除予定
- Netlifyが本番環境（GitHub Pages は並行稼働中）
