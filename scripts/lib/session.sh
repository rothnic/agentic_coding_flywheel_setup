#!/usr/bin/env bash
# ============================================================
# ACFS Installer - Session Export Library
# Defines schema and validation for agent session exports
# ============================================================
#
# Part of EPIC: Agent Session Sharing and Replay (0sb)
# See bead c61 for design decisions.
#
# ============================================================
# SESSION EXPORT SCHEMA (TypeScript Interface)
# ============================================================
#
# Schema lives inline per AGENTS.md guidance (no separate schema file).
# Version field allows future evolution.
#
# ```typescript
# interface SessionExport {
#     schema_version: 1;              // Always 1 for this version
#     exported_at: string;            // ISO8601 timestamp
#     session_id: string;             // Unique session identifier
#     agent: "claude-code" | "codex" | "gemini";
#     model: string;                  // e.g., "opus-4.5", "gpt-4o"
#     summary: string;                // Brief description of what happened
#     duration_minutes: number;       // Session length
#     stats: {
#         turns: number;              // Conversation turns
#         files_created: number;
#         files_modified: number;
#         commands_run: number;
#     };
#     outcomes: Array<{
#         type: "file_created" | "file_modified" | "command_run";
#         path?: string;              // For file operations
#         description: string;
#     }>;
#     key_prompts: string[];          // Notable prompts for learning
#     sanitized_transcript: Array<{
#         role: "user" | "assistant";
#         content: string;            // Post-sanitization
#         timestamp: string;          // ISO8601
#     }>;
# }
# ```
#
# DESIGN DECISIONS:
# - Schema versioned for evolution (schema_version: 1)
# - Fields designed for post-sanitization data (no raw secrets)
# - Focused on value: outcomes show what happened, key_prompts show how
# - Not a raw dump - curated for learning and replay
#
# ============================================================

# Source logging if not already loaded
if [[ -z "${ACFS_LOG_LOADED:-}" ]]; then
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    # shellcheck source=logging.sh
    source "${SCRIPT_DIR}/logging.sh" 2>/dev/null || true
fi

# ============================================================
# VALIDATION
# ============================================================

# Validate a session export JSON file against the schema
# Usage: validate_session_export "/path/to/export.json"
# Returns: 0 on success, 1 on validation failure
validate_session_export() {
    local file="$1"

    # Check file exists
    if [[ ! -f "$file" ]]; then
        log_error "Session export file not found: $file"
        return 1
    fi

    # Check it's valid JSON
    if ! jq empty "$file" 2>/dev/null; then
        log_error "Invalid JSON in session export: $file"
        return 1
    fi

    # Check required top-level fields exist
    if ! jq -e '.schema_version and .session_id and .agent' "$file" >/dev/null 2>&1; then
        log_error "Invalid session export: missing required fields (schema_version, session_id, agent)"
        return 1
    fi

    # Check schema version compatibility
    local version
    version=$(jq -r '.schema_version' "$file")
    if [[ "$version" != "1" ]]; then
        log_warn "Session schema version $version may not be fully compatible (expected: 1)"
    fi

    # Validate agent field is one of the known agents
    local agent
    agent=$(jq -r '.agent' "$file")
    case "$agent" in
        claude-code|codex|gemini)
            ;;
        *)
            log_warn "Unknown agent type: $agent (expected: claude-code, codex, or gemini)"
            ;;
    esac

    # Validate stats object exists and has expected fields
    if ! jq -e '.stats.turns != null' "$file" >/dev/null 2>&1; then
        log_warn "Session export missing stats.turns field"
    fi

    return 0
}

# Get schema version from a session export
# Usage: get_session_schema_version "/path/to/export.json"
# Returns: schema version number or "unknown"
get_session_schema_version() {
    local file="$1"

    if [[ ! -f "$file" ]]; then
        echo "unknown"
        return 1
    fi

    jq -r '.schema_version // "unknown"' "$file" 2>/dev/null || echo "unknown"
}

# Get session summary from an export
# Usage: get_session_summary "/path/to/export.json"
get_session_summary() {
    local file="$1"

    if [[ ! -f "$file" ]]; then
        echo ""
        return 1
    fi

    jq -r '.summary // ""' "$file" 2>/dev/null || echo ""
}

# Get session agent from an export
# Usage: get_session_agent "/path/to/export.json"
get_session_agent() {
    local file="$1"

    if [[ ! -f "$file" ]]; then
        echo ""
        return 1
    fi

    jq -r '.agent // ""' "$file" 2>/dev/null || echo ""
}

# Check if jq is available (required for session operations)
# Usage: check_session_deps
check_session_deps() {
    if ! command -v jq >/dev/null 2>&1; then
        log_error "jq is required for session operations but not installed"
        return 1
    fi
    return 0
}
