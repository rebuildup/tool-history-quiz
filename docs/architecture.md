# Architecture

このドキュメントは `tool-history-quiz` の現状 architecture を記述します。決定の履歴と理由は ADR (`docs/adr/`) を参照してください。

## 目的

親 monorepo (`my-web-2025`) に embed される standalone history-quiz client tool。

## dual-life pattern

この tool は 2 つの lifecycle を持つ:

1. **standalone dev shell** — 本 repo 内で `bun run dev` / `bun run build` / `bun run preview` を実行する。`index.html` + `src/main.tsx` が entry。
2. **library embed** — 親 monoreポ (`my-web-2025`) の Next.js 16 app router から `import HistoryQuizApp from "tool-history-quiz"` で利用される。`src/index.ts` が entry。

3. **standalone static artifact** — `bun run build` の成果物 (`dist/`) を host (my-web-2026) が `/tools/history-quiz/app/` 配下に静的配信し、sandbox iframe に読み込む。`base: "./"` により配下配信でも asset 参照が相対で解決する (ADR 0003 参照)。

親 embed 依然是 production artifact であり、`bun run build` の成果物は上記 3 の用途も兼ねる。

## レイヤ構成 (現状)

```
tool-history-quiz-work/
├── index.html                       # Vite entry (standalone shell)
├── vite.config.ts                   # Vite + React plugin
├── tsconfig.json                    # TypeScript strict
├── biome.json                       # formatter + linter
├── package.json                     # deps + scripts
├── public/
│   └── history-quiz.html            # クイズ本文 (package 所有の静的アセット)
├── src/
│   ├── main.tsx                     # standalone mount point
│   ├── HistoryQuizApp.tsx           # top-level client component
│   ├── index.ts                     # public entry (re-export HistoryQuizApp)
│   └── vite-env.d.ts                # Vite client types
├── docs/
│   ├── architecture.md              # 本ファイル
│   └── adr/
│       ├── 0001-tool-stack.md       # toolchain 採否の根拠
│       ├── 0002-pr-driven-workflow.md # PR / release ワークフロー
│       └── 0003-standalone-static-build.md # 静的配信 artifact の決定
├── .github/
│   └── workflows/
│       └── ci.yml                   # quality gate
├── AGENTS.md                        # agent 横断 canonical contract
├── CLAUDE.md                        # Claude Code 用 thin adapter
├── .env.example                     # environment variable schema
├── .gitignore                       # deps / build / .tmp / .reference / env
└── README.md
```

## 責務分離

- `index.html`: standalone shell 専用。親 embed では使用されない。
- `src/main.tsx`: standalone mount point。`createRoot` + `<StrictMode>` で `HistoryQuizApp` を `#root` に render。
- `src/HistoryQuizApp.tsx`: top-level client component。default export。
- `src/index.ts`: public entry。default export のみ re-export。
- `public/history-quiz.html`: クイズ本文 (style / script / 空欄) を含む静的アセット。`bun run build` で `dist/history-quiz.html` にそのままコピーされる。

## クイズ本文の load 経路

`HistoryQuizApp` は実行時にクイズ本文を取得する。候補 URL は順に試行する:

1. `./history-quiz.html` — package 所有アセット (standalone static artifact 用)。host 配下配信でも相対解決する。
2. `/history-quiz.html` — 親 monorepo embed 用 fallback。親 monorepo は host root に同名の静的ファイルを配信する。

先頭候補が 404 の場合は次候補へ fallback する。どちらの経路でも DOM の注入 (style / script / body) と input listener の設定は同一の処理で行う。

## データフロー

1. `HistoryQuizApp` が `useEffect` 内でクイズ本文を取得する (上記 load 経路)。
2. 取得した HTML を `DOMParser` で解析し、`<style>` を `document.head` に、`<body>` を container に、`<script>` を `document.body` に注入する。
3. `input.blank` に対して wrapper / tooltip を生成し、keydown (Enter での focus 移動) と input listener を登録する。
4. 採点・答え表示・リセットは注入された inline script (`checkSection` / `showSectionAns` / `resetSection`) が担う。

## 外部依存

- React 19.x (required)
- React DOM 19.x (required)
- Vite 6.x, `@vitejs/plugin-react` 4.x (devDependencies; standalone shell のみ)
- TypeScript 5.6.x (devDependency)
- Biome 1.9.x (devDependency)

## embed 契約

- default export = `HistoryQuizApp` (client component)。
- 親 monorepo は standalone shell (`index.html` / `src/main.tsx`) を import しない。`src/index.ts` のみ参照する。
- `package.json` の `main` / `types` / `exports` は `src/index.ts` を指し、library としての解決経路を公開する。
- 親 monorepo embed はクイズ本文の host root (`/history-quiz.html`) を fallback として引き続き利用できる。

## テスト方針

- 初期段階: test runner 未導入 (ADR 0001 参照)。
- 再評価条件: クイズ問題データ / 出題ロジック / score 計算など pure logic 追加時に Vitest を導入する。

## 関連ドキュメント

- `docs/adr/0001-tool-stack.md` — toolchain 採否の根拠
- `AGENTS.md` — agent 横断 canonical contract