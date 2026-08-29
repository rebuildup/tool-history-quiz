# Branch Protection

`main` は保護されている。すべての変更は Pull request 経由で取り込む。

## 必要な gate

- `quality-gate` (`.github/workflows/ci.yml` の job) が success であること。
  - 含まれる step: lint (`bun run lint`) → typecheck (`bun run typecheck`) → build (`bun run build`)。
- CODEOWNERS に登録された reviewer から 1 名以上の approval があること。
  - `.github/CODEOWNERS` を参照。
- 直近の push 以降の review conversation がすべて resolve されていること。

## 禁止操作

- 直接 push to `main` (admin も不可、`enforce_admins: true`)。
- force push。
- `main` の削除。
- merge commit (linear history 強制)。

## 適用方法

1. `gh auth login` で GitHub CLI を認証する (`repo` scope が必要)。
2. admin 権限を持つアカウントで `bun run scripts:setup-branch-protection` (または `bash scripts/setup-branch-protection.sh`) を実行する。
3. 結果を確認する: `gh api repos/<owner>/<repo>/branches/main/protection`。

初回 setup 後、再実行は冪等 (同じ payload で上書き)。

## 必要な required status check

GitHub は **job name** を required check として識別する。本 repo の `.github/workflows/ci.yml` の job は `quality-gate` のみ。step 名ではなく job 名を使う点に注意。

CI を変更して job を rename / split する場合、`scripts/setup-branch-protection.sh` の `contexts` も同期して更新する。