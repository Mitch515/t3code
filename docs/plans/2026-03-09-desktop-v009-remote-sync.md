# Desktop v0.0.9 Remote Sync Upgrade Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade the custom desktop deployment to upstream `v0.0.9`, preserve the current remote-sync/local WIP behavior, redeploy to desktop and laptop, and remove the stale-bundle repair path.

**Architecture:** Preserve the current dirty repo state on a dedicated branch, port the relevant customization into an isolated `v0.0.9` worktree, then rebuild and redeploy from that updated source. Repair automation should rebuild from the updated source before patching installed installs so future upstream desktop updates do not revert the UI.

**Tech Stack:** Git worktrees, Bun, Electron, React, PowerShell, SSH

---

### Task 1: Preserve Current Local State

**Files:**
- Modify: `.gitignore`
- Create: `docs/plans/2026-03-09-desktop-v009-remote-sync-design.md`
- Create: `docs/plans/2026-03-09-desktop-v009-remote-sync.md`
- Snapshot: current dirty desktop customization files on a dedicated branch

**Step 1: Create the safety branch**

Run: `git checkout -b wip/desktop-v009-port-2026-03-09`

Expected: branch created from the current detached HEAD with the dirty working tree preserved.

**Step 2: Stage the current desktop customization snapshot**

Run: `git add .gitignore docs/plans/2026-03-09-desktop-v009-remote-sync-design.md docs/plans/2026-03-09-desktop-v009-remote-sync.md apps/desktop/src/main.ts apps/desktop/src/preload.ts apps/web/src/components/Sidebar.tsx apps/web/src/routes/_chat.settings.tsx apps/web/src/wsTransport.ts apps/web/src/wsTransport.test.ts packages/contracts/src/ipc.ts apps/web/src/desktopConnection.ts`

Expected: staged snapshot includes the current local customization and planning docs.

**Step 3: Commit the snapshot**

Run: `git commit -m "wip: snapshot desktop remote-sync customization"`

Expected: the current state is preserved before upstream porting begins.

### Task 2: Create the v0.0.9 Worktree

**Files:**
- Create: `.worktrees/desktop-v009-remote-sync/*`

**Step 1: Verify `.worktrees` is ignored**

Run: `git check-ignore -v .worktrees`

Expected: `.gitignore` is the ignore source.

**Step 2: Create the worktree from upstream `v0.0.9`**

Run: `git worktree add .worktrees/desktop-v009-remote-sync -b chore/desktop-v009-remote-sync v0.0.9`

Expected: isolated worktree exists on a new branch based on the upstream tag.

### Task 3: Port the Customization onto v0.0.9

**Files:**
- Modify: `apps/desktop/src/main.ts`
- Modify: `apps/desktop/src/preload.ts`
- Modify: `apps/web/src/components/Sidebar.tsx`
- Modify: `apps/web/src/routes/_chat.settings.tsx`
- Modify: `apps/web/src/wsTransport.ts`
- Modify: `apps/web/src/wsTransport.test.ts`
- Modify: `packages/contracts/src/ipc.ts`
- Create: `apps/web/src/desktopConnection.ts`

**Step 1: Compare the snapshot branch against `v0.0.9`**

Run: `git diff v0.0.9..wip/desktop-v009-port-2026-03-09 -- <files>`

Expected: explicit patch inventory before porting.

**Step 2: Apply or manually port changes one file at a time**

Run: `git cherry-pick <snapshot-commit>` if clean, otherwise port file-by-file and resolve conflicts carefully.

Expected: upstream `v0.0.9` plus the desktop remote-sync customization and desired local WIP.

### Task 4: Build and Validate in the Worktree

**Files:**
- Build output: `apps/desktop/dist-electron/*`
- Build output: `apps/server/dist/*`

**Step 1: Install deps if needed**

Run: `bun install`

Expected: worktree dependencies are ready.

**Step 2: Run lint**

Run: `bun lint`

Expected: exit `0`.

**Step 3: Run typecheck**

Run: `bun typecheck`

Expected: exit `0`.

**Step 4: Build desktop artifacts**

Run: `bun run build:desktop`

Expected: fresh `apps/desktop/dist-electron` and `apps/server/dist` for the updated source.

### Task 5: Redeploy and Verify Desktop + Laptop

**Files:**
- Modify: installed desktop `app.asar`
- Modify: installed laptop `app.asar`
- Modify: `C:\Users\Quentin\.t3\userdata\desktop-connection.json`
- Modify: monitor baseline state/log

**Step 1: Reapply from the updated source**

Run: `powershell -NoProfile -ExecutionPolicy Bypass -File C:\Users\Quentin\reapply_t3_customizations.ps1`

Expected: desktop and laptop installs are patched from the new build.

**Step 2: Refresh the monitor baseline**

Run: `powershell -NoProfile -ExecutionPolicy Bypass -File C:\Users\Quentin\check_t3_desktop_update_and_repair.ps1 -RefreshBaseline`

Expected: baseline matches the updated installs.

**Step 3: Verify clean monitor state**

Run: `powershell -NoProfile -ExecutionPolicy Bypass -File C:\Users\Quentin\check_t3_desktop_update_and_repair.ps1 -CheckOnly`

Expected: `No drift detected.`

**Step 4: Verify runtime logs**

Run:
- desktop log grep for `desktop connection active mode=remote requested=remote url=http://127.0.0.1:3773`
- laptop log grep for `desktop connection active mode=remote requested=remote url=https://desktop.tail36211e.ts.net:8443`

Expected: both machines show the correct remote endpoints.

### Task 6: Remove the Stale-Bundle Failure Mode

**Files:**
- Modify: `C:\Users\Quentin\reapply_t3_customizations.ps1`
- Modify: `C:\Users\Quentin\check_t3_desktop_update_and_repair.ps1`
- Optionally create: helper build/update script under `ops/` if needed

**Step 1: Ensure repair flow rebuilds before patching**

Update the automation so the repair path rebuilds desktop artifacts from the updated source tree before replacing installed `app.asar`.

**Step 2: Verify repair path remains laptop-safe**

Keep the existing behavior where desktop repair succeeds locally even if the laptop is offline, but update both machines when SSH is available.

**Step 3: Re-run monitor flow**

Run the refresh/check-only path again after automation changes.

Expected: future repairs no longer revert newer upstream UI by replaying stale artifacts.

Plan complete and saved to `docs/plans/2026-03-09-desktop-v009-remote-sync.md`.
