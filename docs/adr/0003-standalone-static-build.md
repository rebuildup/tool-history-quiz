# ADR 0003: standalone static artifact for iframe embedding

## Status

Accepted

## 調査日

- 2026-11-02

## Context

`my-web-2026` は各 tool を `/tools/<slug>/app/` 配下に静的配信し、sandbox iframe に読み込む。host manifest 上の `tool-history-quiz` は `delivery.kind = host_disabled` であり、理由は「standalone Vite build path が無い」だった。

同時に、release line (`release-0-1-0`) と `main` の間に内容差異があった。

- `main` には `src/HistoryQuizApp.tsx` の実装 (クイズ本文を runtime fetch して DOM に注入する client component) がある。
- `release-0-1-0` は `main` の実装 commit (`7232813`, `41fa54b`) を巻き込んでいないため、`src/HistoryQuizApp.tsx` が placeholder のままだった。
- release line の `package.json` には `main` / `types` / `exports` がなく、library としての公開境界が `main` 側と乖離していた。
- release line の `package.json` は `@rebuildup/my-web-tools-ui` を `file:../my-web-2025/external/ui` 参照しており、sibling monorepo が無い環境 (GitHub Actions、fresh clone、host 側 build) では `bun install` 自体が失敗する。実測: `error: Could not find folder "file:../my-web-2025/external/ui"`。また `src/**` から当該 package を import している箇所は 0 件だった。

さらに host 側の制約として、sandbox iframe は opaque origin になりうるため、配信サーバは `Access-Control-Allow-Origin: *` を返す必要がある (module script の CORS 要求)。host root を参照する絶対パスは配下配信で解決しない。

## Decision

### 1. release line を integration line として ticket PR を作る

ADR 0002 に従い、ticket branch は Issue number only、独立 ticket PR は current release branch (`release-0-1-0`) を target にする。`main` への integration は release PR のみ。

### 2. 実装を release line へ取り戻す

`main` の実装 commit (`7232813` = quiz page logic, `41fa54b` = strict index fix) を release line へ cherry-pick した。内容を一から書き直さず、main 側の挙動をそのまま維持する。

### 3. 静的配信可能な artifact にする

- `vite.config.ts` に `base: \"./\"` を設定する。host は成果物を `/tools/history-quiz/app/` 配下で配信するため、既定の `/` では `dist/index.html` が host root を参照し 404 になる。
- クイズ本文を package 所有のアセットとして `public/history-quiz.html` に置く。Vite は `public/` を `dist/` 直下へそのままコピーする ( hashed されない)。
- `HistoryQuizApp` の load 候補を `[\"./history-quiz.html\", \"/history-quiz.html\"]` とし、先頭から順に試行する。1 番目は package 所有アセット (standalone static artifact 用)、2 番目は親 monorepo embed 用の host root fallback。

### 4. 非可搬な file 依存を撤去する

`@rebuildup/my-web-tools-ui` (`file:../my-web-2025/external/ui`) を削除する。import 箇所が 0 件であり、存在しないと `bun install` が失敗するため、fresh clone / CI / host build を阻害する。shared UI primitive が必要になった時点で、publish 済み package として再導入する。

### 5. library 公開境界を復元する

`package.json` に `main` / `types` / `exports` (`./src/index.ts`) を復元する。`main` 側の公開契約と一致させるため、公開 shape の変更はしない。

### 6. lint の状態を CI gate と同期する

- `src/HistoryQuizApp.tsx` の `forEach` を `for...of` に置換する (Biome `lint/complexity/noForEach`)。挙動は同一で、`return` による早期 skip は `continue` に置換している。
- `biome.json` の `files.include` から `*.json` を外し、整形対象を `package.json` / `tsconfig.json` / `biome.json` に限定する。`skills-lock.json` は `bun run skills-update` が生成する managed file であり、Biome 1.9 の tab 整形と対象外にする。

## Consequences

- `bun install` → `bun run lint` → `bun run typecheck` → `bun run build` が、sibling monorepo のない環境でも通る。
- `dist/` は `index.html` / `assets/*.js` / `history-quiz.html` の 3 ファイルからなり、host の配下配信で相対 asset 参照が解決する。
- クイズ本文の正本は今後この repo の `public/history-quiz.html`。親 monorepo 側の同名ファイルとの二重管理が発生するため、内容変更時は両方を更新する必要がある (host 側 PR の責務)。
- opaque origin iframe で本文を取得する場合も host 配信側の CORS ヘッダが必要である (module script と同じ条件)。追加の host 制約ではない。
- `main` には実装と `main` / `types` / `exports` がないため、release line からの release PR (`release-0-1-0` → `main`) が統合されるまで `main` は standalone build 経路を持たない。

## Alternatives considered

- **host 配信に本文を置くだけ**: host 側 PR が必要で、tool 単体では standalone として成立しない。却下。
- **本文を `?raw` import でバンドル-inline する**: fetch が不要になり CORS 非依存だが、親 monorepo 側の bundle に 90KB が inline され、embed 契約 (host root の本文を使う) が変わる。却下。
- **pnpm へ切り替える**: host manifest は `pnpm` を示すが、ADR 0001 が Bun を canonical package manager として確定しており、repo にも `bun.lock` がある。repo の実測を優先し Bun を維持する。host manifest 側の更新は host 側の責務。

## 再評価条件

- host manifest の build command が Bun 前提へ更新された場合、ADR 0001 を含めて package manager 決定を見直す。
- クイズ本文が host 側だけで管理される運用に戻った場合、load 候補順 (package 所有 → host fallback) を見直す。
- `shared UI primitive` を再導入する場合、publish 済み package として導入し `file:` 参照复活させない。
