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

# Category: network
# Modules: 1

# Zero-config mesh VPN for secure remote VPS access
install_network_tailscale() {
    local module_id="network.tailscale"
    acfs_require_contract "module:${module_id}" || return 1
    log_step "Installing network.tailscale"

    if [[ "${DRY_RUN:-false}" == "true" ]]; then
        log_info "dry-run: install: # Add Tailscale apt repository (root)"
    else
        if ! run_as_root_shell <<'INSTALL_NETWORK_TAILSCALE'
# Add Tailscale apt repository
DISTRO_CODENAME=$(lsb_release -cs 2>/dev/null || echo "jammy")
# Map newer Ubuntu codenames to supported ones
case "$DISTRO_CODENAME" in
  oracular|plucky|questing) DISTRO_CODENAME="noble" ;;
esac
CURL_ARGS=(-fsSL)
if curl --help all 2>/dev/null | grep -q -- '--proto'; then
  CURL_ARGS=(--proto '=https' --proto-redir '=https' -fsSL)
fi
curl "${CURL_ARGS[@]}" "https://pkgs.tailscale.com/stable/ubuntu/${DISTRO_CODENAME}.noarmor.gpg" \
  | tee /usr/share/keyrings/tailscale-archive-keyring.gpg >/dev/null
echo "deb [signed-by=/usr/share/keyrings/tailscale-archive-keyring.gpg] https://pkgs.tailscale.com/stable/ubuntu ${DISTRO_CODENAME} main" \
  | tee /etc/apt/sources.list.d/tailscale.list
apt-get update
apt-get install -y tailscale
systemctl enable tailscaled
INSTALL_NETWORK_TAILSCALE
        then
            log_error "network.tailscale: install command failed: # Add Tailscale apt repository"
            return 1
        fi
    fi

    # Verify
    if [[ "${DRY_RUN:-false}" == "true" ]]; then
        log_info "dry-run: verify: tailscale version (root)"
    else
        if ! run_as_root_shell <<'INSTALL_NETWORK_TAILSCALE'
tailscale version
INSTALL_NETWORK_TAILSCALE
        then
            log_error "network.tailscale: verify failed: tailscale version"
            return 1
        fi
    fi
    if [[ "${DRY_RUN:-false}" == "true" ]]; then
        log_info "dry-run: verify: systemctl is-enabled tailscaled (root)"
    else
        if ! run_as_root_shell <<'INSTALL_NETWORK_TAILSCALE'
systemctl is-enabled tailscaled
INSTALL_NETWORK_TAILSCALE
        then
            log_error "network.tailscale: verify failed: systemctl is-enabled tailscaled"
            return 1
        fi
    fi

    log_success "network.tailscale installed"
}

# Install all network modules
install_network() {
    log_section "Installing network modules"
    install_network_tailscale
}

# Run if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    install_network
fi
