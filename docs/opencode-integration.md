# OpenCode Integration & Architecture

This document details the integration of OpenCode into ACFS and explores strategies for optimizing resource usage (MCP deduplication) via its Client/Server architecture.

## Architecture: Client vs. Server

OpenCode operates on a client/server model, though the default TUI command (`opencode`) typically runs both in a single process (or spawns a private server).

### The Problem: Duplicate MCP Servers
When running multiple interactive OpenCode sessions (e.g., in different tmux windows via `ntm` or the ACFS workspace), each instance spawns its own set of MCP servers. This leads to:
- High memory usage.
- Duplicate connections/authentications.
- Slow startup times (cold boot for each session).

### The Solution: Shared Server (`opencode serve`)
OpenCode supports a headless server mode that manages the MCP connections and LLM context. Clients can attach to this server.

**Workflow:**
1.  **Start Server**: Run `opencode serve` (e.g., on port 4096).
2.  **Attach Client**: Use `opencode run --attach http://localhost:4096` to send prompts to the shared instance.

**Benefits:**
- **Single MCP Host**: One set of MCP servers for all clients.
- **Persistent Context**: The server maintains state across client disconnects.
- **Faster Commands**: No boot overhead for `opencode run` commands.

## ACFS Integration

ACFS provides aliases to facilitate this workflow:

| Alias | Command | Description |
|-------|---------|-------------|
| `oc` | `opencode` | Standard interactive TUI (currently independent). |
| `ocs` | `opencode serve --port 4096` | Start the shared server. |
| `oca` | `opencode run --attach http://localhost:4096` | Run a prompt against the shared server. |

### Limitations (TUI Attachment)
As of OpenCode CLI v1.0, the interactive TUI (`opencode`) does not explicitly document an `--attach` flag or environment variable to connect to an existing `opencode serve` instance.
- **Current State**: TUI sessions (`oc`) run independently.
- **Workaround**: Use `oca "prompt"` for quick tasks sharing the server.
- **Future Work**: Monitor OpenCode updates for TUI client-server separation or `OPENCODE_SERVER_URL` support.

## Security & Hooks (Gap Analysis)

ACFS implements a `PreToolUse` hook for Claude Code (`git_safety_guard.py`) to block destructive commands. OpenCode requires an equivalent mechanism.

**OpenCode Alternatives:**
1.  **Permissions**: OpenCode allows granular permission configuration (`OPENCODE_PERMISSION` env var or config).
    - Can we restrict `git push --force` or `rm -rf` via permissions?
    - OpenCode prompts for permission by default, but ACFS users might run with auto-approve (`-y` equivalent).
2.  **Rules**: `Configure -> Rules`. Can system prompts enforce safety? (Less reliable than hooks).
3.  **Middleware/Plugins**: OpenCode supports plugins. A custom plugin could implement the safety guard logic.

**Recommendation:**
Investigate OpenCode Plugin API to port `git_safety_guard.py` logic, or rely on strict Permission configuration.
