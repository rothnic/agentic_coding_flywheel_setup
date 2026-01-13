#!/usr/bin/env bash
# shellcheck disable=SC1091
# ============================================================
# AUTO-GENERATED FROM acfs.manifest.yaml - DO NOT EDIT
# Regenerate: bun run generate (from packages/manifest)
# ============================================================

set -euo pipefail

# Ensure logging functions available
ACFS_GENERATED_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "$ACFS_GENERATED_SCRIPT_DIR/../lib/logging.sh" ]]; then
    source "$ACFS_GENERATED_SCRIPT_DIR/../lib/logging.sh"
else
    # Fallback logging functions if logging.sh not found
    # Progress/status output should go to stderr so stdout stays clean for piping.
    log_step() { echo "[*] $*" >&2; }
    log_section() { echo "" >&2; echo "=== $* ===" >&2; }
    log_success() { echo "[OK] $*" >&2; }
    log_error() { echo "[ERROR] $*" >&2; }
    log_warn() { echo "[WARN] $*" >&2; }
    log_info() { echo "    $*" >&2; }
fi

# Source install helpers (run_as_*_shell, selection helpers)
if [[ -f "$ACFS_GENERATED_SCRIPT_DIR/../lib/install_helpers.sh" ]]; then
    source "$ACFS_GENERATED_SCRIPT_DIR/../lib/install_helpers.sh"
fi

# Source contract validation
if [[ -f "$ACFS_GENERATED_SCRIPT_DIR/../lib/contract.sh" ]]; then
    source "$ACFS_GENERATED_SCRIPT_DIR/../lib/contract.sh"
fi

# Optional security verification for upstream installer scripts.
# Scripts that need it should call: acfs_security_init
ACFS_SECURITY_READY=false
acfs_security_init() {
    if [[ "${ACFS_SECURITY_READY}" == "true" ]]; then
        return 0
    fi

    local security_lib="$ACFS_GENERATED_SCRIPT_DIR/../lib/security.sh"
    if [[ ! -f "$security_lib" ]]; then
        log_error "Security library not found: $security_lib"
        return 1
    fi

    # Use ACFS_CHECKSUMS_YAML if set by install.sh bootstrap (overrides security.sh default)
    if [[ -n "${ACFS_CHECKSUMS_YAML:-}" ]]; then
        export CHECKSUMS_FILE="${ACFS_CHECKSUMS_YAML}"
    fi

    # shellcheck source=../lib/security.sh
    # shellcheck disable=SC1091  # runtime relative source
    source "$security_lib"
    load_checksums || { log_error "Failed to load checksums.yaml"; return 1; }
    ACFS_SECURITY_READY=true
    return 0
}

# Category: agents
# Modules: 4

# Claude Code
install_agents_claude() {
    local module_id="agents.claude"
    acfs_require_contract "module:${module_id}" || return 1
    log_step "Installing agents.claude"

    if [[ "${DRY_RUN:-false}" == "true" ]]; then
        log_info "dry-run: verified installer: agents.claude"
    else
        if ! {
            # Try security-verified install (no unverified fallback; fail closed)
            local install_success=false

            if acfs_security_init; then
                # Check if KNOWN_INSTALLERS is available as an associative array (declare -A)
                # The grep ensures we specifically have an associative array, not just any variable
                if declare -p KNOWN_INSTALLERS 2>/dev/null | grep -q 'declare -A'; then
                    local tool="claude"
                    local url=""
                    local expected_sha256=""

                    # Safe access with explicit empty default
                    url="${KNOWN_INSTALLERS[$tool]:-}"
                    if ! expected_sha256="$(get_checksum "$tool")"; then
                        log_error "agents.claude: get_checksum failed for tool '$tool'"
                        expected_sha256=""
                    fi

                    if [[ -n "$url" ]] && [[ -n "$expected_sha256" ]]; then
                        if verify_checksum "$url" "$expected_sha256" "$tool" | run_as_target_runner 'bash' '-s' '--' 'stable'; then
                            install_success=true
                        else
                            log_error "agents.claude: verify_checksum or installer execution failed"
                        fi
                    else
                        if [[ -z "$url" ]]; then
                            log_error "agents.claude: KNOWN_INSTALLERS[$tool] not found"
                        fi
                        if [[ -z "$expected_sha256" ]]; then
                            log_error "agents.claude: checksum for '$tool' not found"
                        fi
                    fi
                else
                    log_error "agents.claude: KNOWN_INSTALLERS array not available"
                fi
            else
                log_error "agents.claude: acfs_security_init failed - check security.sh and checksums.yaml"
            fi

            # No unverified fallback: verified install is required
            if [[ "$install_success" != "true" ]]; then
                log_error "Verified install failed for agents.claude"
                false
            fi
        }; then
            log_error "agents.claude: verified installer failed"
            return 1
        fi
    fi

    # Verify
    if [[ "${DRY_RUN:-false}" == "true" ]]; then
        log_info "dry-run: verify: ~/.local/bin/claude --version || ~/.local/bin/claude --help (target_user)"
    else
        if ! run_as_target_shell <<'INSTALL_AGENTS_CLAUDE'
~/.local/bin/claude --version || ~/.local/bin/claude --help
INSTALL_AGENTS_CLAUDE
        then
            log_error "agents.claude: verify failed: ~/.local/bin/claude --version || ~/.local/bin/claude --help"
            return 1
        fi
    fi

    log_success "agents.claude installed"
}

