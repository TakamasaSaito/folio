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
folio/
├── index.html
├── css/
│   ├── base.css
│   ├── components.css
│   └── screens.css
├── js/
│   ├── main.js, api.js, data.js, charts.js
│   ├── dashboard.js, risk.js, simulation.js, settings.js
└── CLAUDE.md

## 重要な制約
- APIキーはlocalStorageのみ（URLパラメータ厳禁）
- 画像はサーバーに送らない（base64でGemini APIへ直接送信）
- Chart.jsは再描画前に必ず destroy() すること
- 複数画像は for...of で順次処理（並列不可）
- JSON解析は replace(/```json|```/g,'').trim() してから JSON.parse()

## デプロイ
GitHub Pages（mainブランチのルート）。pushで自動デプロイ。

## 参考実装
FOLIO.html が現在動いている1ファイル版。デザイントークンとロジックはそのまま流用すること。
