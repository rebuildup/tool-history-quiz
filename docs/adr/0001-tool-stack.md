# ADR 0001: tool stack and toolchain

## Status

Accepted

## 調査日

2026-08-29

## Context

`tool-history-quiz` は親 monorepo (`my-web-2025`) から extract される予定 (もしくは同等 pattern で新規 scaffold) の standalone Vite + React 19 client tool である。現状は:

- `package.json`: vite shell script 一式と `link:../../ui/src` (broken path) のみ。`@types/react` / `@types/react-dom` 未宣言。
- `tsconfig.json`: 未定義。
- `biome.json`: 未定義。
- vite.config / index.html / main entry: 未定義。
- test runner: 未導入。
- CI: 未定義。
- `.env.example`: 未存在。
- `.gitignore`: 最低限の rule のみ。
- source: `src/HistoryQuizApp.tsx` の placeholder のみ。
- agent 設定: `AGENTS.md` / `CLAUDE.md` 未存在。

## 解決したい capability

1. TypeScript の strict 型検査。
2. formatter + linter の single tool 化。
3. standalone dev (`vite`) / preview / build の完結。
4. 親 monorepo (`my-web-2025`) との embed 互換性維持。
5. CI での quality gate。
6. project-local で完結する再現性 (fresh clone で `bun install && bun run lint && bun run typecheck && bun run build` が通る)。

## Decision

### Package manager: Bun

- 選択理由: 親 monorepo および sibling tool (`tool-color-palette`, `tool-fillgen` 等) との lockfile 統一、`bunx` 経由の CLI 統一、install 速度。
- 不採用: npm / pnpm / Yarn — 既存 lockfile との二重管理を避けるため導入しない。

### Build / dev / preview: Vite 6 + `@vitejs/plugin-react` 4

- 選択理由: scaffold で既に `vite` / `@vitejs/plugin-react` / `dev` / `build` / `preview` script が宣言されている。React 19 + TS 5.6 と official 互換。`vite.config.ts` を project-local に置くことで standalone dev shell として完結し、production は親 monorepo が `src/index.ts` を直接 import する dual-life pattern を取る。
- `vite.config.ts` は standalone shell 専用。親 embed には関与しない。

### Formatter + linter: Biome 1.9.x

- 選択理由: scaffold で既に `@biomejs/biome: ^1.9.0` が宣言されている。formatter / linter の single binary / single config。ESLint + Prettier の二重設定より高速で rule 衝突がない。
- 不採用: ESLint + Prettier — rule 衝突と config 二重化コストが高い。Biome 2.x への major bump は 1.9 系で動作している sibling scaffold 群との整合を優先するため **deferred**。
- 1.9.4 の `$schema` を明示し、Biome 1.9 系 latest を使う。

### Type-check: TypeScript 5.6.x

- 選択理由: scaffold で既に `typescript: ~5.6.2` が宣言されている。React 19 / Vite 6 と official 互換。
- strict + `noUncheckedIndexedAccess` を有効化し、未定義アクセスを build 時に検出する。
- 不採用: TypeScript 7.x — 1.9 Biome と組み合わせる場合に ESLint-style 解析差分が出る可能性があり、scaffold の pinned version に従う。

### 共有 UI primitives: `@rebuildup/my-web-tools-ui` (link)

- 解決したい課題: 親 monorepo から独立した dev 環境でも shared UI primitives を使えること。
- 選択理由: 親 monorepo `external/ui/` を `file:` 経由で参照する。standalone dev では link 先を解決できる前提を置く。
- **repair**: scaffold の `link:../../ui/src` は broken path であり Bun 1.4 で `link:` syntax が filesystem path として解決されない。`file:../my-web-2025/external/ui` に修正した (parent monorepo が sibling である前提)。同 scaffold pattern を持つ `tool-ae-expression-work` / `tool-pi-game-work` / `tool-pomodoro-work` にも同 repair が必要 (本 repo のスコープ外)。

### Unit test / coverage: 初期導入せず

