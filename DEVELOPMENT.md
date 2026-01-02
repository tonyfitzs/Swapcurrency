# Development vs Production Profiles

This guide explains how to switch between Development (YOLO mode) and Production (safe mode) profiles in Cursor.

## Development Profile (YOLO Mode / Auto-Accept Changes)

**Use this when actively developing and want the AI to make changes automatically.**

### Setup Steps:
1. Open Cursor Settings: `Ctrl+,` (Windows) or `Cmd+,` (Mac)
2. Navigate to **Agents** section
3. Find the **Auto-Run** section and configure:

   **Auto-Run Mode:**
   - Set to **"Use Allowlist"** (you already have this ✅)
   - OR if available, try **"Always"** or **"Auto-Accept"** option if it appears in the dropdown

   **Command Allowlist:**
   - You already have `*` ✅ (this allows all commands)
   - If empty, add: `*` (allows all commands)

   **Turn OFF these protection toggles (CRITICAL - these block auto-accept):**
   - ❌ **Browser Protection** - Turn this OFF (currently ON/green)
   - ❌ **File-Deletion Protection** - Turn this OFF (currently ON/green)
   - ❌ **Dotfile Protection** - Turn this OFF (currently ON/green)
   - ❌ **External-File Protection** - Turn this OFF (if visible)

   **MCP Allowlist (if using MCP tools):**
   - Add: `*:*` (allows all tools) OR
   - Add specific tools as needed

   **Auto-Approved Mode Transitions:**
   - Add: `agent->plan`, `plan->agent` (allows automatic mode switching)

### When to Use:
- Initial development
- Rapid prototyping
- When you want AI to make changes without asking
- When you're actively reviewing all changes

---

## Production Profile (Safe Mode)

**Use this when making production-ready changes or when you want more control.**

### Setup Steps:
1. Open Cursor Settings: `Ctrl+,` (Windows) or `Cmd+,` (Mac)
2. Navigate to **Agents** section
3. Configure the following:

   **Turn ON these protection toggles:**
   - ✅ Browser Protection
   - ✅ File-Deletion Protection
   - ✅ Dotfile Protection
   - ✅ External-File Protection

   **Command Allowlist:**
   - Remove `*` or keep only specific safe commands
   - Example: `filesystem:read_file` (read-only)

   **MCP Allowlist:**
   - Remove `*:*` or keep only specific safe tools

   **Auto-Approved Mode Transitions:**
   - Remove all entries (requires manual approval for mode changes)

### When to Use:
- Production deployments
- Final code reviews
- When you want to approve every change
- Working with critical files

---

## Quick Switch Script

Since Cursor doesn't support automatic profile switching yet, here's a manual checklist:

### Switch to Development Mode (Auto-Accept Changes):
- [ ] **Auto-Run Mode**: Set to "Use Allowlist" (you have this ✅)
- [ ] **Command Allowlist**: Ensure `*` is present (you have this ✅)
- [ ] **Turn OFF Browser Protection** ⚠️ (Currently ON - this blocks auto-accept!)
- [ ] **Turn OFF File-Deletion Protection** ⚠️ (Currently ON - this blocks auto-accept!)
- [ ] **Turn OFF Dotfile Protection** ⚠️ (Currently ON - this blocks auto-accept!)
- [ ] **Turn OFF External-File Protection** (if visible)
- [ ] Add `*:*` to MCP Allowlist (if using MCP tools)
- [ ] Add `agent->plan` to Auto-Approved Mode Transitions (optional)

### Switch to Production Mode:
- [ ] Turn ON Browser Protection
- [ ] Turn ON File-Deletion Protection
- [ ] Turn ON Dotfile Protection
- [ ] Turn ON External-File Protection
- [ ] Remove `*` from Command Allowlist
- [ ] Remove `*:*` from MCP Allowlist

---

## Future Enhancement

If Cursor adds support for workspace-specific Agent settings, we can update this guide to use `.cursor/settings.json` or similar configuration files.

---

## Current Workspace Settings

The `.vscode/settings.json` file contains workspace-specific editor settings, but Agent settings are currently global in Cursor.

