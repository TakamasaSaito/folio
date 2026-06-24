# FOLIO — Claude Code 開発指示書

## 概要

**FOLIO** は、証券・銀行アプリのスクリーンショットをGemini AIで自動解析し、資産ポートフォリオを管理するWebアプリです。サーバー不要・静的ファイルのみで動作します。

---

## 技術スタック

| 項目 | 内容 |
|------|------|
| フレームワーク | Vanilla HTML / CSS / JavaScript（TypeScript不要） |
| グラフ | Chart.js 4.4.1（CDN） |
| フォント | Google Fonts（Noto Sans JP / DM Serif Display / JetBrains Mono） |
| AI | Gemini 1.5 Flash API（ブラウザから直接fetch呼び出し） |
| データ保存 | localStorage のみ（サーバー・DB不要） |
| デプロイ | GitHub Pages（静的ホスティング） |

---

## ファイル構成

```
folio/
├── index.html          # メインHTML（シェル・モーダル・ナビ）
├── css/
│   ├── base.css        # CSS変数・リセット・アニメーション
│   ├── components.css  # カード・ボタン・フォーム等の共通部品
│   └── screens.css     # 各画面固有のスタイル
├── js/
│   ├── main.js         # 初期化・ルーティング・イベント登録
│   ├── api.js          # Gemini API呼び出し（Vision / Text）
│   ├── data.js         # データCRUD・localStorage永続化
│   ├── charts.js       # Chart.js描画（折れ線・ドーナツ・棒・シム）
│   ├── dashboard.js    # ダッシュボード・ホームサマリー描画
│   ├── risk.js         # リスクスコア計算・アドバイス描画
│   ├── simulation.js   # 将来シミュレーション計算
│   └── settings.js     # カテゴリ管理・APIキー・目標設定
└── README.md
```

---

## デザインシステム

### テーマ（ダーク固定）

```css
:root {
  /* Backgrounds */
  --ink: #07080e;
  --deep: #0b0d16;
  --card: #10131f;
  --raise: #161b2a;
  --lift: #1d2336;

  /* Gold palette */
  --gold: #c9a84c;
  --gold2: #e8c97a;
  --gold3: #f5dfa0;
  --gold-glow: rgba(201,168,76,.22);
  --gold-glow2: rgba(201,168,76,.10);
  --gold-grad: linear-gradient(135deg, #b8882e 0%, #e8c97a 45%, #c9a84c 100%);

  /* Borders */
  --line: rgba(201,168,76,.13);
  --line2: rgba(201,168,76,.06);
  --line3: rgba(255,255,255,.05);

  /* Accents */
  --emerald: #2dd4a0;
  --ruby: #f05c6e;
  --sapphire: #4fa3e8;
  --amber: #f5a623;

  /* Text */
  --txt: #e8edf8;
  --txt2: #8b92a8;
  --txt3: #3e4560;

  /* Layout */
  --nav-h: 64px;
  --safe-b: env(safe-area-inset-bottom, 0px);
}
```

### フォント使い分け

- **DM Serif Display** — 数値・見出し（¥金額、タイトル）
- **JetBrains Mono** — ラベル・日付・コード的情報
- **Noto Sans JP** — 本文・ボタン・説明文

---

## 画面構成（5画面 + 設定）

### 1. ホーム（`#sc-home`）

**データあり時：**
- ヒーローカード（総資産・前月比・スパークライン・目標進捗バー）
- メトリクスストリップ（前月比 / 累積 / 記録月数 / 最新）
- クイックナビグリッド（4タイル）

**データなし時：**
- エンプティステート（SVGグラフ + CTA）

**常時表示：**
- スクリーンショットアップロードカード
- サムネイルプレビュー
- アクションボタン3つ（Gemini解析 / 手動入力 / サンプル）
- プライバシーバー

### 2. ダッシュボード（`#sc-dash`）

- KPIストリップ（横スクロール4枚）
- 期間フィルター（3M / 6M / 1Y / ALL）
- 総資産推移（折れ線チャート、タップで月次モーダル）
- 資産配分（ドーナツチャート）
- カテゴリ別推移（積み上げ棒グラフ）
- 月次データテーブル（編集・削除・CSV出力）
- インサイト4件（自動生成）

