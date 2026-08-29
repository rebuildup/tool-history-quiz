# Architecture

このドキュメントは `tool-history-quiz` の現状 architecture を記述します。決定の履歴と理由は ADR (`docs/adr/`) を参照してください。

## 目的

親 monorepo (`my-web-2025`) に embed される standalone history-quiz client tool。

## dual-life pattern

この tool は 2 つの lifecycle を持つ:

1. **standalone dev shell** — 本 repo 内で `bun run dev` / `bun run build` / `bun run preview` を実行する。`index.html` + `src/main.tsx` が entry。
2. **library embed** — 親 monoreポ (`my-web-2025`) の Next.js 16 app router から `import HistoryQuizApp from "tool-history-quiz"` で利用される。`src/index.ts` が entry。

production artifact は親 embed 側であり、`bun run build` は dev / preview 用途の standalone shell を検証するだけである点に注意。

## レイヤ構成 (現状)

```
tool-history-quiz-work/
├── index.html                       # Vite entry (standalone shell)
├── vite.config.ts                   # Vite + React plugin
├── tsconfig.json                    # TypeScript strict
├── biome.json                       # formatter + linter
├── package.json                     # deps + scripts
├── src/
│   ├── main.tsx                     # standalone mount point
│   ├── HistoryQuizApp.tsx           # top-level client component (placeholder)
│   ├── index.ts                     # public entry (re-export HistoryQuizApp)
│   └── vite-env.d.ts                # Vite client types
├── docs/
│   ├── architecture.md              # 本ファイル
│   └── adr/
│       └── 0001-tool-stack.md       # toolchain 採否の根拠
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

現状 source は placeholder であり、機能実装 (`src/lib/**`, `src/components/**`, `src/data/**` 等) は ADR 0001 の deferred 項目に従い、機能要件確定後に設計する。

## データフロー

現状未実装 (placeholder のみ)。

## 外部依存

- React 19.x (required)
- React DOM 19.x (required)
- `@rebuildup/my-web-tools-ui` (file link: `../my-web-2025/external/ui`)
- Vite 6.x, `@vitejs/plugin-react` 4.x (devDependencies; standalone shell のみ)
- TypeScript 5.6.x (devDependency)
- Biome 1.9.x (devDependency)

## embed 契約

- default export = `HistoryQuizApp` (client component)。
- 親 monorepo は standalone shell (`index.html` / `src/main.tsx`) を import しない。`src/index.ts` のみ参照する。

## テスト方針

- 初期段階: test runner 未導入 (ADR 0001 参照)。
- 再評価条件: クイズ問題データ / 出題ロジック / score 計算など pure logic 追加時に Vitest を導入する。

## 関連ドキュメント

- `docs/adr/0001-tool-stack.md` — toolchain 採否の根拠
- `AGENTS.md` — agent 横断 canonical contract