# OpenCode CLI
install_agents_opencode() {
    local module_id="agents.opencode"
    acfs_require_contract "module:${module_id}" || return 1
    log_step "Installing agents.opencode"

    if [[ "${DRY_RUN:-false}" == "true" ]]; then
        log_info "dry-run: verified installer: agents.opencode"
    else
        if ! {
            # Try security-verified install (no unverified fallback; fail closed)
            local install_success=false

            if acfs_security_init; then
                # Check if KNOWN_INSTALLERS is available as an associative array (declare -A)
                # The grep ensures we specifically have an associative array, not just any variable
                if declare -p KNOWN_INSTALLERS 2>/dev/null | grep -q 'declare -A'; then
                    local tool="opencode"
                    local url=""
                    local expected_sha256=""

                    # Safe access with explicit empty default
                    url="${KNOWN_INSTALLERS[$tool]:-}"
                    if ! expected_sha256="$(get_checksum "$tool")"; then
                        log_error "agents.opencode: get_checksum failed for tool '$tool'"
                        expected_sha256=""
                    fi

                    if [[ -n "$url" ]] && [[ -n "$expected_sha256" ]]; then
                        if verify_checksum "$url" "$expected_sha256" "$tool" | run_as_target_runner 'bash' '-s' '--' '--no-modify-path'; then
                            install_success=true
                        else
                            log_error "agents.opencode: verify_checksum or installer execution failed"
                        fi
                    else
                        if [[ -z "$url" ]]; then
                            log_error "agents.opencode: KNOWN_INSTALLERS[$tool] not found"
                        fi
                        if [[ -z "$expected_sha256" ]]; then
                            log_error "agents.opencode: checksum for '$tool' not found"
                        fi
                    fi
                else
                    log_error "agents.opencode: KNOWN_INSTALLERS array not available"
                fi
            else
                log_error "agents.opencode: acfs_security_init failed - check security.sh and checksums.yaml"
            fi

            # No unverified fallback: verified install is required
            if [[ "$install_success" != "true" ]]; then
                log_error "Verified install failed for agents.opencode"
                false
            fi
        }; then
            log_error "agents.opencode: verified installer failed"
            return 1
        fi
    fi
    if [[ "${DRY_RUN:-false}" == "true" ]]; then
        log_info "dry-run: install: # Link opencode to ~/.local/bin (target_user)"
    else
        if ! run_as_target_shell <<'INSTALL_AGENTS_OPENCODE'
# Link opencode to ~/.local/bin
mkdir -p ~/.local/bin
ln -sf ~/.opencode/bin/opencode ~/.local/bin/opencode
INSTALL_AGENTS_OPENCODE
        then
            log_error "agents.opencode: install command failed: # Link opencode to ~/.local/bin"
            return 1
        fi
    fi

    # Verify
    if [[ "${DRY_RUN:-false}" == "true" ]]; then
        log_info "dry-run: verify: ~/.local/bin/opencode --version || ~/.local/bin/opencode --help (target_user)"
    else
        if ! run_as_target_shell <<'INSTALL_AGENTS_OPENCODE'
~/.local/bin/opencode --version || ~/.local/bin/opencode --help
INSTALL_AGENTS_OPENCODE
        then
            log_error "agents.opencode: verify failed: ~/.local/bin/opencode --version || ~/.local/bin/opencode --help"
            return 1
        fi
    fi

    log_success "agents.opencode installed"
}