### 3. リスク診断（`#sc-risk`）

- リスクスコア（0〜100、3軸：分散度・安定性・流動性）
- スコアメーター×3
- 改善アドバイス（red/yellow/green色分け）
- ボラティリティ棒グラフ

### 4. シミュレーション（`#sc-sim`）

**入力：** 毎月積立額 / 年間利回り / 期間（年） / 目標額（万円）

**出力：**
- 予測額・運用益・目標達成予測（3ブロック）
- 予測チャート（予測資産 / 元本 / 目標の3線）
- シナリオ比較チャート（弱気2% / 中立5% / 強気8%）

### 5. AIレポート（`#sc-report`）

**総合レポート：**
- Geminiにデータを渡してJSON形式でレポート取得
- セクション構成: サマリー / インサイト4件 / 今後の見通し
- 構造化表示（アイコン付きカード）

**資産配分アドバイス：**
- 年齢・リスク許容度（低/中/高）・投資目的（4種）を入力
- Geminiがテキスト形式でアドバイス生成

### 設定（`#sc-settings`）

- Gemini APIキー設定（入力・保存・削除・疎通確認）
- カテゴリ管理（追加・名前変更・カラー変更・削除）
- 目標設定（目標総資産額・達成期限）
- データ管理（JSONバックアップ・復元・CSV出力・全削除）

---

## Gemini API 呼び出し仕様

### 画像解析（Vision）

```javascript
// エンドポイント
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

// リクエスト
{
  contents: [{
    parts: [
      { inline_data: { mime_type: "image/jpeg", data: "<base64>" } },
      { text: "この画像は証券会社や銀行アプリのスクリーンショットです。以下の情報をJSONのみで回答してください（説明文・マークダウン不可）:\n{\"month\":\"YYYY-MM形式の年月\",\"total\":総資産の数値,\"categories\":{\"株式\":金額,\"投資信託\":金額,\"現金・預金\":金額,\"その他\":金額},\"note\":\"証券会社名など\"}\n金額が不明なカテゴリは0にしてください。" }
    ]
  }],
  generationConfig: { temperature: 0.1, maxOutputTokens: 512 }
}

// レスポンス取得
const text = data.candidates[0].content.parts[0].text;
const result = JSON.parse(text.replace(/```json|```/g, '').trim());
```

### テキスト生成（レポート）

```javascript
{
  contents: [{ parts: [{ text: prompt }] }],
  generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
}
```

**レポート用プロンプト出力形式（JSON強制）：**
```json
{
  "summary": "2〜3文の総括",
  "insights": [
    { "icon": "📈", "title": "強み", "text": "内容" },
    { "icon": "⚠️", "title": "注意点", "text": "内容" },
    { "icon": "💡", "title": "アドバイス", "text": "内容" },
    { "icon": "🎯", "title": "次のアクション", "text": "内容" }
  ],
  "outlook": "今後の見通し"
}
```

---

## データ構造（localStorage）

```javascript
// 月次データ
// キー: "folio_data"
[
  {
    month: "2024-06",         // YYYY-MM
    total: 3520000,           // 総資産（円）
    categories: {
      "株式": 1720000,
      "投資信託": 1010000,
      "現金・預金": 690000,
      "その他": 100000
    },
    note: "SBI証券",          // 任意メモ
    manual: true              // 手動入力フラグ
  }
]

// カテゴリ設定
// キー: "folio_cats"
[
  { name: "株式", color: "#c9a84c" },
  { name: "投資信託", color: "#4fa3e8" },
  { name: "現金・預金", color: "#2dd4a0" },
  { name: "その他", color: "#f5a623" }
]

// 目標設定
// キー: "folio_goal"
{ amount: 3000, date: "2035-03" }  // amount は万円単位

// APIキー
// キー: "folio_key"
"AIzaSy..."
```

---

## UIコンポーネント仕様

### ボトムナビ

