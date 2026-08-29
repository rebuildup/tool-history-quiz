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

`@rebuildup/my-web-tools-ui` は `file:../my-web-2025/external/ui` で参照する。親 monorepo が sibling として存在しない環境では `bun install` が失敗するため、その場合は `package.json` の path を環境に合わせて修正する。

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