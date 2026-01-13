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
1.  **Start Server**: Run `ocs start` (manages `opencode serve` on port 4096).
2.  **Attach Client**: Use `oca "<prompt>"` to send prompts to the shared instance.

**Benefits:**
- **Single MCP Host**: One set of MCP servers for all clients.
- **Persistent Context**: The server maintains state across client disconnects.
- **Faster Commands**: No boot overhead for `opencode run` commands.

## ACFS Integration

ACFS provides commands and aliases to facilitate this workflow:

| Command/Alias | Description |
|---------------|-------------|
| `oc` | Standard interactive OpenCode TUI (independent session) |
| `ocs` | OpenCode Server Manager utility |
| `oca "<prompt>"` | Run a prompt against the shared server |

### OpenCode Server Manager (`ocs`)

The `ocs` utility provides comprehensive server management:

```bash
# Start the server in background
ocs start

# Check server status and active connections
ocs status

# View server logs
ocs logs

# Stop the server
ocs stop

# Restart the server
ocs restart

# Quick start: Launch server + 3 agent clients in tmux
ocs quick-start
```

#### Quick Start Example

The fastest way to get started with multiple OpenCode clients:

```bash
# Launch server and 3 pre-configured tmux sessions
ocs quick-start
```

This creates:
- `oc-architect`: For system design and architecture prompts
- `oc-reviewer`: For code review prompts
- `oc-tester`: For test generation prompts

Access sessions with:
```bash
ntm attach oc-architect     # Switch to architect session
oca "Design a user service" # Send prompt to shared server
ntm palette                 # View all sessions in a grid
```

### Integration with NTM (Named Tmux Manager)

For more control, manually create sessions with specific roles:

```bash
# Start server
ocs start

# Create specialized client sessions
ntm spawn "planning" "oca 'Create a detailed plan for...'"
ntm spawn "implementation" "bash"  # Manual session for implementation
ntm spawn "testing" "oca 'Write comprehensive tests for...'"
ntm spawn "documentation" "oca 'Document the following code...'"

# View all sessions in command palette
ntm palette

# Attach to specific session
ntm attach planning
```

### Multi-Agent Workflow Example

Coordinate multiple specialized agents on a single task:

```bash
# 1. Start the shared server
ocs start

# 2. Create agent sessions
ntm spawn "architect" "bash"
ntm spawn "implementer" "bash"
ntm spawn "reviewer" "bash"

# 3. In each session, run specialized prompts:
# Session "architect":
oca "Design the API for a user authentication system"

# Session "implementer" (after architect completes):
oca "Implement the authentication API based on the previous design"

# Session "reviewer" (after implementation):
oca "Review the authentication code for security issues"

# 4. Monitor progress
ntm list            # List all active sessions
ocs status          # Check server connections
```

### Advanced Usage

#### Custom Port

```bash
OPENCODE_PORT=8080 ocs start
OPENCODE_PORT=8080 oca "Your prompt"
```

#### Server Monitoring

```bash
# Check status and connections
ocs status

# Output example:
# OpenCode Server Status
# =====================
# 
# Status:      Running
# PID:         12345
# Port:        4096
# URL:         http://localhost:4096
# Connections: 3 active
# Memory:      245MB
# Uptime:      02:15:30
```

#### Log Monitoring

```bash
# Tail server logs in real-time
ocs logs
```

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

