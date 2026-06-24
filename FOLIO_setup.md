# FOLIO セットアップ手順

## 前提条件（インストール済み想定）

- Git / GitHub CLI
- Node.js 18+
- Claude Code v2.1+
- WSL/Ubuntu

---

## Step 1：GitHubリポジトリ作成

GitHubのWebUIで `TakamasaSaito/folio` を新規作成する。

- Public を推奨（GitHub Pages無料利用のため）
- README.mdは追加しない（後でpushするため）

---

## Step 2：ローカルにクローン

```bash
cd ~
git clone https://github.com/TakamasaSaito/folio.git
cd folio
```

---

## Step 3：FOLIO.htmlとプロンプトファイルを配置

Claudeから受け取った2ファイルをリポジトリに置く。

```bash
# WindowsのダウンロードフォルダからWSLにコピーする場合
cp /mnt/c/Users/あなたの名前/Downloads/FOLIO.html ~/folio/FOLIO.html
cp /mnt/c/Users/あなたの名前/Downloads/FOLIO_claudecode_prompt.md ~/folio/FOLIO_claudecode_prompt.md
```

---

## Step 4：CLAUDE.mdを作成

```bash
cat > ~/folio/CLAUDE.md << 'EOF'
# FOLIO — Claude Code 開発ガイド

## プロジェクト概要
証券・銀行アプリのスクリーンショットをGemini AIで解析し、
資産ポートフォリオを管理するWebアプリ。
サーバー不要・静的ファイルのみ・GitHub Pages でホスティング。

## 技術スタック
- HTML / CSS / Vanilla JavaScript（フレームワークなし）
- Chart.js 4.4.1（CDN読み込み）
- Gemini 1.5 Flash API（ブラウザから直接fetch）
- localStorage（データ永続化）

## ファイル構成
```
folio/
├── index.html
├── css/
│   ├── base.css
│   ├── components.css
│   └── screens.css
├── js/
│   ├── main.js
│   ├── api.js
│   ├── data.js
│   ├── charts.js
│   ├── dashboard.js
│   ├── risk.js
│   ├── simulation.js
│   └── settings.js
└── CLAUDE.md
```

## 重要な制約
- APIキーはlocalStorageのみに保存（URLパラメータ厳禁）
- 画像データはサーバーに送信しない（base64でGemini APIへ直接送信）
- Chart.jsは再描画前に必ず destroy() すること
- 複数画像は for...of で順次処理（並列不可・レート制限対策）
- JSON解析は必ず replace(/```json|```/g, '').trim() してから JSON.parse()

## デプロイ
GitHub Pages（mainブランチのルート）を使用。
pushするたびに自動デプロイされる。

## 参考実装
FOLIO.html が現在動いている1ファイル版の実装。
デザイントークンとロジックはそのまま流用すること。
EOF
```

---

## Step 5：ディレクトリ構成を作る

```bash
cd ~/folio
mkdir -p css js
touch index.html
touch css/base.css css/components.css css/screens.css
touch js/main.js js/api.js js/data.js js/charts.js
touch js/dashboard.js js/risk.js js/simulation.js js/settings.js
```

この時点のディレクトリ構成：

```
folio/
├── index.html
├── css/
│   ├── base.css
│   ├── components.css
│   └── screens.css
├── js/
│   ├── main.js
│   ├── api.js
│   ├── data.js
│   ├── charts.js
│   ├── dashboard.js
│   ├── risk.js
│   ├── simulation.js
│   └── settings.js
├── FOLIO.html               ← 参考実装（完成後は削除してOK）
├── FOLIO_claudecode_prompt.md  ← 要件書
└── CLAUDE.md
```

---

## Step 6：最初のコミット＆プッシュ

```bash
cd ~/folio
git add .
git commit -m "chore: initial project structure"
git push origin main
```

---

## Step 7：GitHub Pages を有効化

1. GitHubの `TakamasaSaito/folio` リポジトリを開く
2. 「Settings」→「Pages」
3. Source: `Deploy from a branch`
4. Branch: `main` / `/ (root)` を選択して「Save」

数分後に `https://takamasa saito.github.io/folio/` でアクセス可能になる。

---

## Step 8：Claude Code を起動して実装開始

```bash
cd ~/folio && git pull && claude --dangerously-skip-permissions
```

Claude Codeへの最初の指示：

```
CLAUDE.mdとFOLIO_claudecode_prompt.mdを読んで内容を把握してください。
FOLIO.htmlが現在動いている参考実装です。

まずStep 1として以下を実装してください：
1. index.html のシェル（ナビ・モーダル・オーバーレイのHTML構造のみ）
2. css/base.css（CSS変数・リセット・アニメーション）
3. css/components.css（カード・ボタン・フォーム等の共通部品）
4. css/screens.css（各画面固有のスタイル）

デザイントークンはFOLIO.htmlのCSS変数をそのまま使うこと。
実装後、index.htmlをブラウザで開いてレイアウトが崩れていないか確認してください。
```

---

## Step 9：以降の実装指示（段階的に渡す）

### JS実装フェーズ

```
次はJS実装です。以下の順で進めてください：

1. js/data.js — localStorage CRUD（allData・categories・goal・apiKey）
2. js/api.js — Gemini API呼び出し（callGeminiVision / callGeminiText）
3. js/charts.js — Chart.js ラッパー（折れ線・ドーナツ・棒・シム）
4. js/dashboard.js — ホーム・ダッシュボード描画
5. js/risk.js — リスクスコア計算と描画
6. js/simulation.js — シミュレーション計算と描画
7. js/settings.js — カテゴリ・APIキー・目標設定
8. js/main.js — 全体初期化・画面遷移・イベント登録

各ファイル実装後にブラウザで動作確認すること。
```

### 動作確認指示

```
サンプルデータをlocalStorageに投入してダッシュボードが正常に表示されるか確認してください。
Chart.jsのグラフが3種類すべて描画されることを確認してください。
```

---

## 開発中のよくある操作

### ローカル動作確認

```bash
# VS Code の Live Server 拡張を使う場合
code ~/folio
# → Live Server で index.html を開く

# または Python で簡易サーバー
cd ~/folio
python3 -m http.server 8080
# ブラウザで http://localhost:8080 を開く
```

### 変更をデプロイ

```bash
git add . && git commit -m "feat: ○○を実装" && git push
```

### Claude Codeを再起動（セッション上限時）

```bash
cd ~/folio && git pull && claude --dangerously-skip-permissions
```

再起動後の引き継ぎ指示：

```
CLAUDE.mdを読んでください。
前回のセッションでjs/dashboard.jsまで実装が完了しています。
次はjs/risk.jsのリスクスコア計算を実装してください。
```

---

## トラブルシューティング

| 症状 | 対処 |
|------|------|
| Claude Codeがセッション上限でエラー | 新規チャットで再起動・直前の作業内容を再度伝える |
| GitHub Pagesが404になる | Settings→PagesでブランチとフォルダがmainかつRootになっているか確認 |
| Chart.jsグラフが表示されない | `destroy()` を呼んでいるか確認・canvasのidがHTMLと一致しているか確認 |
| Gemini APIがCORSエラー | APIキーが正しいか確認・`https://` でアクセスしているか確認（localhostはOK） |
| JSON解析エラー | Geminiのレスポンスに```json が含まれていないか確認・replace処理を確認 |
| localStorageが空になる | ブラウザのプライベートモードになっていないか確認 |