- 選択理由: 現状 source は `HistoryQuizApp.tsx` の placeholder のみであり、testable な domain logic が存在しない。Vitest / `@vitest/coverage-v8` / jsdom を導入しても測定対象がないため **deferred**。
- 再評価条件: クイズ問題データ / 出題ロジック / score 計算などの pure logic が追加された時点で `vitest` + `vitest.config.ts` を導入する。

### Dependency / static analysis: Knip 初期導入せず

- 選択理由: placeholder source に対する Knip 検出は無意味。実 source が追加された時点で sibling `tool-color-palette` と同じ Knip 6.x を `knip.json` で導入する。
- 再評価条件: `src/lib/**` 相当の pure logic 追加時。

### CI: GitHub Actions

- 選択理由: 親 monorepo も GitHub 上にあり、Secrets / workflow 設定を共通化できる。`oven-sh/setup-bun@v2` で Bun を provision。
- 実行内容: `bun install --frozen-lockfile` → `bun run lint` → `bun run typecheck` → `bun run build`。`bun run build` は standalone shell build のみ検証する (parent embed 検証は親 monorepo CI の責務)。
- coverage / Knip は source が実装されるまで未導入。

### Container / IaC

- 該当なし。本 tool は library であり、container / IaC を必要としない。

### Agent tooling

- `AGENTS.md` (canonical dispatcher) + `CLAUDE.md` (thin adapter for Claude Code) を `docs/architecture.md` / `docs/adr/` と組み合わせて配置。
- Agent Skill (`docs/agents/*.md`) は **未導入**。発火条件が明確で context cost を下げる workflow が将来必要になった時点で追加する。sibling `tool-color-palette` も Skill を持たない方針と整合。

## Alternatives considered

- **Biome 2.x**: major 差分による lint rule 差分を嫌い、scaffold pinned version に従う。
- **Vite 7 / React 19.2 / TS 7.x**: scaffold の version pin と互換性確認の負担が大きいため採用しない。
- **Vitest + jsdom**: placeholder に対する先行導入は overkill。deferred。
- **Playwright E2E**: standalone tool のため host (親 monorepo) で実施するのが自然。本 repo には導入しない。
- **Containerfile**: container は不要。

## Re-evaluation conditions

- React 20 への移行時: tsconfig の `lib` と `jsx` を見直す。
- Vite 7 への移行時: plugin 互換性を確認し、`vite.config.ts` を更新。
- `src/lib/**` の pure logic 追加時: Vitest + Knip を導入し、coverage threshold を global 80% で enforce する。
- 親 monorepo の embed 仕様変更時: AGENTS.md と `docs/architecture.md` を更新。

## 初期化時点で実施した追加 repair

- `package.json` の `link:../../ui/src` を `file:../my-web-2025/external/ui` に修正 (Bun 1.4 の `link:` syntax は filesystem path として解決されないため `file:` に変更。path は `tool-history-quiz-work/` から親 monorepo `external/ui/` までの相対: `../my-web-2025/external/ui`)。
- `@types/react` ^19.2.18 / `@types/react-dom` ^19.2.5 を devDependencies に追加 (`tsc -b` が React 型を解決するため)。
- `tsconfig.json` / `biome.json` / `vite.config.ts` / `index.html` / `src/main.tsx` / `src/vite-env.d.ts` を追加 (scaffold incomplete 部分を補完)。
- Biome 1.9 用 config: `assists` ブロックは 1.9 で未サポートのため外し、`files.include` / `linter.rules` のみ使用。
- `AGENTS.md` / `CLAUDE.md` を canonical contract として配置。
- `.gitignore` に `.tmp/` / `.reference/` / 実 env files / `bun.lockb` / `tsconfig.tsbuildinfo` / `dist/` を追加。
- `.env.example` を schema として配置 (現状必須変数なし)。
- `.github/workflows/ci.yml` を追加 (lint / typecheck / build)。
- `docs/architecture.md` を追加。

## 検証結果 (initialization 時点)

- `bun install` — success (`bun.lock` 生成、`@rebuildup/my-web-tools-ui` 解決確認)
- `bun run lint` — Biome check 8 files, 0 errors
- `bun run typecheck` — `tsc -b` success
- `bun run build` — Vite build success (28 modules, dist 生成)