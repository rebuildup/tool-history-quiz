# ADR 0002: Release-driven PR workflow and main protection

## Status

Accepted

Supersedes: the initial feature-branch / approval-required / linear-history setup drafted during repository initialization.

## Context

This repository needs protected integration without creating a solo-development deadlock. The current project-init operating model uses GitHub Issues for durable implementation state, a release branch as the integration line, and merge commits for preserved branch history.

## Decision

### Branch topology

- `main`: released / integrated source state.
- `release-x-y-z`: current release integration line.
- ticket branch: Issue number only by default.
- independent ticket PR: target current release branch.
- once the release branch has meaningful difference, keep a Draft release PR from `release-x-y-z` to `main`.
- normal integration to `main` is only from the current release branch.

### Main protection

- required status check: `quality-gate`.
- required conversation resolution: enabled.
- approving review count: 0.
- CODEOWNERS review: not required.
- admins are subject to protection.
- force push / branch deletion: blocked.
- linear-history requirement: disabled.

CODEOWNERS remains useful for ownership routing, but it is not a solo-repository merge authorization mechanism.

### Merge semantics

Repository settings:

- `allow_merge_commit=true`
- `allow_squash_merge=false`
- `allow_rebase_merge=false`

Landing therefore uses merge commits only. This is distinct from branch-local rebase used for branch mechanics.

### CI

CI runs on all pull requests so both ticket PRs targeting `release-x-y-z` and the release PR targeting `main` receive the same `quality-gate`.

### Reproducibility

`scripts/setup-branch-protection.sh` applies repository merge settings and main branch protection idempotently through `gh api`.

## Consequences

- A single maintainer does not need to manufacture a self-approval.
- review conversations still have to be resolved.
- ticket work can integrate and stabilize on the release line before main changes.
- commit topology is retained by merge commits.
- the old linear-history requirement is intentionally removed because it conflicts with merge-commit-only landing.

## Re-evaluation conditions

Re-evaluate if the project adopts continuous delivery, grows to a team where approval gates add meaningful independent review, or changes its release topology.
