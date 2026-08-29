# ADR 0002: PR-driven workflow and main branch protection

## Status

Accepted

Supersedes: implicit local-main-only branch policy in the meta-prompt §21.
Superseded by: なし。

## 調査日

2026-08-29

## Context

`tool-history-quiz` は `main` への直接 push が可能で、review / CI 強制力のない状態だった。これは:

- agent tooling が誤って `main` に commit / push する事故が起きやすい。
- quality gate (`quality-gate` CI) を経ない変更が main に到達しうる。
- 複数人 / 複数 agent の collaboration で review / history の safety がない。

ユーザー指示 (2026-08-29): "mainをプロテクトするルールを作ってPR駆動"。

## 解決したい capability

1. `main` への直接 push / force push / branch deletion を禁止する。
2. すべての変更を PR 経由にし、CI 通過と CODEOWNERS review を必須化する。
3. linear history を強制し、merge commit の乱立を防ぐ。
4. 上記を project-local で再現可能にする (fresh clone から再適用できる)。

## Decision

### Branch protection on `main`

GitHub REST API 経由で以下を `main` に適用する:

| rule | value | reason |
|------|-------|--------|
| `required_status_checks.strict` | `true` | PR branch が main の最新 commit を含むことを要求 |
| `required_status_checks.contexts` | `["quality-gate"]` | CI job name と一致 (step name ではない) |
| `enforce_admins` | `true` | admin も同一規則を遵守 |
| `required_pull_request_reviews.dismiss_stale_reviews` | `true` | 新 push 後は review を無効化 |
| `required_pull_request_reviews.require_code_owner_reviews` | `true` | CODEOWNERS による review を必須 |
| `required_pull_request_reviews.required_approving_review_count` | `1` | 1 名以上の approval |
| `required_pull_request_reviews.require_last_push_approval` | `true` | 直近 push 後の再 approval を要求 |
| `restrictions` | `null` | PR open はサインイン user なら誰でも可 |
| `block_force_pushes` | `true` | force push 禁止 |
| `block_deletions` | `true` | branch 削除禁止 |
| `required_linear_history` | `true` | merge commit 禁止 (rebase or squash のみ) |
| `required_conversation_resolution` | `true` | 未 resolve conversation が残ったまま merge 不可 |
| `allow_fork_syncing` | `false` | fork からの sync PR を禁止 |
| `lock_branch` | `false` | branch は開いたまま |

### 適用方法

`scripts/setup-branch-protection.sh` を提供し、`gh api` で `PUT /repos/{owner}/{repo}/branches/main/protection` に上記 payload を送る。`bun run scripts:setup-branch-protection` で実行可能。

前提:
- `gh auth login` 済み (`repo` scope が必要)。
- 認証アカウントが repo admin。

注意: Git Bash for Windows 環境では `/repos/...` の leading slash が filesystem path として解釈される。スクリプトは `repos/...` (no leading slash) 形式を採用する。

### CODEOWNERS

`.github/CODEOWNERS` を追加し、`/*` を `@rebuildup` に紐付ける。CI / agent config (`/AGENTS.md`, `/CLAUDE.md`, `/docs/adr/`, `/.github/`) は明示的に `@rebuildup` を要求し、誤った bypass を防ぐ。

### PR template

`.github/PULL_REQUEST_TEMPLATE.md` を提供し、PR に Summary / Scope / Changes / Validation / Risks / Related のセクションを強制する。

### CI workflow

`.github/workflows/ci.yml` を PR-driven に調整:

- `on.pull_request.branches: [main]` のみ (push to main は branch protection で阻止される)。
- `concurrency` を追加し、PR の superseded commit の run を自動 cancel (main branch run は cancel しない)。
- job name は `quality-gate` (branch protection の required check と一致)。

### CI tooling (初期化時点で必要最低限)

agent 設定とは独立して CI を成立させるため、最低限の lint / typecheck / build tooling を追加:

- Biome 1.9.x (`biome.json`): formatter + linter
- TypeScript 5.6.x (`tsconfig.json`): strict type-check
- `package.json` scripts: `lint`, `typecheck`, `build`, `format`, `scripts:setup-branch-protection`

tool stack 全体の採否 (Vite, Knip, Vitest, etc.) は別 ADR で管理する想定だが、初期段階では placeholder source に対する先行導入は overkill なため deferred。

## Alternatives considered

- **直接 push のみ許可 (現状)**: agent / 人間ともに事故リスクが高く、CI 強制力がない。
- **`required_approving_review_count = 2`**: 個人開発 repo では friction が高すぎる。1 名で十分 (CODEOWNERS と `require_code_owner_reviews` で質を担保)。
- **`tag` push 経由の release**: 別 ADR で tag-triggered release を追加する想定だが、本 repo は初期段階で release workflow を実装していない (meta-prompt §35 に従い必要時に追加)。
- **`CODEOWNERS` の複数 owner**: 現状 1 名 (`@rebuildup`) のみ。チーム拡大時に追記する。
- **Vite / Vitest / Knip の同時導入**: 本 PR の scope を超える。tool stack 全体の ADR は deferred。

## Re-evaluation conditions

- GitHub Actions job を split する場合: `required_status_checks.contexts` を更新する (step name ではなく job name を使う点に注意)。
- team 拡大時: CODEOWNERS に複数 owner を追記。
- tag-triggered release を追加する場合: release workflow と required-check 連動を別 ADR で設計。
- GitHub Enterprise 等で policy が違う場合: `scripts/setup-branch-protection.sh` の payload を見直す。
- tool stack (Vite / Vitest / Knip 等) を追加する場合: 別 ADR を起こす。

## 初期化時点で実施した追加

- `.github/CODEOWNERS` を新規追加。
- `.github/PULL_REQUEST_TEMPLATE.md` を新規追加。
- `.github/workflows/ci.yml` を PR-driven で新規追加 (`concurrency` + `pull_request` のみ)。
- `scripts/setup-branch-protection.sh` を新規追加 (`gh api` 経由の idempotent な保護設定)。
- `docs/branch-protection.md` を新規追加 (運用ドキュメント)。
- `biome.json` / `tsconfig.json` を新規追加 (CI 成立に必要な最低限)。
- `package.json` に lint / typecheck / build / format / scripts:setup-branch-protection の script を追加。
- `AGENTS.md` を canonical contract として配置。
- `.gitignore` を `.tmp/` / `.reference/` / 実 env files / `bun.lockb` / `tsconfig.tsbuildinfo` 等を含む形に拡張。
- `.env.example` を schema として配置 (現状必須変数なし)。
- `README.md` に Development / Validation section を追加。

## 注意: この ADR の前提

本 repo は親 monorepo (`my-web-2025`) に embed される Next.js 16 client component library。`@rebuildup/tool-history-quiz` という scope 付きの名前で、`main` / `types` / `exports` を持ち、`next` を peerDependency とする。Vite 等の standalone shell は持たない。

これは 2026-08-29 時点の `origin/main` の実装 (`src/HistoryQuizApp.tsx` の "use client" + DOM 注入ロジック) と整合する。以前の scaffold は Vite ベースの standalone shell を想定していたが、実際の project shape は library pattern であるため、本 ADR の CI / tooling はそれに合わせる。