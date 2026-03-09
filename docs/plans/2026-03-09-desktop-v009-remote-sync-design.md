# Desktop v0.0.9 Remote Sync Upgrade Design

## Goal

Preserve the current custom shared-remote desktop behavior while upgrading the deployed desktop app to upstream `v0.0.9`, keeping the newer upstream UI changes, and making future repair runs automatic instead of manually replaying older built artifacts.

## Current Problem

The desktop auto-updater installs the latest upstream executable and stock `app.asar`. Our repair flow then copies locally built desktop/server bundles from an older repo snapshot back into the installed app. That restores remote-mode behavior, but it also replaces newer upstream UI/runtime changes with older repo-built assets.

## Requirements

- Preserve the current local desktop customization:
  - remote/local desktop connection mode
  - persisted remote URL/token settings
  - remote mode skipping the local backend
  - settings UI for desktop connection
  - delete-refresh behavior in the sidebar
- Carry forward the additional local WIP that the user wants preserved.
- Update both desktop and laptop installs.
- Make future repairs rebuild from an updated upstream source of truth rather than replaying stale bundles.
- Verify desktop and laptop runtime logs show remote mode after deployment.

## Options Considered

### 1. Reapply the current built artifacts after each upstream update

Fastest, but incorrect. It keeps reverting visible upstream UI changes whenever the installed app updates.

### 2. Update the repo to upstream `v0.0.9`, port the customization onto that version, rebuild, and redeploy

Recommended. This keeps the new upstream UI while preserving the custom remote-sync behavior and gives us a clean base for future repairs.

### 3. Stop using the upstream updater entirely

Possible, but not aligned with the current desktop setup. It would avoid drift but would require a separate distribution/update policy and more local maintenance.

## Approved Design

1. Preserve the current dirty local repo state on a dedicated branch with a snapshot commit.
2. Create an isolated worktree from upstream `v0.0.9`.
3. Port the current desktop customization and desired local WIP onto the `v0.0.9` worktree.
4. Rebuild the desktop/server bundles from the updated worktree.
5. Update the repair automation so it can rebuild from the correct upstream-backed source before patching installed apps.
6. Redeploy to the desktop and laptop and refresh the monitor baseline.
7. Verify:
   - `bun lint`
   - `bun typecheck`
   - desktop runtime log shows remote mode against `http://127.0.0.1:3773`
   - laptop runtime log shows remote mode against `https://desktop.tail36211e.ts.net:8443`
   - monitor `-CheckOnly` returns no drift

## Automation Direction

The monitor-triggered repair path should not blindly reuse whatever old build artifacts happen to exist in the repo. It needs a stable upgrade source. The simplest approach is:

- keep the repo as source of truth
- keep the custom patch committed on top of newer upstream
- make the repair path rebuild from that updated source before copying `app.asar`

This avoids repeating the exact failure where the upstream updater briefly installs the new UI and the repair path then rolls it back.
