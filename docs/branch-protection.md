# Branch Protection

`main` は released / integrated state として保護する。通常の実装変更は ticket PR で current `release-x-y-z` に入り、main への normal integration は release PR だけが行う。

## 必要な gate

- `quality-gate` が success であること。
- review conversation がすべて resolve されていること。
- approval count / CODEOWNERS approval は required gate にしない。
- release PR は current `release-x-y-z` から `main` へ向ける。

## Merge method

- merge commit only。
- squash merge / rebase merge は repository setting で無効化する。
- branch-local rebase は stacked branch maintenance 等の branch mechanics として別扱い。

## 禁止操作

- 直接 push to `main`。
- force push。
- `main` の削除。
- release branch 以外から `main` へ normal integration すること。

## 適用方法

1. `gh auth login` で GitHub CLI を認証する。
2. admin 権限を持つアカウントで `bun run scripts:setup-branch-protection` を実行する。
3. repository merge settings と branch protection を確認する。

このscriptは次を揃える:

- `allow_merge_commit=true`
- `allow_squash_merge=false`
- `allow_rebase_merge=false`
- required check: `quality-gate`
- required approving reviews: none
- required conversation resolution: true
- force push / deletion: blocked
- linear-history requirement: false

CODEOWNERS は ownership routing metadata として残すが、solo development の approval gate にはしない。
