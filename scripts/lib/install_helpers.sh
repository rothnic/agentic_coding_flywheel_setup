#!/usr/bin/env bash
# shellcheck disable=SC1091
# ============================================================
# ACFS Installer - Install Helpers
# Shared helpers for module execution and selection.
# ============================================================

# NOTE: Do not enable strict mode here. This file is sourced by
# installers and generated scripts and must not leak set -euo pipefail.

INSTALL_HELPERS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Ensure logging functions are available (best effort)
if [[ -z "${ACFS_BLUE:-}" ]]; then
    # shellcheck source=logging.sh
    source "$INSTALL_HELPERS_DIR/logging.sh" 2>/dev/null || true
fi

# ------------------------------------------------------------
# Selection state (populated by parse_args or manifest selection)
# ------------------------------------------------------------
if [[ "${ONLY_MODULES+x}" != "x" ]]; then
    ONLY_MODULES=()
fi
if [[ "${ONLY_PHASES+x}" != "x" ]]; then
    ONLY_PHASES=()
fi
if [[ "${SKIP_MODULES+x}" != "x" ]]; then
    SKIP_MODULES=()
fi
: "${NO_DEPS:=false}"
: "${PRINT_PLAN:=false}"

# ------------------------------------------------------------
# Effective selection (computed once after manifest_index)
# ------------------------------------------------------------
declare -A ACFS_EFFECTIVE_RUN=()
declare -A ACFS_PLAN_REASON=()
declare -A ACFS_PLAN_EXCLUDE_REASON=()
ACFS_EFFECTIVE_PLAN=()

