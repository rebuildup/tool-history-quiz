#!/usr/bin/env bash
# Apply branch protection rules for `main` of this repository.
#
# Prerequisites:
#   - GitHub CLI `gh` is installed and authenticated:
#       gh auth login
#       gh auth status   # confirm a logged-in account with `repo` scope
#   - The authenticated account has admin access to the repository
#     (branch protection cannot be modified by non-admins).
#
# This script is idempotent: re-running it overwrites the protection
# payload for `main` with the rules below. It does NOT touch other
# branches or repository settings.
#
# Rules applied to `main`:
#   - required_status_checks: "quality-gate" (the CI job in
#     .github/workflows/ci.yml) must be reported by GitHub as
#     "success" before merge.
#     strict = true  → branches must be up to date before merge.
#   - required_pull_request_reviews:
#       required_approving_review_count = 1
#       dismiss_stale_reviews = true
#       require_code_owner_reviews = true
#       require_last_push_approval = true
#   - enforce_admins = true
#   - restrictions = none (any signed-in user may open a PR)
#   - block_force_pushes = true
#   - block_deletions = true
#   - required_linear_history = true
#   - required_conversation_resolution = true
#   - allow_fork_syncing = false
#   - lock_branch = false

set -euo pipefail

BRANCH="main"
REPO="$(gh repo view --json nameWithOwner -q '.nameWithOwner')"

echo "Applying branch protection to ${REPO}:${BRANCH} ..."

gh api \
    --method PUT \
    -H "Accept: application/vnd.github+json" \
    "/repos/${REPO}/branches/${BRANCH}/protection" \
    --input - <<'JSON'
{
    "required_status_checks": {
        "strict": true,
        "contexts": ["quality-gate"]
    },
    "enforce_admins": true,
    "required_pull_request_reviews": {
        "dismiss_stale_reviews": true,
        "require_code_owner_reviews": true,
        "required_approving_review_count": 1,
        "require_last_push_approval": true
    },
    "restrictions": null,
    "block_force_pushes": true,
    "block_deletions": true,
    "required_linear_history": true,
    "required_conversation_resolution": true,
    "allow_fork_syncing": false,
    "lock_branch": false
}
JSON

echo "Branch protection applied. Verify with:"
echo "  gh api /repos/${REPO}/branches/${BRANCH}/protection"