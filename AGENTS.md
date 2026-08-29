# AGENTS.md — `@rebuildup/tool-history-quiz`

このファイルは agent 横断の canonical project contract です。ほぼすべてのタスクに作用する不変条件だけを記載します。詳細 workflow は `docs/branch-protection.md` / `docs/adr/` を参照してください。

## Project identity

- 目的: 親 monorepo (`my-web-2025`) に embed される standalone Next.js 16 client component。history quiz HTML を inject し、`.blank` input に答え tooltip とキーボード移動を付与する。
- 公開境界: `src/index.ts` (default export = `HistoryQuizApp`)。
- 想定 consumer: Next.js 16 app router の client component から `import HistoryQuizApp from "@rebuildup/tool-history-quiz"` で利用される。
- embed 方法の詳細は親 monorepo の `my-web-2025` 仕様書を参照 (この repo 内では維持しない)。

## Source code policy

- language: 英語のみ (filename / identifier / comment / code docs / config identifier)。
- internal documentation: 日本語 (architecture / design / ADR / AGENTS.md)。
- Git / GitHub message: 英語 (`<prefix>: <title>` 形式)。

## Toolchain (canonical)

- package manager: Bun (`bun` / `bun run` / `bunx`)。
- 主要 dependency: React 19.x, React DOM 19.x。
- peer dependency: Next.js 16.x (親 monoreポ embed 時に親が供給)。
- formatter + linter: Biome (`bunx @biomejs/biome`)。
- type-check: TypeScript (`bunx tsc --noEmit`)。
- CI: GitHub Actions `.github/workflows/ci.yml` (PR 駆動)。

## Branch / PR workflow

`main` は branch protection で保護されている。すべての変更は Pull request 経由で取り込む。

- 作業は必ず feature branch で行う (例: `chore/<short-desc>`, `feat/<short-desc>`, `fix/<short-desc>`)。
- 直接 push to `main` は禁止。`enforce_admins: true` のため admin も不可。
- force push / branch deletion / merge commit も禁止 (linear history 強制)。
- PR は CODEOWNERS review + `quality-gate` success + 全 conversation resolve が揃って merge 可。
- 同一ファイルへの並行編集は禁止。所有権単位で分割するか phase を直列化する。
- subagent / team mechanism が worktree を必須とする場合は使用しない。worktree 不要の subagent mechanism を選択する。
- branch protection の詳細は `docs/branch-protection.md` を参照。適用手順は `bun run scripts:setup-branch-protection` (要 `gh` 認証 + admin 権限)。

## Validation entry point

PR を open する前に以下を順に実行し、error / actionable warning を 0 にする:

```
bun install
bun run lint
bun run typecheck
bun run build
```

CI workflow は `.github/workflows/ci.yml`。local と CI で同じ `bun run` script を呼び出す。CI は PR ごとに起動し、superseded な commit の run は自動 cancel される。

## Design / approval gate

- 親 monorepo の embed 仕様に影響する変更 (公開 export shape、props shape、storage key 等) は、`docs/architecture.md` を更新した上で合意を得てから実装する。
- 公開 API 互換性を壊す変更は初期開発段階のため許容される (互換性 shim は残さない)。

## Mode / permission / trust

- 制限された mode / permission / authentication gate は正当な user gate として扱う。bypass を探さない。
- secret / credential は repository に保存しない。`.env.example` の schema のみ commit する。

## Skill discovery

- 詳細な workflow は `docs/branch-protection.md` を起点に参照する。
- root 側の Skill (`project-agent-init`) は再初期化専用。通常タスクでは参照しない。
- このリポジトリ固有の Agent Skill は現状必要ない。発火条件が明確で context cost を下げる workflow が必要になった時点で追加する。

## 参照順序

問題対応時は次の順で evidence を集める:

1. この `AGENTS.md`
2. `docs/branch-protection.md` / `docs/adr/*.md`
3. 親 monorepo (`my-web-2025`) の仕様 (embed 契約の確認)
4. installed dependency の型 / schema
5. official documentation (React 19 / Next.js 16 / Bun / Biome)