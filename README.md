# rebuildup/tool-history-quiz

Standalone history-quiz tool. See `my-web-2025` spec for embed instructions.

## Embed

親 monorepo `my-web-2025` の Next.js 16 app router から `import HistoryQuizApp from "@rebuildup/tool-history-quiz"` で利用する。詳細は親 monorepo の仕様書を参照。

## Development

必要環境: Bun 1.4.x, Node.js 22+。

```sh
bun install
bun run lint         # Biome check
bun run typecheck    # TypeScript
bun run build        # TypeScript (no emit; library pattern)
bun run format       # Biome format --write
```

## Validation

PR を open する前に CI と同じ sequence を local で実行する:

```sh
bun install
bun run lint
bun run typecheck
bun run build
```

CI workflow: `.github/workflows/ci.yml`。

## Branch protection

`main` は branch protection で保護されている。直接 push / force push / merge commit は禁止。すべての変更は PR 経由で取り込む。詳細: `docs/branch-protection.md`。

## Documentation

- `AGENTS.md` — agent 横断 canonical contract
- `docs/branch-protection.md` — main 保護ルール
- `docs/adr/0002-pr-driven-workflow.md` — PR-driven workflow 採否の根拠