# OpenAI Codex CLI
install_agents_codex() {
    local module_id="agents.codex"
    acfs_require_contract "module:${module_id}" || return 1
    log_step "Installing agents.codex"

    if [[ "${DRY_RUN:-false}" == "true" ]]; then
        log_info "dry-run: install: ~/.bun/bin/bun install -g --trust @openai/codex@latest (target_user)"
    else
        if ! run_as_target_shell <<'INSTALL_AGENTS_CODEX'
~/.bun/bin/bun install -g --trust @openai/codex@latest
INSTALL_AGENTS_CODEX
        then
            log_error "agents.codex: install command failed: ~/.bun/bin/bun install -g --trust @openai/codex@latest"
            return 1
        fi
    fi
    if [[ "${DRY_RUN:-false}" == "true" ]]; then
        log_info "dry-run: install: mkdir -p ~/.local/bin (target_user)"
    else
        if ! run_as_target_shell <<'INSTALL_AGENTS_CODEX'
mkdir -p ~/.local/bin
cat > ~/.local/bin/codex << 'WRAPPER'
#!/bin/bash
exec ~/.bun/bin/bun ~/.bun/bin/codex "$@"
WRAPPER
chmod +x ~/.local/bin/codex
INSTALL_AGENTS_CODEX
        then
            log_error "agents.codex: install command failed: mkdir -p ~/.local/bin"
            return 1
        fi
    fi

    # Verify
    if [[ "${DRY_RUN:-false}" == "true" ]]; then
        log_info "dry-run: verify: ~/.local/bin/codex --version || ~/.local/bin/codex --help (target_user)"
    else
        if ! run_as_target_shell <<'INSTALL_AGENTS_CODEX'
~/.local/bin/codex --version || ~/.local/bin/codex --help
INSTALL_AGENTS_CODEX
        then
            log_error "agents.codex: verify failed: ~/.local/bin/codex --version || ~/.local/bin/codex --help"
            return 1
        fi
    fi

    log_success "agents.codex installed"
}

# Google Gemini CLI
install_agents_gemini() {
    local module_id="agents.gemini"
    acfs_require_contract "module:${module_id}" || return 1
    log_step "Installing agents.gemini"

    if [[ "${DRY_RUN:-false}" == "true" ]]; then
        log_info "dry-run: install: ~/.bun/bin/bun install -g --trust @google/gemini-cli@latest (target_user)"
    else
        if ! run_as_target_shell <<'INSTALL_AGENTS_GEMINI'
~/.bun/bin/bun install -g --trust @google/gemini-cli@latest
INSTALL_AGENTS_GEMINI
        then
            log_error "agents.gemini: install command failed: ~/.bun/bin/bun install -g --trust @google/gemini-cli@latest"
            return 1
        fi
    fi
    if [[ "${DRY_RUN:-false}" == "true" ]]; then
        log_info "dry-run: install: mkdir -p ~/.local/bin (target_user)"
    else
        if ! run_as_target_shell <<'INSTALL_AGENTS_GEMINI'
mkdir -p ~/.local/bin
cat > ~/.local/bin/gemini << 'WRAPPER'
#!/bin/bash
exec ~/.bun/bin/bun ~/.bun/bin/gemini "$@"
WRAPPER
chmod +x ~/.local/bin/gemini
INSTALL_AGENTS_GEMINI
        then
            log_error "agents.gemini: install command failed: mkdir -p ~/.local/bin"
            return 1
        fi
    fi

    # Verify
    if [[ "${DRY_RUN:-false}" == "true" ]]; then
        log_info "dry-run: verify: ~/.local/bin/gemini --version || ~/.local/bin/gemini --help (target_user)"
    else
        if ! run_as_target_shell <<'INSTALL_AGENTS_GEMINI'
~/.local/bin/gemini --version || ~/.local/bin/gemini --help
INSTALL_AGENTS_GEMINI
        then
            log_error "agents.gemini: verify failed: ~/.local/bin/gemini --version || ~/.local/bin/gemini --help"
            return 1
        fi
    fi

    log_success "agents.gemini installed"
}

# Install all agents modules
install_agents() {
    log_section "Installing agents modules"
    install_agents_claude
    install_agents_opencode
    install_agents_codex
    install_agents_gemini
}

# Run if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    install_agents
fi