acfs_resolve_selection() {
    if [[ "${ACFS_MANIFEST_INDEX_LOADED:-false}" != "true" ]]; then
        log_error "Manifest index not loaded. Cannot resolve selection."
        return 1
    fi

    ACFS_EFFECTIVE_RUN=()
    ACFS_PLAN_REASON=()
    ACFS_PLAN_EXCLUDE_REASON=()
    ACFS_EFFECTIVE_PLAN=()

    local -A module_exists=()
    local -A phase_exists=()
    local module=""
    local phase=""
    for module in "${ACFS_MODULES_IN_ORDER[@]}"; do
        module_exists["$module"]=1
        phase="${ACFS_MODULE_PHASE["$module"]:-}"
        if [[ -n "$phase" ]]; then
            phase_exists["$phase"]=1
        fi
    done

    local -A desired=()
    local -A start_reason=()

    if [[ "${#ONLY_MODULES[@]}" -gt 0 ]]; then
        for module in "${ONLY_MODULES[@]}"; do
            [[ -n "$module" ]] || continue
            if [[ -z "${module_exists[$module]:-}" ]]; then
                log_error "Unknown module id in --only: $module"
                return 1
            fi
            desired["$module"]=1
            start_reason["$module"]="explicitly requested"
        done
    elif [[ "${#ONLY_PHASES[@]}" -gt 0 ]]; then
        for phase in "${ONLY_PHASES[@]}"; do
            [[ -n "$phase" ]] || continue
            if [[ -z "${phase_exists[$phase]:-}" ]]; then
                log_error "Unknown phase in --only-phase: $phase"
                return 1
            fi
        done
        for module in "${ACFS_MODULES_IN_ORDER[@]}"; do
            phase="${ACFS_MODULE_PHASE["$module"]:-}"
            for target_phase in "${ONLY_PHASES[@]}"; do
                if [[ "$phase" == "$target_phase" ]]; then
                    desired["$module"]=1
                    start_reason["$module"]="phase $phase"
                    break
                fi
            done
        done
    else
        for module in "${ACFS_MODULES_IN_ORDER[@]}"; do
            local enabled="${ACFS_MODULE_DEFAULT["$module"]:-1}"
            if [[ "$enabled" == "1" || "$enabled" == "true" ]]; then
                desired["$module"]=1
                start_reason["$module"]="default"
            else
                ACFS_PLAN_EXCLUDE_REASON["$module"]="disabled by default"
            fi
        done
    fi

    local -A skip_set=()
    local -A skip_reason=()

    for module in "${SKIP_MODULES[@]}"; do
        [[ -n "$module" ]] || continue
        if [[ -z "${module_exists[$module]:-}" ]]; then
            log_error "Unknown module id in --skip: $module"
            return 1
        fi
        skip_set["$module"]=1
        skip_reason["$module"]="explicitly skipped"
    done

    if [[ "${SKIP_TAGS+x}" == "x" ]] && [[ "${#SKIP_TAGS[@]}" -gt 0 ]]; then
        local tag=""
        for tag in "${SKIP_TAGS[@]}"; do
            [[ -n "$tag" ]] || continue
            for module in "${ACFS_MODULES_IN_ORDER[@]}"; do
                local tags="${ACFS_MODULE_TAGS["$module"]:-}"
                [[ -n "$tags" ]] || continue
                IFS=',' read -ra _tags <<< "$tags"
                local _tag=""
                for _tag in "${_tags[@]}"; do
                    if [[ "$_tag" == "$tag" ]]; then
                        skip_set["$module"]=1
                        if [[ -z "${skip_reason[$module]:-}" ]]; then
                            skip_reason["$module"]="skipped tag $tag"
                        fi
                        break
                    fi
                done
            done
        done
    fi

    if [[ "${SKIP_CATEGORIES+x}" == "x" ]] && [[ "${#SKIP_CATEGORIES[@]}" -gt 0 ]]; then
        local category=""
        for category in "${SKIP_CATEGORIES[@]}"; do
            [[ -n "$category" ]] || continue
            for module in "${ACFS_MODULES_IN_ORDER[@]}"; do
                if [[ "${ACFS_MODULE_CATEGORY["$module"]:-}" == "$category" ]]; then
                    skip_set["$module"]=1
                    if [[ -z "${skip_reason[$module]:-}" ]]; then
                        skip_reason["$module"]="skipped category $category"
                    fi
                fi
            done
        done
    fi

    for module in "${!skip_set[@]}"; do
        if [[ -n "${desired[$module]:-}" ]]; then
            unset "desired[$module]"
            ACFS_PLAN_EXCLUDE_REASON["$module"]="${skip_reason[$module]}"
        elif [[ -z "${ACFS_PLAN_EXCLUDE_REASON[$module]:-}" ]]; then
            ACFS_PLAN_EXCLUDE_REASON["$module"]="${skip_reason[$module]}"
        fi
    done

    local found_dep=""
    local found_chain=""
    _acfs_find_skipped_dep() {
        local current="$1"
        local path="$2"
        local deps="${ACFS_MODULE_DEPS["$current"]:-}"
        [[ -n "$deps" ]] || return 1
        IFS=',' read -ra _deps <<< "$deps"
        local dep=""
        for dep in "${_deps[@]}"; do
            [[ -n "$dep" ]] || continue
            if [[ -n "${skip_set[$dep]:-}" ]]; then
                found_dep="$dep"
                found_chain="$path -> $dep"
                return 0
            fi
            if [[ -n "${visited[$dep]:-}" ]]; then
                continue
            fi
            visited["$dep"]=1
            if _acfs_find_skipped_dep "$dep" "$path -> $dep"; then
                return 0
            fi
        done
        return 1
    }

    for module in "${!desired[@]}"; do
        local -A visited=()
        visited["$module"]=1
        found_dep=""
        found_chain=""
        if _acfs_find_skipped_dep "$module" "$module"; then
            log_error "Selection error: $module depends on skipped $found_dep"
            log_error "Dependency chain: $found_chain"
            log_error "Remove --skip $found_dep or omit $module."
            return 1
        fi
    done

    if [[ "${NO_DEPS:-false}" == "true" ]]; then
        log_warn "WARNING: --no-deps disables dependency closure; install may be incomplete."
    else
        local -a queue=()
        local idx=0
        for module in "${!desired[@]}"; do
            queue+=("$module")
        done
        while [[ $idx -lt ${#queue[@]} ]]; do
            local current="${queue[$idx]}"
            idx=$((idx + 1))
            local deps="${ACFS_MODULE_DEPS["$current"]:-}"
            [[ -n "$deps" ]] || continue
            IFS=',' read -ra _deps <<< "$deps"
            local dep=""
            for dep in "${_deps[@]}"; do
                [[ -n "$dep" ]] || continue
                if [[ -n "${skip_set[$dep]:-}" ]]; then
                    log_error "Selection error: $current depends on skipped $dep"
                    log_error "Remove --skip $dep or add --no-deps if debugging."
                    return 1
                fi
                if [[ -z "${module_exists[$dep]:-}" ]]; then
                    log_error "Manifest error: $current depends on unknown module $dep"
                    return 1
                fi
                if [[ -z "${desired[$dep]:-}" ]]; then
                    desired["$dep"]=1
                    if [[ -z "${start_reason[$dep]:-}" ]]; then
                        start_reason["$dep"]="dependency of $current"
                    fi
                    queue+=("$dep")
                fi
            done
        done
    fi

    for module in "${ACFS_MODULES_IN_ORDER[@]}"; do
        if [[ -n "${desired[$module]:-}" ]]; then
            unset "ACFS_PLAN_EXCLUDE_REASON[$module]"
            ACFS_EFFECTIVE_RUN["$module"]=1
            ACFS_EFFECTIVE_PLAN+=("$module")
            if [[ -n "${start_reason[$module]:-}" ]]; then
                # shellcheck disable=SC2034  # consumed by print_execution_plan
                ACFS_PLAN_REASON["$module"]="${start_reason[$module]}"
            else
                # shellcheck disable=SC2034  # consumed by print_execution_plan
                ACFS_PLAN_REASON["$module"]="included"
            fi
        else
            if [[ -n "${ACFS_PLAN_EXCLUDE_REASON[$module]:-}" ]]; then
                continue
            fi
            if [[ "${#ONLY_MODULES[@]}" -gt 0 ]]; then
                ACFS_PLAN_EXCLUDE_REASON["$module"]="not selected"
            elif [[ "${#ONLY_PHASES[@]}" -gt 0 ]]; then
                ACFS_PLAN_EXCLUDE_REASON["$module"]="filtered by phase"
            else
                ACFS_PLAN_EXCLUDE_REASON["$module"]="not selected"
            fi
        fi
    done
}

should_run_module() {
    local module_id="$1"
    [[ -n "${ACFS_EFFECTIVE_RUN[$module_id]:-}" ]]
}

# ------------------------------------------------------------
# Command execution helpers (heredoc-friendly)
# ------------------------------------------------------------

_run_shell_with_strict_mode() {
    local cmd="$1"

    if [[ -n "$cmd" ]]; then
        bash -lc "set -euo pipefail; $cmd"
        return $?
    fi

    # stdin mode (supports heredocs/pipes)
    bash -lc 'set -euo pipefail; (printf "%s\n" "set -euo pipefail"; cat) | bash -s'
}

# Run a shell string (or stdin) as TARGET_USER
run_as_target_shell() {
    local cmd="${1:-}"

    if ! declare -f run_as_target >/dev/null 2>&1; then
        log_error "run_as_target_shell requires run_as_target"
        return 1
    fi

    if [[ -n "$cmd" ]]; then
        run_as_target bash -lc "set -euo pipefail; $cmd"
        return $?
    fi

    # stdin mode
    run_as_target bash -lc 'set -euo pipefail; (printf "%s\n" "set -euo pipefail"; cat) | bash -s'
}

# Run a shell string (or stdin) as root
run_as_root_shell() {
    local cmd="${1:-}"

    if [[ "$EUID" -eq 0 ]]; then
        _run_shell_with_strict_mode "$cmd"
        return $?
    fi

    if [[ -n "${SUDO:-}" ]]; then
        if [[ -n "$cmd" ]]; then
            $SUDO bash -lc "set -euo pipefail; $cmd"
            return $?
        fi
        $SUDO bash -lc 'set -euo pipefail; (printf "%s\n" "set -euo pipefail"; cat) | bash -s'
        return $?
    fi

    if command -v sudo >/dev/null 2>&1; then
        if [[ -n "$cmd" ]]; then
            sudo bash -lc "set -euo pipefail; $cmd"
            return $?
        fi
        sudo bash -lc 'set -euo pipefail; (printf "%s\n" "set -euo pipefail"; cat) | bash -s'
        return $?
    fi

    log_error "run_as_root_shell requires root or sudo"
    return 1
}

# Run a shell string (or stdin) as current user
run_as_current_shell() {
    local cmd="${1:-}"
    _run_shell_with_strict_mode "$cmd"
}

# ------------------------------------------------------------
# Command existence helpers
# ------------------------------------------------------------

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

command_exists_as_target() {
    local cmd="$1"
    if ! declare -f run_as_target >/dev/null 2>&1; then
        return 1
    fi

    run_as_target bash -lc "command -v '$cmd' >/dev/null 2>&1"
}
