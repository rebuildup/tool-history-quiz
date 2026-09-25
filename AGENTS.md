# AGENTS.md — `tool-history-quiz`

このファイルは agent 横断の canonical project contract です。ほぼすべてのタスクに作用する不変条件だけを記載します。詳細な workflow は `docs/architecture.md` / `docs/adr/` を参照してください。

## Project identity

- 目的: 親 monorepo (`my-web-2025`) に embed される standalone history-quiz client tool。
- 公開境界: `src/index.ts` (default export = `HistoryQuizApp`)。
- 想定 consumer: Next.js 16 app router の client component から `import HistoryQuizApp from "tool-history-quiz"` で利用される。
- embed 方法の詳細は親 monorepo の `my-web-2025` 仕様書を参照 (この repo 内では維持しない)。

## Source code policy

- language: 英語のみ (filename / identifier / comment / code docs / config identifier)。
- internal documentation: 日本語 (architecture / design / ADR / AGENTS.md)。
- Git / GitHub message: 英語 (`<prefix>: <title>` 形式)。

## Toolchain (canonical)

- package manager: Bun (`bun` / `bun run` / `bunx`)。
- build: Vite 6 (`vite` / `vite build` / `vite preview`)。
- 主要 dependency: React 19.x, React DOM 19.x。
- 共有 UI primitives: `@rebuildup/my-web-tools-ui` (parent monorepo `external/ui/` を file link)。
- formatter + linter: Biome (`bunx @biomejs/biome`)。
- type-check: TypeScript (`bunx tsc --noEmit` または `tsc -b`)。

詳細と選択理由は `docs/adr/0001-tool-stack.md` を参照。

## Branch / PR workflow

`main` は released/integrated state、`release-x-y-z` は current release integration line とする。

- durable implementation work は GitHub Issue。ticket branch は Issue number only を標準とする。
- independent ticket PR は current `release-x-y-z` を target にする。
- release branch に meaningful difference が入ったら Draft release PR (`release-x-y-z -> main`) を維持する。
- `main` への normal integration は current release branch からの release PR だけ。
- repository landing method は **merge commit only**。squash / rebase merge は使用しない。
- approval count / CODEOWNERS review は merge requirement にしない。CODEOWNERS は ownership routing metadata として保持する。
- required CI と全 review conversation resolve を merge gate とする。
- 直接 push / force push / main deletion は禁止。
- parallel work は ownership / mutable state を分離し、必要なら worktree / sandbox を使う。worktree 自体を runtime isolation proof にはしない。
- branch protection の詳細は `docs/branch-protection.md`。適用手順は `bun run scripts:setup-branch-protection`。

## Validation entry point

PR を open する前に以下を順に実行し、error / actionable warning を 0 にする:

```
bun install
bun run lint
bun run typecheck
bun run build
```

CI workflow は `.github/workflows/ci.yml`。local と CI で同じ `bun run` script を呼び出す。ticket PR / release PR の双方で起動し、superseded な commit の run は自動 cancel される。

## Design / approval gate

- 親 monorepo の embed 仕様に影響する変更 (公開 export shape、props shape、storage key 等) は、`docs/architecture.md` を更新した上で合意を得てから実装する。
- 公開 API 互換性を壊す変更は初期開発段階のため許容される (互換性 shim は残さない)。

## Mode / permission / trust

- 制限された mode / permission / authentication gate は正当な user gate として扱う。bypass を探さない。
- secret / credential は repository に保存しない。`.env.example` の schema のみ commit する。

## Skill discovery

- 詳細な workflow は `docs/architecture.md` を起点に参照する。
- root 側の Skill (`project-agent-init`) は再初期化専用。通常タスクでは参照しない。
- このリポジトリ固有の Agent Skill は現状必要ない。発火条件が明確で context cost を下げる workflow が必要になった時点で追加する。

## 参照順序

問題対応時は次の順で evidence を集める:

1. この `AGENTS.md`
2. `docs/architecture.md` / `docs/adr/*.md`
3. 親 monorepo (`my-web-2025`) の仕様 (embed 契約の確認)
4. installed dependency の型 / schema
5. official documentation (React 19 / Vite 6 / Bun / Biome)

## Constitution / operating profile

- 最上位 contract: [`constitution/CONSTITUTION.md`](constitution/CONSTITUTION.md)
- current Operating Model: [`organization/profiles/release-driven-solo.md`](organization/profiles/release-driven-solo.md)
- host embed / Bun / build validation に関する project-specific decisions は、Constitution と両立する限り保持する。
- project-init operational Skills は current upstream を `bunx skills` + `skills-lock.json` で project-local に継続更新する。
