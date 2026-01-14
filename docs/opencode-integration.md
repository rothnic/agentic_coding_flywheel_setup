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

ACFS provides seamless integration between OpenCode and NTM for coordinating multiple agent sessions.

#### Spawning Multiple OpenCode Sessions

Use the `ocs spawn` command to create multiple OpenCode sessions with different agent roles:

```bash
# Match NTM pattern: spawn with type counts
ocs spawn myproject --oc=2 --oc-architect=1 --oc-tester=1

# All default agents
ocs spawn analytics --oc=3

# Single architect
ocs spawn webapp --oc-architect=1
```

#### Agent Types

| Type | Role | Best For |
|------|------|----------|
| `default` | General-purpose | Mixed tasks, exploration |
| `architect` | System design | Architecture decisions, API design |
| `reviewer` | Code review | Quality checks, security review |
| `tester` | Test generation | Unit tests, integration tests, edge cases |
| `docs` | Documentation | README, API docs, inline comments |
| `debugger` | Bug hunting | Performance issues, memory leaks, crashes |

#### Sending Commands to Agents

The spawned sessions follow NTM conventions - send commands to all sessions or target by session name:

```bash
# Send to ALL sessions in the project
ntm send myproject "Analyze this codebase and identify the main components"

# Target specific sessions by name (sessions are named: PROJECT-TYPE-N)
ntm send myproject-architect-1 "Review the system architecture for scalability"
ntm send myproject-tester-1 "Generate tests for the user authentication module"
```

**Note:** Unlike `ntm spawn` with `--cc`, `--cod` flags, OpenCode sessions are targeted by their full session name since each OpenCode agent connects to the same shared server. To target all architects, you can use pattern matching with your shell or ntm features.

#### Complete Multi-Agent Workflow

Here's a complete example workflow following NTM patterns:

```bash
# 1. Start the OpenCode server (if not running)
ocs start

# 2. Spawn agents following NTM flag pattern
ocs spawn myapi --oc-architect=1 --oc=2 --oc-tester=1

# This creates sessions:
#   myapi-architect-1
#   myapi-oc-1
#   myapi-oc-2
#   myapi-tester-1

# 3. Send initial analysis to ALL agents
ntm send myapi "This is a REST API project. Analyze the current state."

# 4. Send to specific agents by session name
ntm send myapi-architect-1 "Design scalable architecture for 10k req/s"
ntm send myapi-tester-1 "Generate comprehensive test suite with >80% coverage"

# 5. Monitor server and client resource usage
ocs status

# 6. Attach to specific agent to review work
ntm attach myapi-architect-1

# 7. List all active sessions
ntm list | grep myapi

# 8. View all sessions in grid layout  
ntm palette
```

#### Parallel Agent Workflows

Coordinate multiple agents working in parallel:

```bash
# Spawn agents following NTM conventions
ocs spawn fullstack --oc=2 --oc-tester=2 --oc-docs=1

# Agents work on different areas
ntm send fullstack-oc-1 "Focus on React frontend - implement responsive design"
ntm send fullstack-oc-2 "Focus on Express backend - implement RESTful endpoints"
ntm send fullstack-tester-1 "Write E2E tests for user authentication flow"
ntm send fullstack-docs-1 "Create comprehensive API documentation with examples"
```

#### Mixed Agent Session Example

Combine OpenCode with other agents (Claude, Codex, Gemini) in a single project:

```bash
# Start OpenCode server
ocs start

# Create OpenCode sessions
ocs spawn project1 --oc=2

# Also create traditional agent sessions with NTM
ntm spawn project1 --cc=1 --cod=1

# Now send commands to ALL agents (both OpenCode and others)
ntm send project1 "Analyze the authentication system"

# Or target specific sessions
ntm send project1-oc-1 "Use OpenCode to implement the auth system"
ntm send project1-cc-1 "Use Claude to review the implementation"
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

ACFS implements a `PreToolUse` hook for Claude Code (`git_safety_guard.py`) to block destructive commands. OpenCode has similar mechanisms through its plugin ecosystem.

### OpenCode Plugin Compatibility

OpenCode supports an extensive plugin ecosystem with many Claude Code-compatible features:

#### Safety and Security Plugins

1. **CC Safety Net** - Port of Claude Code's safety net for destructive commands
   - GitHub: [kenryu42/claude-code-safety-net](https://github.com/kenryu42/claude-code-safety-net)
   - Catches destructive git and filesystem commands before execution
   - Compatible with ACFS's git_safety_guard.py approach

2. **Envsitter Guard** - Prevents .env file leaks
   - GitHub: [boxpositron/envsitter-guard](https://github.com/boxpositron/envsitter-guard)
   - Blocks access to sensitive environment files
   - Shows keys + fingerprints only, never values

#### Background Task Management

3. **Background Agents** - Claude Code-style background agents
   - GitHub: [kdcokenny/opencode-background-agents](https://github.com/kdcokenny/opencode-background-agents)
   - Async delegation with context persistence
   - Similar to Claude Code's background task feature enabled by `ENABLE_BACKGROUND_TASKS=1`

4. **Froggy** - Comprehensive hooks and specialized agents
   - GitHub: [smartfrog/opencode-froggy](https://github.com/smartfrog/opencode-froggy)
   - Claude Code-style hooks
   - Specialized agent support
   - Additional tools like gitingest

#### Agent Coordination

5. **IAM (Inter-Agent Messaging)** - Multi-agent communication
   - GitHub: [spoons-and-mirrors/iam](https://github.com/spoons-and-mirrors/iam)
   - Parallel subagent coordination
   - Async message broadcasting
   - Perfect for `ocs spawn` multi-agent workflows

6. **Agent Skills** - Dynamic skills loader
   - GitHub: [joshuadavidthomas/opencode-agent-skills](https://github.com/joshuadavidthomas/opencode-agent-skills)
   - Discovers skills from project/user/plugin directories
   - Extends agent capabilities

#### Memory and Context

7. **Agent Memory** - Letta-inspired persistent memory
   - GitHub: [joshuadavidthomas/opencode-agent-memory](https://github.com/joshuadavidthomas/opencode-agent-memory)
   - Self-editable memory blocks
   - Context persistence across sessions

8. **Dynamic Context Pruning** - Optimize token usage
   - GitHub: [Tarquinen/opencode-dynamic-context-pruning](https://github.com/Tarquinen/opencode-dynamic-context-pruning)
   - Prunes obsolete tool outputs
   - Reduces token consumption

### Installing OpenCode Plugins

OpenCode plugins can be installed directly:

```bash
# Example: Install CC Safety Net plugin
npm install -g @kenryu42/claude-code-safety-net

# Configure in ~/.opencode/config.json
{
  "plugins": [
    "@kenryu42/claude-code-safety-net"
  ]
}
```

### ACFS Git Safety Guard Compatibility

The ACFS `git_safety_guard.py` hook for Claude Code follows similar patterns to OpenCode's CC Safety Net plugin. Key features:

- Blocks destructive git commands (`git reset --hard`, `git clean -f`)
- Blocks dangerous filesystem operations (`rm -rf`)
- PreToolUse hook integration
- Configurable via `~/.claude/settings.json`

For OpenCode users, the CC Safety Net plugin provides equivalent functionality and can be used alongside ACFS's Claude Code safety guard.

### Recommended Plugin Stack for ACFS Users

```bash
# Core safety
- CC Safety Net (destructive command protection)
- Envsitter Guard (environment variable protection)

# Multi-agent workflows (when using ocs spawn)
- IAM (inter-agent messaging)
- Background Agents (async task delegation)

# Productivity
- Agent Memory (persistent context)
- Dynamic Context Pruning (token optimization)
- Agent Skills (extended capabilities)
```

### Integration with Claude Code Extensions

Since OpenCode is designed with Claude Code compatibility in mind, most Claude Code extensions and hooks can be adapted for OpenCode use. The plugin ecosystem actively maintains compatibility with Claude Code patterns.

**OpenCode Alternatives:**
1.  **Permissions**: OpenCode allows granular permission configuration (`OPENCODE_PERMISSION` env var or config).
    - Can restrict `git push --force` or `rm -rf` via permissions
    - OpenCode prompts for permission by default, but ACFS users might run with auto-approve (`-y` equivalent)
2.  **Rules**: `Configure -> Rules`. Can system prompts enforce safety? (Less reliable than hooks).
3.  **Middleware/Plugins**: OpenCode supports plugins. A custom plugin could implement the safety guard logic.

**Recommendation:**
Use OpenCode's CC Safety Net plugin for parity with Claude Code's git_safety_guard.py, or explore the extensive plugin ecosystem at [awesome-opencode](https://github.com/awesome-opencode/awesome-opencode) for additional functionality.