5タブ固定（ホーム / 概要 / リスク / シミュ / レポート）。設定はトップバーの歯車アイコンから。アクティブタブにはゴールドのアンダーライン。

### モーダル

下からスライドアップ（`sheetUp` アニメーション）。背景タップで閉じる。

1. **月次詳細モーダル** — カラーバー + カテゴリ内訳リスト
2. **解析確認モーダル** — Gemini結果の確認・編集（月・総額・カテゴリ別）
3. **手動入力モーダル** — 新規追加・既存編集
4. **APIキーモーダル** — 入力・保存・削除
5. **カラーピッカーモーダル** — 12色スウォッチ

### トースト通知

画面下部に表示。`success`（緑）/ `error`（赤）/ `info`（暗）/ `loading`（スピナー）。

### 解析オーバーレイ

フルスクリーン。回転リング + ターミナル風ログ + プログレスバー。

---

## インタラクション仕様

- スパークライン：2ヶ月以上データがある時のみ表示
- チャートタップ：月次詳細モーダルを開く
- テーブル行タップ：月次詳細モーダルを開く
- テーブル「編集」：手動入力モーダルで上書き
- カテゴリ色丸タップ：カラーピッカーモーダルを開く
- 期間フィルター：3M / 6M / 1Y / ALL でチャートと集計を絞り込み
- 目標進捗バー：設定画面で入力した目標額に対する現在の達成率

---

## アクセシビリティ・モバイル対応

- `viewport-fit=cover` + `safe-area-inset-bottom` でiPhone対応
- `overscroll-behavior: none` でバウンス防止
- タップターゲット最低44px
- `-webkit-tap-highlight-color: transparent`
- フォントは `font-display: swap`

---

## 実装上の注意点

1. **APIキーはURLパラメータに含めない**（localStorageのみ）
2. **画像データはサーバーに送信しない**（base64でGemini APIに直接送信）
3. **Chart.jsは1つのcanvasに1インスタンス**（再描画前に `destroy()` 必須）
4. **複数ファイルアップロード**は `for...of` で順次処理（並列不可、レート制限対策）
5. **JSON解析**は `text.replace(/```json|```/g, '').trim()` でマークダウン除去してから `JSON.parse()`

---

## サンプルデータ（初期テスト用）

```javascript
const SAMPLE = [
  { month: "2024-01", total: 3200000, categories: { 株式: 1500000, 投資信託: 900000, "現金・預金": 700000, その他: 100000 } },
  { month: "2024-02", total: 3350000, categories: { 株式: 1620000, 投資信託: 950000, "現金・預金": 680000, その他: 100000 } },
  { month: "2024-03", total: 3180000, categories: { 株式: 1450000, 投資信託: 930000, "現金・預金": 700000, その他: 100000 } },
  { month: "2024-04", total: 3420000, categories: { 株式: 1680000, 投資信託: 980000, "現金・預金": 660000, その他: 100000 } },
  { month: "2024-05", total: 3600000, categories: { 株式: 1800000, 投資信託: 1020000, "現金・預金": 680000, その他: 100000 } },
  { month: "2024-06", total: 3520000, categories: { 株式: 1720000, 投資信託: 1010000, "現金・預金": 690000, その他: 100000 } },
];
```

---

## 開発の進め方（推奨手順）

```
1. index.html のシェル（ナビ・モーダル・オーバーレイ）を作成
2. css/ を3ファイルに分割実装
3. js/data.js でlocalStorage CRUD を実装
4. js/api.js で Gemini呼び出し関数を実装
5. js/charts.js で Chart.js ラッパーを実装
6. js/dashboard.js でホーム・ダッシュボード描画を実装
7. js/risk.js / simulation.js を実装
8. js/settings.js を実装
9. js/main.js で全体を結合・初期化
10. GitHub Pages にデプロイ（gh-pages ブランチ or docs/ フォルダ）
```

---

## 参考：既存の動作するHTMLファイル

別添の `FOLIO.html`（約95KB）が現在動作している実装です。これをリファクタリング・改善する形で進めてください。デザイントークンと主要なロジックはそのまま流用可能です。
