# rebuildup/tool-history-quiz

Standalone history-quiz tool. See `my-web-2025` spec for embed instructions.

## Embed

親 monorepo `my-web-2025` の Next.js 16 app router から `import HistoryQuizApp from "tool-history-quiz"` で利用する。詳細は親 monorepo の仕様書を参照。

## Development

必要環境: Bun 1.4.x, Node.js 22+ (Vite 6 用)。

```sh
bun install
bun run dev         # standalone shell (Vite dev server)
bun run build       # standalone shell build
bun run lint        # Biome check
bun run typecheck   # TypeScript
bun run preview     # standalone shell preview
```

sibling monorepo (`my-web-2025`) が存在しない環境でも `bun install` が通る (host へ依存する `file:` 参照はない)。

## Standalone static artifact

`bun run build` の成果物 (`dist/`) は host (`my-web-2026`) が `/tools/history-quiz/app/` 配下に静的配信し、sandbox iframe に読み込むためのものである。

- `vite.config.ts` の `base: "./"` により `dist/index.html` の asset 参照は相対 (`./assets/...`) になる。
- クイズ本文は `public/history-quiz.html` が正本であり、`dist/history-quiz.html` としてそのまま出力される。
- 最終段落の host 配信サーバは `Access-Control-Allow-Origin: *` を返すこと (sandbox iframe の opaque origin 対策)。

詳細は `docs/adr/0003-standalone-static-build.md` を参照。

## Validation

実装タスク完了前に CI と同じ sequence を local で実行する:

```sh
bun install
bun run lint
bun run typecheck
bun run build
```

CI workflow: `.github/workflows/ci.yml`。

## Documentation

- `AGENTS.md` — agent 横断 canonical contract
- `docs/architecture.md` — 現状 architecture
- `docs/adr/0001-tool-stack.md` — toolchain 採否の根拠