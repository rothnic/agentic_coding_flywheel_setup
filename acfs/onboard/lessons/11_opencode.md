# OpenCode: Server-Based AI Agent

**Goal:** Master OpenCode's unique server/client architecture and multi-agent workflows.

---

## What Makes OpenCode Different?

OpenCode uses a **client-server architecture**:
- **Server** runs in the background, managing AI provider connections
- **Clients** connect to the server to send prompts
- **Multiple clients** can share a single server instance

This enables powerful multi-agent workflows!

---

## The `ocs` Command - Your Control Center

Run `ocs` (with no arguments) to see all available commands:

```bash
ocs
```

This shows you the full interface for managing OpenCode.

---

## Quick Start

### 1. Interactive Mode (Simple)

```bash
oc "Your prompt here"
```

This starts OpenCode in interactive TUI mode.

### 2. Server Mode (Multi-Agent)

```bash
# Start server in background
ocs start

# Connect a client
oca "Analyze this codebase"

# Check server status
ocs status

# Stop server when done
ocs stop
```

---

## Discovering Commands

### Main Commands

| Command | Purpose |
|---------|---------|
| `oc` | OpenCode interactive TUI |
| `oca` | Attach client to running server |
| `ocs` | Server management utility |

### Explore `ocs` Options

```bash
# Show all commands and examples
ocs --help

# Start server
ocs start

# Check status with resource monitoring
ocs status

# View server logs
ocs logs

# Restart server
ocs restart
```

---

## Multi-Agent Workflows with NTM

OpenCode integrates seamlessly with NTM. You have two options:

### Option 1: OpenCode-Only Sessions (via ocs)

```bash
# Spawn OpenCode agents directly
ocs spawn myproject --oc=2 --oc-architect=1

# This creates tmux sessions compatible with ntm send
ntm send myproject "Analyze authentication system"
ntm send myproject-architect-1 "Design scalable architecture"
```

### Option 2: Mixed Agent Sessions (via ntm)

```bash
# Spawn multiple agent types together
ntm spawn myproject --cc=2 --cod=1 --oc=1 --gmi=1

# Send to all agents
ntm send myproject "Review this codebase"

# Target specific agent types
ntm send myproject --cc "Focus on code quality"
ntm send myproject --oc "Check security patterns"
```

**Note:** `ocs spawn` creates OpenCode-specific sessions. Use `ntm spawn` to mix multiple agent types in one session.

---

## Resource Monitoring

OpenCode provides detailed resource monitoring:

```bash
ocs status
```

Shows:
- Server PID, CPU%, memory, uptime
- All connected clients with individual metrics
- Combined totals for capacity planning

---

## Agent Types

When spawning with `ocs spawn`, you can create specialized agents:

| Type | Purpose |
|------|---------|
| `--oc=N` | General-purpose agents |
| `--oc-architect=N` | System design |
| `--oc-reviewer=N` | Code review |
| `--oc-tester=N` | Test generation |
| `--oc-docs=N` | Documentation |
| `--oc-debugger=N` | Bug hunting |

**Example:**
```bash
ocs spawn webapp --oc=1 --oc-architect=1 --oc-tester=2
```

---

## Common Workflows

### Single Agent Development

```bash
# Quick prompt
oc "Implement user authentication"

# Or with server mode
ocs start
oca "Implement user authentication"
```

### Multi-Agent Collaboration

```bash
# Start server (if not running)
ocs start

# Spawn 3 agents for different roles
ocs spawn myapi --oc-architect=1 --oc=1 --oc-tester=1

# Coordinate work
ntm send myapi-architect-1 "Design API architecture"
ntm send myapi-oc-1 "Implement the endpoints"
ntm send myapi-tester-1 "Write integration tests"
```

---

## Configuration & Providers

OpenCode supports multiple AI providers:

```bash
# Check configured providers and models
opencode models

# Interactive setup
opencode
```

Providers:
- Anthropic (Claude)
- OpenAI (GPT)
- Google (Gemini)
- And more...

---

## Troubleshooting

### Command not found: ocs

```bash
# Verify PATH includes ~/.acfs/bin
echo $PATH | grep -o ".acfs/bin"

# Reload shell config
source ~/.zshrc
```

### Server won't start

```bash
# Check if already running
ocs status

# View logs for errors
ocs logs

# Restart server
ocs restart
```

### No models available

```bash
# Run initial setup
opencode

# Verify provider authentication
opencode models
```

---

## Tips & Tricks

1. **Run `ocs` alone** to see all available commands and examples
2. **Use `ocs status`** to monitor resource usage
3. **Spawn multiple agents** for parallel work on complex tasks
4. **Server mode** is efficient for rapid iteration
5. **Interactive mode (`oc`)** is great for exploratory work

---

## Next Steps

Now that you understand OpenCode, try combining it with other agents:

```bash
# Mix OpenCode with Claude, Codex, and Gemini
ntm spawn project --cc=1 --cod=1 --oc=1 --gmi=1

# Send coordinated prompts
ntm send project "Review this PR and suggest improvements"

# Or use OpenCode-only for privacy-focused work
ocs spawn private-project --oc=2
ntm send private-project "Audit security practices"
```

For more details, see `docs/opencode-integration.md`.

---

**Pro Tip:** Bookmark this command:
```bash
ocs --help  # Your quick reference!
```
