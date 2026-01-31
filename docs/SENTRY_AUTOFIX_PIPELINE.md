# Sentry → Auto-Fix Pipeline (Nat Eliason Workflow)

## Overview
Inspired by Nat Eliason's workflow: errors in production automatically get triaged, diagnosed, and fixed via coding agents — with humans reviewing the PRs.

## Architecture

```
Production App (Sentry SDK)
    ↓ error captured
Sentry Dashboard
    ↓ webhook / GitHub integration
GitHub Issue (auto-created)
    ↓ detected by OpenClaw heartbeat OR webhook
OpenClaw (Obi)
    ↓ spawns coding agent
Claude Code / Codex (in git worktree)
    ↓ reads error, finds code, writes fix
Pull Request (auto-created)
    ↓ CI runs (lint, typecheck, test, build)
Human Review → Merge → Deploy
```

## Setup Steps

### 1. Sentry Project (TODO)
- Create Sentry project for `men-at-gate`
- Get DSN → set as `VITE_SENTRY_DSN` env var
- Enable source maps upload in CI
- Configure alert rules for new issues

### 2. Sentry → GitHub Integration
**Option A: Native Sentry-GitHub Integration**
- Sentry has built-in GitHub integration
- Auto-creates GitHub issues from Sentry issues
- Includes stack trace, breadcrumbs, context
- Limitation: less customizable

**Option B: Sentry Webhook → n8n → GitHub Issue**
- More flexible, can add custom labels/context
- Can filter which errors become issues (ignore known, minor)
- Can add AI triage step before creating issue

**Recommended: Option A to start**, upgrade to B when needed.

### 3. OpenClaw Detection
**Current approach: Heartbeat polling**
- Every 5 minutes, check for new issues labeled `sentry` or `bug`
- Filter: only auto-created Sentry issues
- Spawn coding agent for each new issue

**Future: GitHub Webhook → OpenClaw**
- Instant response (no 5-min delay)
- POST to OpenClaw webhook endpoint
- Requires Tailscale or ngrok for local dev

### 4. Coding Agent Fix Flow
```bash
# 1. Create worktree for isolated work
git worktree add -b fix/sentry-{issue-id} /tmp/fix-{issue-id} main

# 2. Install deps
cd /tmp/fix-{issue-id} && npm install

# 3. Launch Claude Code with context
claude --dangerously-skip-permissions "
  Fix GitHub issue #{issue-number}: {title}
  
  Error: {sentry-error-message}
  Stack trace: {stack-trace}
  
  File: {file-path}:{line-number}
  
  Steps:
  1. Read the error and understand the root cause
  2. Find the relevant code
  3. Write a fix
  4. Add/update tests to cover the bug
  5. Run tests: npx vitest run
  6. Run build: npx vite build
  7. Commit and push
  8. Create PR with gh pr create
"

# 4. Clean up worktree after PR
git worktree remove /tmp/fix-{issue-id}
```

### 5. CI/CD Validation
Every PR gets:
- ✅ ESLint check
- ✅ TypeScript type check
- ✅ Vitest unit tests
- 🔜 Playwright E2E tests (future)
- ✅ Build verification

### 6. E2E Testing (Nat's Gap)
Nat's workflow doesn't include E2E testing. This is where we can improve:

**Add Playwright E2E tests that:**
- Test critical user flows (homepage load, navigation, auth)
- Run on every PR as part of CI
- Catch regressions that unit tests miss
- Auto-screenshot on failure for visual debugging

**E2E test ideas:**
- Homepage renders all sections
- Navigation links work
- Auth flow (login/signup modal)
- Responsive layout (mobile/tablet/desktop)
- Race submission flow
- Workout calendar loads

## Improvements Over Nat's Workflow

| Gap in Nat's Approach | Our Improvement |
|---|---|
| No E2E tests | Playwright E2E in CI |
| No preview deploys | Vercel preview on every PR |
| Manual PR review only | AI-assisted code review + human approval |
| Single error → single fix | Batch related errors into one fix |
| No error deduplication | Sentry deduplication + smart grouping |
| No rollback | Auto-rollback if error rate spikes post-deploy |

## Environment Variables Needed
```
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_AUTH_TOKEN=sntrys_xxx (for source maps in CI)
SENTRY_ORG=mita
SENTRY_PROJECT=men-at-gate
```

## Timeline
1. ✅ Sentry SDK integrated
2. ✅ Error boundaries added
3. ✅ CI/CD pipeline running
4. 🔜 Create Sentry project & get DSN
5. 🔜 Enable Sentry-GitHub integration
6. 🔜 Add heartbeat polling for new issues
7. 🔜 Add Playwright E2E tests
8. 🔜 Add Vercel preview deploys
