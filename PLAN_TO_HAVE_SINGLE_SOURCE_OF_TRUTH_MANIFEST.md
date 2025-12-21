# Plan: Single Source of Truth Manifest Architecture

## Executive Summary

Transform the manifest system from "documentation that generates unused scripts" into the **actual driver** of installation. The manifest becomes the canonical definition of what gets installed, and `install.sh` becomes a thin orchestration layer that sources generated module installers.

## Project Policies (Non-Negotiable)

- **No outside contributors:** ACFS is maintained internally. Do not add contributing guides, “PRs welcome” language, or any workflow/documentation aimed at external contributors.
- **`curl | bash` is the primary entrypoint:** The design must work when `install.sh` runs without a local checkout (i.e., `SCRIPT_DIR` may be empty).
- **Generated scripts are libraries:** Generated `scripts/generated/*.sh` must be safely `source`-able (no global `set -euo pipefail`, no top-level side effects, and contract validation must `return`, not `exit`).

---

## Current State (The Problem)

```
┌─────────────────────────────────────────────────────────────────┐
│                    TWO PARALLEL UNIVERSES                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Universe A (Unused):                                            │
│  ┌──────────────────┐    ┌─────────────┐    ┌─────────────────┐ │
│  │ acfs.manifest.yaml│───▶│ generate.ts │───▶│ scripts/generated/│
│  │ (50+ modules)     │    │             │    │ (NEVER EXECUTED) │
│  └──────────────────┘    └─────────────┘    └─────────────────┘ │
│                                                                  │
│  Universe B (Actual):                                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    install.sh (1575 lines)                │   │
│  │   - Hand-maintained, duplicates manifest logic            │   │
│  │   - Contains orchestration + module installation          │   │
│  │   - Drifts from manifest over time                        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Symptoms:**
- Manifest changes don't affect installation
- install.sh and manifest can disagree
- Duplicated effort maintaining both
- "Single source of truth" is a lie

---

## Target State (The Solution)

```
┌─────────────────────────────────────────────────────────────────┐
│                    SINGLE SOURCE OF TRUTH                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐    ┌─────────────┐    ┌─────────────────┐ │
│  │ acfs.manifest.yaml│───▶│ generate.ts │───▶│ scripts/generated/│
│  │ (enhanced schema) │    │ (enhanced)  │    │ install_*.sh    │ │
│  └──────────────────┘    └─────────────┘    └────────┬────────┘ │
│                                                       │          │
│                                                       ▼          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              install.sh (THIN ORCHESTRATOR)               │   │
│  │  - Sources generated scripts                              │   │
│  │  - curl|bash: downloads libs+generated then sources them   │   │
│  │  - Handles phases, user normalization, filesystem         │   │
│  │  - Calls: install_lang_bun, install_agents_claude, etc.   │   │
│  │  - NO module-specific installation logic                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   scripts/lib/*.sh                        │   │
│  │  - Shared utilities (logging, security, run_as_target)    │   │
│  │  - Used by both install.sh and generated scripts          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Alternative Approaches Considered

| Approach | Pros | Cons | Verdict |
|----------|------|------|---------|
| **Pre-generate + source** (chosen) | Simple, debuggable, works offline, committed to git | Must regenerate when manifest changes | ✅ Best |
| **Runtime generation** | Always in sync | Needs bun on target before installation, chicken-egg problem | ❌ |
| **Bash reads YAML directly** | No generation step | Bash YAML parsing is painful, need to bundle parser | ❌ |
| **Transpile to single file** | Single artifact | Loses modularity, harder to debug | ❌ |

---

## Environment Contract

Generated scripts have a strict contract with install.sh. This contract MUST be documented and enforced.

### curl|bash Bootstrapping (No Local Checkout)

When users run ACFS via `curl … | bash`, there is **no local repository checkout**, so `SCRIPT_DIR` may be empty. In that mode, the orchestrator must:

1. Determine a local bootstrap directory (e.g., `/tmp/acfs-bootstrap-*` initially, then optionally mirror into `$ACFS_HOME/scripts/` once `$ACFS_HOME` exists).
2. Download the **runtime libraries** (`scripts/lib/*.sh`) and **generated installers** (`scripts/generated/*.sh`) from `ACFS_RAW` into that directory.
3. `source` those local paths (never `source <(curl …)`).

Generated scripts must assume they are being sourced from **local files** (either from a git checkout or from a bootstrap download directory).

### Required Environment Variables

Generated scripts expect these variables to be set by install.sh BEFORE sourcing:

```bash
# User context
TARGET_USER="ubuntu"              # User to install for
TARGET_HOME="/home/ubuntu"        # Home directory of target user
ACFS_HOME="/home/ubuntu/.acfs"    # ACFS configuration directory

# Execution context
MODE="vibe"                       # vibe | safe
DRY_RUN="false"                   # true | false
SUDO="sudo"                       # sudo command (empty if root)

# Remote source location (required when SCRIPT_DIR is empty)
ACFS_RAW="https://raw.githubusercontent.com/<owner>/<repo>/main"

# Paths (local checkout vs curl|bash)
SCRIPT_DIR="/path/to/installer"         # Directory containing install.sh (may be empty under curl|bash)
ACFS_BOOTSTRAP_DIR="/tmp/acfs-bootstrap" # Local dir containing downloaded scripts when SCRIPT_DIR is empty
ACFS_LIB_DIR="$ACFS_BOOTSTRAP_DIR/scripts/lib"
ACFS_GENERATED_DIR="$ACFS_BOOTSTRAP_DIR/scripts/generated"
```

### Required Functions

Generated scripts expect these functions to be available (from scripts/lib/*.sh):

```bash
# Logging (from scripts/lib/logging.sh)
log_step "1/10" "Message"         # Phase progress
log_detail "Message"              # Indented detail
log_success "Message"             # Green success
log_warn "Message"                # Yellow warning
log_error "Message"               # Red error

# Execution (provided by install.sh or a small scripts/lib helper)
run_as_target <command>           # Run command as TARGET_USER
run_as_target_shell "<cmd>"       # Run a shell string as TARGET_USER (supports pipes/heredocs)
command_exists_as_target <cmd>    # Check command exists in TARGET_USER environment
command_exists <cmd>              # Check if command is in PATH

# Module filtering (from scripts/lib/install_helpers.sh)
should_run_module "<id>" "<phase>"

# Assets / fetching (from install.sh or scripts/lib/security.sh)
acfs_curl <args...>               # Curl wrapper enforcing HTTPS where possible
install_asset "<rel>" "<dest>"    # Copy from local checkout or download from ACFS_RAW

# Security (from scripts/lib/security.sh)
acfs_run_verified_upstream_script_as_target "<tool>" "<runner>" [args...]
acfs_run_verified_upstream_script_as_root "<tool>" "<runner>" [args...]
acfs_run_verified_upstream_script_as_current "<tool>" "<runner>" [args...]
```

### Contract Validation

Generator will produce a header that validates the contract:

```bash
# Generated script header
_acfs_validate_contract() {
    local missing=()
    [[ -z "${TARGET_USER:-}" ]] && missing+=("TARGET_USER")
    [[ -z "${TARGET_HOME:-}" ]] && missing+=("TARGET_HOME")
    [[ -z "${MODE:-}" ]] && missing+=("MODE")

    # Under curl|bash, install.sh must set ACFS_RAW and download generated scripts locally.
    if [[ -z "${SCRIPT_DIR:-}" ]]; then
        [[ -z "${ACFS_RAW:-}" ]] && missing+=("ACFS_RAW")
        [[ -z "${ACFS_LIB_DIR:-}" ]] && missing+=("ACFS_LIB_DIR")
        [[ -z "${ACFS_GENERATED_DIR:-}" ]] && missing+=("ACFS_GENERATED_DIR")
    fi

    if ! declare -f log_detail >/dev/null 2>&1; then
        missing+=("log_detail function")
    fi
    if ! declare -f run_as_target >/dev/null 2>&1; then
        missing+=("run_as_target function")
    fi
    if ! declare -f run_as_target_shell >/dev/null 2>&1; then
        missing+=("run_as_target_shell function")
    fi
    if ! declare -f run_as_root_shell >/dev/null 2>&1; then
        missing+=("run_as_root_shell function")
    fi
    if ! declare -f run_as_current_shell >/dev/null 2>&1; then
        missing+=("run_as_current_shell function")
    fi

    if [[ ${#missing[@]} -gt 0 ]]; then
        echo "ERROR: Generated script contract violation!" >&2
        echo "Missing: ${missing[*]}" >&2
        echo "Fix: install.sh must source scripts/lib/*.sh, set environment vars, and only then source scripts/generated/*.sh" >&2
        return 1
    fi
}
_acfs_validate_contract || return 1
```

---

## Description-Only Modules Strategy

Some manifest modules have "description" install commands rather than actual bash:

```yaml
# PROBLEM: This is a description, not a command
- id: users.ubuntu
  install:
    - "Ensure user ubuntu exists with home /home/ubuntu"
    - "Write /etc/sudoers.d/90-ubuntu-acfs: ubuntu ALL=(ALL) NOPASSWD:ALL"
```

### Detection Heuristic

```typescript
function isDescription(cmd: string): boolean {
  const trimmed = cmd.trim();

  // Starts with quoted text
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) return true;

  // Starts with capital letter followed by lowercase (sentence case)
  if (/^[A-Z][a-z]/.test(trimmed)) return true;

  // Contains prose-like patterns
  if (/\b(Ensure|Install|Create|Write|Copy|Add|Set up)\b/i.test(trimmed)) {
    // But not if it looks like a command
    if (!/^(sudo|apt|curl|git|chmod|chown|mkdir|cp|mv|ln|cat|echo)/.test(trimmed)) {
      return true;
    }
  }

  return false;
}
```

### Handling Options

| Strategy | When to Use | Example |
|----------|-------------|---------|
| `generated: false` | Complex orchestration that can't be scripted | users.ubuntu |
| Convert to commands | Simple actions that can be expressed as bash | base.filesystem |
| `# TODO:` comment | Placeholder for manual implementation | tools.vault |

**Important:** Heuristics should be used for **warnings and validation**, not as silent behavior changes. A module should only skip generation when it explicitly sets `generated: false`.

### Schema Addition

```yaml
- id: users.ubuntu
  description: User normalization
  generated: false  # NEW: Skip generation, handled by install.sh orchestration
  install:
    - "Ensure user ubuntu exists"
  verify:
    - id ubuntu
```

### Generator Behavior

```typescript
function shouldGenerateModule(module: Module): boolean {
  // Explicit opt-out
  if (module.generated === false) return false;

  // Fail fast: a generated module must have at least one executable install step
  if (module.install.every(isDescription)) {
    throw new Error(
      `Module ${module.id} has no executable install commands. ` +
      `Either provide real commands or set generated: false.`
    );
  }

  // Warn if any install step looks like prose (helps keep manifest clean)
  if (module.install.some(isDescription)) {
    console.warn(
      `Warning: module ${module.id} contains description-like install steps. ` +
      `Prefer real commands or mark generated: false.`
    );
  }

  return true;
}
```

---

## Function Name Collision Prevention

### The Problem

Module IDs are converted to function names:
- `lang.bun` → `install_lang_bun`
- `lang_bun` → `install_lang_bun` (COLLISION!)

### The Solution

Add validation in generator:

```typescript
function validateFunctionNames(modules: Module[]): void {
  const functionNames = new Map<string, string>(); // funcName -> moduleId

  for (const module of modules) {
    const funcName = toFunctionName(module.id);

    if (functionNames.has(funcName)) {
      const existingId = functionNames.get(funcName);
      throw new Error(
        `Function name collision: "${funcName}" generated by both ` +
        `"${existingId}" and "${module.id}". ` +
        `Rename one of these modules to avoid collision.`
      );
    }

    functionNames.set(funcName, module.id);
  }
}

function toFunctionName(moduleId: string): string {
  // Replace dots with underscores, ensure valid bash function name
  return `install_${moduleId.replace(/\./g, '_').replace(/[^a-z0-9_]/g, '')}`;
}
```

### Manifest Schema Validation

Also prevent collisions at schema level:

```typescript
// In parser.ts
function validateNoDuplicateFunctionNames(manifest: Manifest): ValidationResult {
  const errors: string[] = [];
  const funcNames = new Map<string, string>();

  for (const module of manifest.modules) {
    const funcName = toFunctionName(module.id);
    if (funcNames.has(funcName)) {
      errors.push(
        `Module "${module.id}" would generate function "${funcName}" ` +
        `which collides with module "${funcNames.get(funcName)}"`
      );
    }
    funcNames.set(funcName, module.id);
  }

  return errors.length > 0
    ? { success: false, errors }
    : { success: true };
}
```

---

## DRY_RUN Mode in Generated Scripts

Generated scripts must respect DRY_RUN mode for testing:

### Generated Function Pattern

```bash
install_lang_bun() {
    local module_id="lang.bun"

    # Installed check (runs even in dry-run to show current state)
    if run_as_target_shell "command -v bun >/dev/null 2>&1"; then
        log_detail "$module_id already installed, skipping"
        return 0
    fi

    # DRY_RUN check
    if [[ "${DRY_RUN:-false}" == "true" ]]; then
        log_detail "dry-run: would install $module_id"
        log_detail "dry-run: would run: acfs_run_verified_upstream_script_as_target bun bash"
        return 0
    fi

    log_detail "Installing $module_id"

    # Actual installation
    acfs_run_verified_upstream_script_as_target "bun" "bash"

    # Verification
    if ! run_as_target_shell "bun --version >/dev/null 2>&1"; then
        log_error "$module_id verification failed"
        return 1
    fi

    log_success "$module_id installed"
}
```

### Generator Code

```typescript
function generateModuleFunction(module: Module): string {
  const lines: string[] = [];
  const funcName = toFunctionName(module.id);

  lines.push(`${funcName}() {`);
  lines.push(`    local module_id="${module.id}"`);

  // Installed check (always runs; run_as-aware)
  if (module.installed_check) {
    const check = module.installed_check;
    const checkRunner = check.run_as === 'target_user'
      ? 'run_as_target_shell'
      : check.run_as === 'root'
        ? 'run_as_root_shell'
        : 'run_as_current_shell';
    lines.push(`    if ${checkRunner} "${escapeBashForDoubleQuotes(check.command)} >/dev/null 2>&1"; then`);
    lines.push(`        log_detail "$module_id already installed, skipping"`);
    lines.push(`        return 0`);
    lines.push(`    fi`);
  }

  // DRY_RUN check
  lines.push(`    if [[ "\${DRY_RUN:-false}" == "true" ]]; then`);
  lines.push(`        log_detail "dry-run: would install $module_id"`);
  if (module.verified_installer) {
    lines.push(
      `        log_detail "dry-run: would run: acfs_run_verified_upstream_script_as_target ${module.verified_installer.tool} ${module.verified_installer.runner}"`
    );
  } else {
    for (const cmd of module.install) {
      if (!isDescription(cmd)) {
        lines.push(`        log_detail "dry-run: would run: ${escapeBashForLog(cmd)}"`);
      }
    }
  }
  lines.push(`        return 0`);
  lines.push(`    fi`);

  // ... rest of installation
}
```

---

## Individual Module Testing

### New CLI Arguments for install.sh

```bash
# Install only specific module(s)
./install.sh --only lang.bun
./install.sh --only lang.bun,lang.uv,lang.rust

# Install only specific phase(s)
./install.sh --only-phase 6
./install.sh --only-phase 6,7,8

# Skip specific module(s)
./install.sh --skip stack.slb
./install.sh --skip stack.slb,stack.caam

# List available modules
./install.sh --list-modules

# Show what would be installed (combines with --only/--skip)
./install.sh --dry-run --only lang.bun
```

### Implementation in install.sh

```bash
# Argument parsing
ONLY_MODULES=()
ONLY_PHASES=()
SKIP_MODULES=()

parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --only)
                IFS=',' read -ra ONLY_MODULES <<< "$2"
                shift 2
                ;;
            --only-phase)
                IFS=',' read -ra ONLY_PHASES <<< "$2"
                shift 2
                ;;
            --skip)
                IFS=',' read -ra SKIP_MODULES <<< "$2"
                shift 2
                ;;
            --list-modules)
                list_all_modules
                exit 0
                ;;
            # ... other args
        esac
    done
}

# Check if module should run
should_run_module() {
    local module_id="$1"
    local phase="$2"

    # Skip if in skip list
    for skip in "${SKIP_MODULES[@]}"; do
        [[ "$module_id" == "$skip" ]] && return 1
    done

    # If --only specified, only run those
    if [[ ${#ONLY_MODULES[@]} -gt 0 ]]; then
        for only in "${ONLY_MODULES[@]}"; do
            [[ "$module_id" == "$only" ]] && return 0
        done
        return 1
    fi

    # If --only-phase specified, only run those phases
    if [[ ${#ONLY_PHASES[@]} -gt 0 ]]; then
        for only_phase in "${ONLY_PHASES[@]}"; do
            [[ "$phase" == "$only_phase" ]] && return 0
        done
        return 1
    fi

    return 0
}
```

### Generated Module Functions Support

```bash
install_lang_bun() {
    local module_id="lang.bun"
    local module_phase="6"

    # Check if this module should run
    if ! should_run_module "$module_id" "$module_phase"; then
        log_detail "$module_id skipped (filtered)"
        return 0
    fi

    # ... rest of function
}
```

---

## Phase 1: Gap Analysis & Inventory

### 1.1 What install.sh Does That Manifest Doesn't Cover

| Capability | In install.sh | In Manifest | Gap |
|------------|---------------|-------------|-----|
| User normalization (root→ubuntu) | ✅ Full logic | ❌ Description only | LARGE |
| SSH key migration | ✅ Full logic | ❌ Not mentioned | LARGE |
| Sudoers configuration | ✅ Full logic | ❌ Description only | LARGE |
| Filesystem setup (/data/projects) | ✅ Full logic | ✅ Added | SMALL |
| Run as target user | ✅ `run_as_target` | ❌ No concept | LARGE |
| Verified upstream installers | ✅ `acfs_run_verified_upstream_script_as_target` | ❌ Just curl|bash | LARGE |
| Dry-run mode | ✅ Full support | ❌ No concept | MEDIUM |
| Mode (vibe vs safe) | ✅ Full support | ✅ In defaults | SMALL |
| Phase orchestration | ✅ 10 phases | ✅ Comments only | MEDIUM |
| Logging with gum | ✅ Full support | ❌ No concept | MEDIUM |
| Optional tool handling | ✅ `|| true` patterns | ⚠️ Implicit | SMALL |
| Checkpointing | ✅ `command_exists` checks | ❌ No concept | MEDIUM |

### 1.2 Tasks for Phase 1

- [ ] **1.1.1** Create detailed mapping of every install.sh function to manifest modules
- [ ] **1.1.2** Identify which install.sh functions are "orchestration" vs "module installation"
- [ ] **1.1.3** Document all `run_as_target` usages and which modules need it
- [ ] **1.1.4** Document all `acfs_run_verified_upstream_script_as_target` usages
- [ ] **1.1.5** Audit checksums.yaml for completeness against manifest modules
- [ ] **1.1.6** Identify all description-only modules and decide: `generated: false` or convert to commands

**Deliverable:** `docs/manifest-gap-analysis.md` with complete mapping

---

## Phase 2: Enhance Manifest Schema

### 2.1 New Schema Fields

```yaml
# Enhanced module schema
modules:
  - id: lang.bun
    description: Bun runtime for JS tooling

    # NEW: Execution context
    run_as: target_user          # target_user | root | current

    # NEW: Verified installer reference
    verified_installer:
      tool: bun                  # Key in checksums.yaml
      runner: bash               # Executable (install.sh adds '-s --')
      args: []                   # Extra args passed to the upstream installer script

    # NEW: Installation behavior
    optional: false              # If true, failure is warning not error
    installed_check:
      run_as: target_user
      command: "command -v bun"  # Skip if this succeeds (always runs, even in --dry-run)
    generated: true              # NEW: false to skip generation (orchestration-only)

    # NEW: Phase assignment (for ordering)
    phase: 6                     # Maps to install.sh phases 1-10

    # Install commands (shell strings).
    # Generator must execute these via run_as_*_shell (supports pipes/heredocs).
    install: []
    verify:
      - "bun --version"

    # NEW: Dependencies (for topological sort)
    dependencies:
      - base.system
```

### 2.2 Schema Changes in Zod

```typescript
// packages/manifest/src/schema.ts additions

export const ModuleSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$/),
  description: z.string(),

  // Execution context
  run_as: z.enum(['target_user', 'root', 'current']).default('target_user'),

  // Verified installer
  verified_installer: z.object({
    tool: z.string(),           // Key in checksums.yaml
    runner: z.string(),         // e.g., "bash", "sh" (install.sh supplies -s --)
    args: z.array(z.string()).default([]),
  }).optional(),

  // Installation behavior
  optional: z.boolean().default(false),
  installed_check: z.object({
    run_as: z.enum(['target_user', 'root', 'current']).default('target_user'),
    command: z.string(),
  }).optional(),
  generated: z.boolean().default(true),     // NEW: false to skip generation

  // Phase for ordering
  phase: z.number().int().min(1).max(10).optional(),

  // Install steps are shell strings (executed via run_as_*_shell).
  // Allow empty when verified_installer is provided.
  install: z.array(z.string()).default([]),
  verify: z.array(z.string()).min(1),
  dependencies: z.array(z.string()).optional(),
  notes: z.array(z.string()).optional(),
}).refine((m) => (m.generated === false) || (m.verified_installer != null) || (m.install.length > 0), {
  message: "Module must define verified_installer or install commands (or set generated: false).",
});
```

### 2.3 Phase + Dependency Ordering Rules

We have **two ordering concepts** and they must not conflict:

- **Phase** is the primary execution grouping: install.sh runs phases `1..10` in order.
- **Dependencies** are for ordering *within a phase* and for enforcing prerequisites across phases.

Rules:

1. A module may only depend on modules in the **same phase or an earlier phase**.
2. The generator must validate that all dependencies exist.
3. Within a phase, the generator must topologically sort modules using `dependencies` (stable by manifest order for ties).
4. If a dependency would require “future phase first” (dependency.phase > module.phase), that is a manifest error.

### 2.3 Tasks for Phase 2

- [ ] **2.1.1** Update `packages/manifest/src/schema.ts` with new fields
- [ ] **2.1.2** Update `packages/manifest/src/types.ts` with TypeScript types
- [ ] **2.1.3** Update `packages/manifest/src/parser.ts` to validate new fields
- [ ] **2.1.4** Add function name collision validation to parser
- [ ] **2.2.1** Migrate all 50+ modules in `acfs.manifest.yaml` to new schema
- [ ] **2.2.2** Add `verified_installer` to all curl|bash modules
- [ ] **2.2.3** Add `run_as: target_user` to user-space modules
- [ ] **2.2.4** Add `installed_check` to all modules (with correct run_as)
- [ ] **2.2.5** Assign `phase` numbers to all modules
- [ ] **2.2.6** Mark orchestration-only modules with `generated: false`
- [ ] **2.3.1** Validate dependency+phase rules (no future-phase deps, deps exist)
- [ ] **2.3.2** Validate manifest against checksums.yaml (all verified_installers have checksums)

**Deliverable:** Enhanced manifest schema + fully migrated acfs.manifest.yaml

---

## Phase 3: Enhance Generator

### 3.1 Generated Script Structure

Each generated `install_<category>.sh` will contain:

```bash
#!/usr/bin/env bash
# AUTO-GENERATED FROM acfs.manifest.yaml - DO NOT EDIT
# Regenerate: bun run --filter @acfs/manifest generate
# Generated: 2025-12-21T12:00:00Z

# ============================================================
# Environment Contract Validation
# ============================================================
_acfs_validate_contract() {
    local missing=()
    [[ -z "${TARGET_USER:-}" ]] && missing+=("TARGET_USER")
    [[ -z "${TARGET_HOME:-}" ]] && missing+=("TARGET_HOME")
    [[ -z "${MODE:-}" ]] && missing+=("MODE")

    if ! declare -f log_detail >/dev/null 2>&1; then
        missing+=("log_detail function")
    fi
    if ! declare -f run_as_target >/dev/null 2>&1; then
        missing+=("run_as_target function")
    fi
    if ! declare -f should_run_module >/dev/null 2>&1; then
        missing+=("should_run_module function")
    fi

    if [[ ${#missing[@]} -gt 0 ]]; then
        echo "ERROR: Generated script contract violation!" >&2
        echo "Missing: ${missing[*]}" >&2
        return 1
    fi
}
_acfs_validate_contract || return 1

# ============================================================
# Module: lang.bun
# Phase: 6
# ============================================================
install_lang_bun() {
    local module_id="lang.bun"
    local module_phase="6"

    # Check if this module should run (--only/--skip filtering)
    if ! should_run_module "$module_id" "$module_phase"; then
        log_detail "$module_id skipped (filtered)"
        return 0
    fi

    # Installed check (always runs; uses target user's PATH)
    if run_as_target_shell "command -v bun >/dev/null 2>&1"; then
        log_detail "$module_id already installed, skipping"
        return 0
    fi

    # Dry-run mode
    if [[ "${DRY_RUN:-false}" == "true" ]]; then
        log_detail "dry-run: would install $module_id"
        log_detail "dry-run: would run: acfs_run_verified_upstream_script_as_target bun bash"
        return 0
    fi

    log_detail "Installing $module_id"

    # Verified upstream installer (install.sh supplies '-s --')
    acfs_run_verified_upstream_script_as_target "bun" "bash"

    # Verify installation
    if ! run_as_target_shell "bun --version >/dev/null 2>&1"; then
        log_error "$module_id verification failed"
        return 1
    fi

    log_success "$module_id installed"
}

# ... more modules ...

# Category installer (calls all modules in phase order)
install_lang() {
    install_lang_bun
    install_lang_uv
    install_lang_rust
    install_lang_go
}
```

### 3.2 Generator Enhancements

```typescript
// packages/manifest/src/generate.ts enhancements

function generateModuleFunction(module: Module): string {
  const lines: string[] = [];
  const funcName = toFunctionName(module.id);

  lines.push(`# Module: ${module.id}`);
  lines.push(`# Phase: ${module.phase ?? 'unassigned'}`);
  lines.push(`${funcName}() {`);
  lines.push(`    local module_id="${module.id}"`);
  lines.push(`    local module_phase="${module.phase ?? 0}"`);

  // Module filtering (--only/--skip)
  lines.push(`    if ! should_run_module "$module_id" "$module_phase"; then`);
  lines.push(`        log_detail "$module_id skipped (filtered)"`);
  lines.push(`        return 0`);
  lines.push(`    fi`);

  // Installed check (always runs, even in dry-run)
  if (module.installed_check) {
    const check = module.installed_check;
    const checkRunner = check.run_as === 'target_user'
      ? 'run_as_target_shell'
      : check.run_as === 'root'
        ? 'run_as_root_shell'
        : 'bash -lc';
    lines.push(`    if ${checkRunner} "${escapeBashForDoubleQuotes(check.command)} >/dev/null 2>&1"; then`);
    lines.push(`        log_detail "$module_id already installed, skipping"`);
    lines.push(`        return 0`);
    lines.push(`    fi`);
  }

  // Dry-run mode
  lines.push(`    if [[ "\${DRY_RUN:-false}" == "true" ]]; then`);
  lines.push(`        log_detail "dry-run: would install $module_id"`);
  for (const cmd of module.install) {
    if (!isDescription(cmd)) {
      lines.push(`        log_detail "dry-run: would run: ${escapeBashForLog(cmd)}"`);
    }
  }
  lines.push(`        return 0`);
  lines.push(`    fi`);

  lines.push(`    log_detail "Installing $module_id"`);

  // Handle verified installers
  if (module.verified_installer) {
    const { tool, runner, args } = module.verified_installer;
    if (module.run_as === 'target_user') {
      lines.push(`    acfs_run_verified_upstream_script_as_target "${tool}" "${runner}" ${args.map(escapeForBash).join(' ')}`.trimEnd());
    } else if (module.run_as === 'root') {
      lines.push(`    acfs_run_verified_upstream_script_as_root "${tool}" "${runner}" ${args.map(escapeForBash).join(' ')}`.trimEnd());
    } else {
      lines.push(`    acfs_run_verified_upstream_script_as_current "${tool}" "${runner}" ${args.map(escapeForBash).join(' ')}`.trimEnd());
    }
  } else {
    // Regular install commands
    for (const cmd of module.install) {
      if (isDescription(cmd)) {
        lines.push(`    # TODO: ${cmd}`);
      } else if (module.run_as === 'target_user') {
        // Always execute install strings as shell commands (supports pipes/heredocs).
        lines.push(`    run_as_target_shell << 'ACFS_EOF_${module.id.replace(/[^a-z0-9]/gi, '_')}'`);
        lines.push(cmd);
        lines.push(`ACFS_EOF_${module.id.replace(/[^a-z0-9]/gi, '_')}`);
      } else {
        lines.push(`    bash -lc ${escapeForBash(cmd)}`);
      }
    }
  }

  // Verification
  lines.push(`    # Verify`);
  for (const verify of module.verify) {
    const verifyCmd = module.run_as === 'target_user'
      ? `run_as_target ${verify}`
      : verify;

    if (module.optional) {
      lines.push(`    ${verifyCmd} || log_warn "$module_id verification skipped"`);
    } else {
      lines.push(`    ${verifyCmd} || { log_error "$module_id verification failed"; return 1; }`);
    }
  }

  lines.push(`    log_success "$module_id installed"`);
  lines.push(`}`);

  return lines.join('\n');
}
```

### 3.3 Tasks for Phase 3

- [ ] **3.1.1** Add `generateModuleFunction()` with run_as support
- [ ] **3.1.2** Add `generateVerifiedInstallerCall()` for checksummed installers
- [ ] **3.1.3** Add idempotent check generation
- [ ] **3.1.4** Add optional module handling (warn vs error)
- [ ] **3.1.5** Add DRY_RUN mode support
- [ ] **3.1.6** Add module filtering support (--only/--skip)
- [ ] **3.2.1** Generate contract validation header
- [ ] **3.2.2** Generate module functions that use `run_as_target` correctly
- [ ] **3.2.3** Generate category functions that call modules in phase order
- [ ] **3.2.4** Skip modules with `generated: false`
- [ ] **3.3.1** Add function name collision detection (fail-fast)
- [ ] **3.3.2** Add `--validate` flag to generator (check manifest against checksums.yaml)
- [ ] **3.3.3** Add `--diff` flag to show what would change in generated scripts
- [ ] **3.3.4** Add timestamp and version to generated file headers

**Deliverable:** Enhanced generator that produces install.sh-compatible scripts

---

## Phase 4: Refactor install.sh

### 4.1 New install.sh Structure

**Critical:** install.sh must support both:

- **Local checkout:** `SCRIPT_DIR` points at a repo clone; `scripts/lib` and `scripts/generated` are available on disk.
- **curl|bash:** no checkout; install.sh must download `scripts/lib/*.sh` and `scripts/generated/*.sh` from `ACFS_RAW` into a local bootstrap directory, then `source` those local files.

```bash
#!/usr/bin/env bash
# ACFS Installer - Orchestration Layer
# Module installation logic is generated from acfs.manifest.yaml

set -euo pipefail

# SCRIPT_DIR is empty when running via curl|bash (BASH_SOURCE may be unset)
if [[ -n "${BASH_SOURCE[0]:-}" ]]; then
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
else
  SCRIPT_DIR=""
fi

bootstrap_sources_if_needed() {
  if [[ -n "$SCRIPT_DIR" ]]; then
    export ACFS_LIB_DIR="$SCRIPT_DIR/scripts/lib"
    export ACFS_GENERATED_DIR="$SCRIPT_DIR/scripts/generated"
    return 0
  fi

  # curl|bash mode: download libs + generated scripts locally, then source those paths.
  : "${ACFS_RAW:?ACFS_RAW must be set when running via curl|bash}"
  ACFS_BOOTSTRAP_DIR="${ACFS_BOOTSTRAP_DIR:-/tmp/acfs-bootstrap-$(date +%s)}"
  export ACFS_LIB_DIR="$ACFS_BOOTSTRAP_DIR/scripts/lib"
  export ACFS_GENERATED_DIR="$ACFS_BOOTSTRAP_DIR/scripts/generated"
  mkdir -p "$ACFS_LIB_DIR" "$ACFS_GENERATED_DIR"

  # Download required libs + generated scripts (never source from process substitution).
  # Example:
  #   curl -fsSL "$ACFS_RAW/scripts/lib/logging.sh" -o "$ACFS_LIB_DIR/logging.sh"
  #   curl -fsSL "$ACFS_RAW/scripts/generated/install_lang.sh" -o "$ACFS_GENERATED_DIR/install_lang.sh"
}

bootstrap_sources_if_needed

# ============================================================
# Source libraries (order matters!)
# ============================================================
source "$ACFS_LIB_DIR/logging.sh"
source "$ACFS_LIB_DIR/security.sh"
source "$ACFS_LIB_DIR/install_helpers.sh"  # NEW: filtering + run_as_*_shell helpers

# ============================================================
# Source GENERATED module installers
# ============================================================
source "$ACFS_GENERATED_DIR/install_base.sh"
source "$ACFS_GENERATED_DIR/install_users.sh"
source "$ACFS_GENERATED_DIR/install_shell.sh"
source "$ACFS_GENERATED_DIR/install_cli.sh"
source "$ACFS_GENERATED_DIR/install_lang.sh"
source "$ACFS_GENERATED_DIR/install_agents.sh"
source "$ACFS_GENERATED_DIR/install_cloud.sh"
source "$ACFS_GENERATED_DIR/install_stack.sh"
source "$ACFS_GENERATED_DIR/install_acfs.sh"

# ============================================================
# Orchestration (NOT generated - hand-maintained)
# ============================================================

main() {
    parse_args "$@"
    detect_environment

    # Phase 1: Base dependencies
    log_step "1/10" "Checking base dependencies..."
    install_base_system  # FROM GENERATED

    # Phase 2: User normalization (complex orchestration, stays here)
    log_step "2/10" "Normalizing user account..."
    normalize_user  # Hand-maintained (too complex for manifest)

    # Phase 3: Filesystem setup
    log_step "3/10" "Setting up filesystem..."
    install_base_filesystem  # FROM GENERATED

    # Phase 4: Shell setup
    log_step "4/10" "Setting up shell..."
    install_shell  # FROM GENERATED (shell.zsh, cli.modern)

    # Phase 5: CLI tools
    log_step "5/10" "Installing CLI tools..."
    install_cli  # FROM GENERATED

    # Phase 6: Language runtimes
    log_step "6/10" "Installing language runtimes..."
    install_lang  # FROM GENERATED (bun, uv, rust, go, atuin, zoxide)

    # Phase 7: Coding agents
    log_step "7/10" "Installing coding agents..."
    install_agents  # FROM GENERATED (claude, codex, gemini)

    # Phase 8: Cloud & database tools
    log_step "8/10" "Installing cloud & database tools..."
    install_cloud  # FROM GENERATED (vault, postgres, wrangler, supabase, vercel)

    # Phase 9: Dicklesworthstone stack
    log_step "9/10" "Installing Dicklesworthstone stack..."
    install_stack  # FROM GENERATED (ntm, mcp_agent_mail, ubs, bv, cass, cm, caam, slb)

    # Phase 10: Finalization
    log_step "10/10" "Finalizing installation..."
    install_acfs  # FROM GENERATED (onboard, doctor)
    finalize      # Hand-maintained (tmux config, smoke test)
}
```

### 4.2 New scripts/lib/install_helpers.sh

```bash
#!/usr/bin/env bash
# Install helpers - module filtering and command execution helpers

# Module filtering arrays (set by parse_args)
ONLY_MODULES=()
ONLY_PHASES=()
SKIP_MODULES=()

# Run a shell string as the target user (supports pipes/heredocs)
run_as_target_shell() {
    local cmd="${1:-}"
    if [[ -n "$cmd" ]]; then
        run_as_target bash -lc "set -o pipefail; $cmd"
    else
        # stdin mode (for heredocs)
        run_as_target bash -lc "set -o pipefail; bash -s" < /dev/stdin
    fi
}

# Run a shell string as root (install.sh usually ensures we're root already)
run_as_root_shell() {
    local cmd="${1:-}"
    if [[ -n "$cmd" ]]; then
        if [[ "$EUID" -eq 0 ]]; then
            bash -lc "set -o pipefail; $cmd"
        else
            $SUDO bash -lc "set -o pipefail; $cmd"
        fi
    else
        if [[ "$EUID" -eq 0 ]]; then
            bash -lc "set -o pipefail; bash -s" < /dev/stdin
        else
            $SUDO bash -lc "set -o pipefail; bash -s" < /dev/stdin
        fi
    fi
}

# Run a shell string as the current user
run_as_current_shell() {
    local cmd="${1:-}"
    if [[ -n "$cmd" ]]; then
        bash -lc "set -o pipefail; $cmd"
    else
        bash -lc "set -o pipefail; bash -s" < /dev/stdin
    fi
}

# Check if a command exists in the target user's environment
command_exists_as_target() {
    local cmd="$1"
    run_as_target bash -lc "command -v '$cmd' >/dev/null 2>&1"
}

# Check if a module should run based on --only/--skip flags
should_run_module() {
    local module_id="$1"
    local phase="${2:-0}"

    # Skip if in skip list
    for skip in "${SKIP_MODULES[@]}"; do
        [[ "$module_id" == "$skip" ]] && return 1
    done

    # If --only-modules specified, only run those
    if [[ ${#ONLY_MODULES[@]} -gt 0 ]]; then
        for only in "${ONLY_MODULES[@]}"; do
            [[ "$module_id" == "$only" ]] && return 0
        done
        return 1
    fi

    # If --only-phase specified, only run those phases
    if [[ ${#ONLY_PHASES[@]} -gt 0 ]]; then
        for only_phase in "${ONLY_PHASES[@]}"; do
            [[ "$phase" == "$only_phase" ]] && return 0
        done
        return 1
    fi

    return 0
}

# List all available modules (for --list-modules)
list_all_modules() {
    echo "Available modules:"
    echo ""
    # This will be generated to include all module IDs
    cat << 'EOF'
Phase 1: base.system
Phase 2: users.ubuntu (orchestration-only)
Phase 3: base.filesystem
Phase 4: shell.zsh
Phase 5: cli.modern
Phase 6: lang.bun, lang.uv, lang.rust, lang.go, tools.atuin, tools.zoxide
Phase 7: agents.claude, agents.codex, agents.gemini
Phase 8: tools.vault, db.postgres18, cloud.wrangler, cloud.supabase, cloud.vercel
Phase 9: stack.ntm, stack.mcp_agent_mail, stack.ultimate_bug_scanner, stack.beads_viewer, stack.cass, stack.cm, stack.caam, stack.slb
Phase 10: acfs.onboard, acfs.doctor
EOF
}
```

### 4.3 What Stays in install.sh (Hand-Maintained)

| Function | Reason |
|----------|--------|
| `parse_args` | CLI argument parsing |
| `detect_environment` | OS detection, variable setup |
| `normalize_user` | Complex root→ubuntu logic, SSH key migration |
| `finalize` | Tmux config, smoke test, final messaging |
| `run_as_target` | Utility function used by generated scripts |
| `acfs_run_verified_upstream_script_as_target` | Security wrapper |
| `install_gum_early` | Bootstrap UI before other tools |

### 4.4 What Moves to Generated Scripts

All module installation logic:
- `install_bun`, `install_uv`, `install_rust`, `install_go`
- `install_claude`, `install_codex`, `install_gemini`
- `install_ntm`, `install_slb`, `install_ubs`, etc.
- `install_postgres`, `install_vault`
- `install_zsh`, `install_ohmyzsh`

### 4.5 Tasks for Phase 4

- [ ] **4.1.1** Extract shared functions to `scripts/lib/` (run_as_target, etc.)
- [ ] **4.1.2** Create `scripts/lib/install_helpers.sh` with module filtering
- [ ] **4.1.3** Add --only, --skip, --only-phase, --list-modules to parse_args
- [ ] **4.2.1** Add `source` statements for generated scripts in install.sh
- [ ] **4.2.2** Replace inline module installation with calls to generated functions
- [ ] **4.2.3** Keep orchestration logic (phases, user normalization, finalization)
- [ ] **4.3.1** Test that sourcing works correctly
- [ ] **4.3.2** Ensure generated function names don't conflict with existing
- [ ] **4.4.1** Add CI check that generated scripts are up-to-date with manifest

**Deliverable:** Refactored install.sh that sources generated scripts

---

## Phase 5: Testing & Validation

### 5.1 Test Matrix

| Test | Method | Pass Criteria |
|------|--------|---------------|
| Generator produces valid bash | `shellcheck scripts/generated/*.sh` | No errors |
| Generated scripts source correctly | `bash -c 'source scripts/generated/install_lang.sh'` (with mocked contract) | No strict-mode leaks, no top-level side effects |
| Contract validation works | Source without env | Error message shown |
| DRY_RUN mode works | `./install.sh --dry-run` | No actual installation |
| --only filtering works | `./install.sh --only lang.bun` | Only bun installed |
| --skip filtering works | `./install.sh --skip stack.slb` | slb skipped |
| Full installation (Ubuntu 24.04) | Docker test | Smoke test passes |
| Full installation (Ubuntu 25.04) | Docker test | Smoke test passes |
| Idempotent re-run | Run installer twice | No errors, same result |
| Doctor checks align | `acfs doctor` | All checks pass |
| Manifest→Generated sync | CI check | Generated matches manifest |

### 5.2 CI Integration

```yaml
# .github/workflows/manifest-sync.yml
name: Manifest Sync Check

on: [push, pull_request]

jobs:
  check-generated:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Generate scripts from manifest
        run: bun run --filter @acfs/manifest generate

      - name: Check for uncommitted changes
        run: |
          git diff --exit-code -- scripts/generated/ || {
            echo "Generated scripts are out of sync with manifest!"
            echo "Run: bun run --filter @acfs/manifest generate"
            git diff -- scripts/generated/
            exit 1
          }

      - name: Run shellcheck on generated scripts
        run: |
          shellcheck scripts/lib/*.sh scripts/generated/*.sh

      - name: Validate bash syntax
        run: |
          for script in scripts/generated/*.sh; do
            bash -n "$script"
          done
```

### 5.3 Tasks for Phase 5

- [ ] **5.1.1** Run shellcheck on all generated scripts
- [ ] **5.1.2** Run `bash -n` on install.sh with sourced scripts
- [ ] **5.1.3** Test contract validation (source without environment)
- [ ] **5.1.4** Test DRY_RUN mode
- [ ] **5.1.5** Test --only and --skip filtering
- [ ] **5.2.1** Test full installation in Docker (Ubuntu 24.04)
- [ ] **5.2.2** Test full installation in Docker (Ubuntu 25.04)
- [ ] **5.2.3** Test idempotent re-run (installer twice)
- [ ] **5.3.1** Verify `acfs doctor` passes after installation
- [ ] **5.3.2** Verify doctor_checks.sh aligns with doctor.sh
- [ ] **5.4.1** Add CI workflow to check generated scripts are in sync
- [ ] **5.4.2** Add CI workflow to run shellcheck on generated scripts

**Deliverable:** Passing test suite + CI integration

---

## Phase 6: Documentation & Cleanup

### 6.1 Tasks

- [ ] **6.1.1** Update README.md to remove "does not invoke scripts/generated/* yet"
- [ ] **6.1.2** Document new manifest schema fields in README.md
- [ ] **6.1.3** Add `docs/manifest-schema.md` with full schema documentation
- [ ] **6.1.4** Document environment contract in README.md
- [ ] **6.1.5** Update AGENTS.md with manifest workflow
- [ ] **6.2.1** Remove any dead code from install.sh
- [ ] **6.2.2** Remove duplicate module definitions
- [ ] **6.3.1** Add pre-commit hook to regenerate scripts on manifest change
- [ ] **6.3.2** Add an internal maintainer guide for adding new modules (no outside contributors policy)

**Deliverable:** Updated documentation, clean codebase

---

## Migration Strategy

### Incremental Approach (Recommended)

Rather than a big-bang migration, do it incrementally:

1. **Weeks 1-2:** Phase 1 (Gap analysis) + Phase 2 (Schema enhancement)
2. **Weeks 3-4:** Phase 3 (Generator enhancement)
3. **Weeks 5-6:** Phase 4 (Refactor install.sh) - ONE CATEGORY AT A TIME
   - Start with `install_lang` (easiest, most isolated)
   - Then `install_stack` (all use verified installers)
   - Then `install_agents`
   - Then `install_cloud`
   - Finally `install_shell` (most complex)
4. **Week 7:** Phase 5 (Testing)
5. **Week 8:** Phase 6 (Documentation) + buffer

### Rollback Plan

At each step, keep the old code commented out:

```bash
# Phase 6: Language runtimes
log_step "6/10" "Installing language runtimes..."

# NEW: Use generated scripts
install_lang

# OLD: Inline installation (remove after testing)
# install_bun_inline
# install_uv_inline
# install_rust_inline
# install_go_inline
```

### Category Migration Order

| Order | Category | Complexity | Notes |
|-------|----------|------------|-------|
| 1 | lang | Low | All use verified installers, isolated |
| 2 | stack | Low | All use verified installers |
| 3 | agents | Medium | Mixed installers (Claude may be native) |
| 4 | cloud | Medium | Mix of apt and bun |
| 5 | cli | Medium | Many apt packages |
| 6 | shell | High | Oh-my-zsh, plugins, complex config |
| 7 | base | Low | Simple apt install |
| 8 | acfs | Low | Just file copies |

---

## Success Criteria

| Metric | Target |
|--------|--------|
| install.sh line count | < 500 lines (from 1575) |
| Manifest coverage | 100% of installed modules defined |
| Generated script usage | 100% of module installations use generated scripts |
| CI checks | Manifest-to-generated sync enforced |
| Test coverage | Docker tests for Ubuntu 24.04 + 25.04 |
| Doctor alignment | doctor.sh checks match manifest verify commands |
| Contract validation | 100% of generated scripts validate environment |
| Filtering support | --only, --skip, --only-phase all work |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing installations | High | Incremental migration, thorough testing |
| Generated scripts have bugs | High | Shellcheck, Docker testing, contract validation |
| Complex modules can't be generated | Medium | `generated: false` escape hatch |
| Developer forgets to regenerate | Medium | CI check, pre-commit hook |
| Performance regression | Low | Profile before/after |
| Function name collisions | Medium | Generator validates uniqueness |
| Environment contract violations | Medium | Runtime validation in generated scripts |

---

## Timeline

| Week | Phase | Deliverable |
|------|-------|-------------|
| 1-2 | Gap Analysis + Schema | `docs/manifest-gap-analysis.md`, enhanced schema |
| 3-4 | Generator Enhancement | Updated generate.ts with all new features |
| 5-6 | install.sh Refactor | Sourcing generated scripts, one category at a time |
| 7 | Testing | Passing Docker tests, CI integration |
| 8 | Documentation + Buffer | Updated docs, pre-commit hooks |

**Total estimated effort:** 6-8 weeks

---

## Appendix A: Module Migration Checklist

For each module, verify:

- [ ] Has `verified_installer` if uses curl|bash
- [ ] Has `run_as: target_user` if installs to user home
- [ ] Has `installed_check` for skip-if-installed logic (with correct run_as)
- [ ] Has `phase` number assigned
- [ ] Has `optional: true` if failure is non-fatal
- [ ] Has `generated: false` if orchestration-only (description commands)
- [ ] Install commands are actual commands (not descriptions)
- [ ] Verify commands work as target user
- [ ] Entry in checksums.yaml (if verified installer)
- [ ] No function name collision with other modules

---

## Appendix B: Quick Reference

### Adding a New Module

1. Add to `acfs.manifest.yaml`:
```yaml
- id: tools.mytool
  description: My awesome tool
  phase: 6
  run_as: target_user
  installed_check:
    run_as: target_user
    command: "command -v mytool"
  verified_installer:
    tool: mytool
    runner: bash
    args: []
  install: []
  verify:
    - mytool --version
```

2. Add checksum to `checksums.yaml`:
```yaml
mytool:
  url: "https://example.com/install.sh"
  sha256: "abc123..."
```

3. Regenerate:
```bash
bun run --filter @acfs/manifest generate
```

4. Commit both manifest and generated changes.

### Testing a Single Module

```bash
# Dry run
./install.sh --dry-run --only tools.mytool

# Actual install
./install.sh --only tools.mytool

# Verify
mytool --version
```
