#!/usr/bin/env bash
# shellcheck disable=SC1091,SC2034
# ============================================================
# ACFS Installer - Module Selection and Resolution
# Computes effective execution plan from manifest + CLI inputs.
#
# Requires: manifest_index.sh to be sourced first
# ============================================================

# NOTE: Do not enable strict mode here. This file is sourced by
# installers and must not leak set -euo pipefail.

SELECTION_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Ensure we have logging functions available
if [[ -z "${ACFS_BLUE:-}" ]]; then
    # shellcheck source=logging.sh
    source "$SELECTION_SCRIPT_DIR/logging.sh" 2>/dev/null || true
fi

# ============================================================
# Output Variables (set by acfs_resolve_selection)
# ============================================================

# Ordered list of modules to execute
ACFS_EFFECTIVE_PLAN=()

# Associative array for O(1) membership checks
declare -gA ACFS_EFFECTIVE_RUN

# ============================================================
# Internal Helpers
# ============================================================

# Check if a module ID is valid (exists in manifest)
_selection_is_valid_module() {
    local module_id="$1"
    [[ -n "${ACFS_MODULE_PHASE[$module_id]:-}" ]]
}

# Check if a phase number is valid (has modules)
_selection_is_valid_phase() {
    local phase="$1"
    for module_id in "${ACFS_MODULES_IN_ORDER[@]}"; do
        if [[ "${ACFS_MODULE_PHASE[$module_id]}" == "$phase" ]]; then
            return 0
        fi
    done
    return 1
}

# Get direct dependencies of a module (as array via nameref)
_selection_get_deps() {
    local module_id="$1"
    local -n _deps_out=$2
    _deps_out=()

    local deps_str="${ACFS_MODULE_DEPS[$module_id]:-}"
    if [[ -n "$deps_str" ]]; then
        IFS=',' read -ra _deps_out <<< "$deps_str"
    fi
}

# Check if a module has a specific tag
_selection_has_tag() {
    local module_id="$1"
    local tag="$2"
    local tags_str="${ACFS_MODULE_TAGS[$module_id]:-}"

    # Check for exact match within comma-separated list
    [[ ",$tags_str," == *",$tag,"* ]]
}

# Check if module is in a category
_selection_in_category() {
    local module_id="$1"
    local category="$2"
    [[ "${ACFS_MODULE_CATEGORY[$module_id]:-}" == "$category" ]]
}

# Check if value is in array
_selection_array_contains() {
    local needle="$1"
    shift
    local item
    for item in "$@"; do
        [[ "$item" == "$needle" ]] && return 0
    done
    return 1
}

# ============================================================
# Dependency Closure
# ============================================================

# Compute transitive dependency closure for a set of modules.
# Uses ACFS_MODULE_DEPS to expand dependencies recursively.
# Result is stored in the nameref array, preserving manifest order.
_selection_compute_closure() {
    local -n _input_set=$1
    local -n _output_set=$2

    # Track visited modules (associative array for O(1) lookup)
    local -A visited

    # Recursive DFS to collect all dependencies
    _closure_visit() {
        local module_id="$1"

        # Skip if already visited
        [[ -n "${visited[$module_id]:-}" ]] && return 0
        visited[$module_id]=1

        # Visit dependencies first (ensures deps come before dependents)
        local -a deps
        _selection_get_deps "$module_id" deps

        for dep_id in "${deps[@]}"; do
            _closure_visit "$dep_id"
        done
    }

    # Visit all input modules
    for module_id in "${_input_set[@]}"; do
        _closure_visit "$module_id"
    done

    # Build output in manifest order (stable, deterministic)
    _output_set=()
    for module_id in "${ACFS_MODULES_IN_ORDER[@]}"; do
        if [[ -n "${visited[$module_id]:-}" ]]; then
            _output_set+=("$module_id")
        fi
    done
}

# ============================================================
# Skip Safety Validation
# ============================================================

# Check if skipping a module would break dependencies of remaining modules.
# Returns 1 if skip would cause a dependency violation, with error message.
_selection_validate_skips() {
    local -n _plan=$1
    local -n _skips=$2

    # Build lookup of skipped modules
    local -A skipped
    for module_id in "${_skips[@]}"; do
        skipped[$module_id]=1
    done

    # Check each module in the plan
    for module_id in "${_plan[@]}"; do
        # Skip modules that are themselves skipped
        [[ -n "${skipped[$module_id]:-}" ]] && continue

        # Check if any dependency is skipped
        local -a deps
        _selection_get_deps "$module_id" deps

        for dep_id in "${deps[@]}"; do
            if [[ -n "${skipped[$dep_id]:-}" ]]; then
                log_error "Cannot skip '$dep_id': required by '$module_id'"
                log_detail "Dependency chain: $module_id -> $dep_id"
                log_detail "Either also skip '$module_id' or don't skip '$dep_id'"
                return 1
            fi
        done
    done

    return 0
}

# ============================================================
# Main Selection Logic
# ============================================================

# Resolve effective execution plan from CLI inputs and manifest.
#
# Input variables (must be set before calling):
#   ONLY_MODULES=()   - Explicit module list (overrides defaults)
#   ONLY_PHASES=()    - Phase filter (modules in these phases only)
#   SKIP_MODULES=()   - Modules to exclude
#   NO_DEPS=false     - Skip dependency closure
#   PRINT_PLAN=false  - Print plan and exit
#
# Output variables (set by this function):
#   ACFS_EFFECTIVE_PLAN=()     - Ordered list of modules to run
#   ACFS_EFFECTIVE_RUN[id]=1   - Associative array for membership test
#
# Returns:
#   0 on success
#   1 on validation error (unknown module, broken deps, etc.)
acfs_resolve_selection() {
    local -a start_set=()
    local -a work_set=()
    local -a final_plan=()

    # Ensure manifest_index is loaded
    if [[ ${#ACFS_MODULES_IN_ORDER[@]} -eq 0 ]]; then
        log_error "acfs_resolve_selection: manifest_index not loaded"
        log_detail "Source scripts/generated/manifest_index.sh first"
        return 1
    fi

    # ------------------------------------------------------------
    # Step 1: Determine start set
    # ------------------------------------------------------------

    if [[ ${#ONLY_MODULES[@]} -gt 0 ]]; then
        # Explicit --only list: validate all module IDs
        for module_id in "${ONLY_MODULES[@]}"; do
            if ! _selection_is_valid_module "$module_id"; then
                log_error "Unknown module: '$module_id'"
                log_detail "Use --list-modules to see available modules"
                return 1
            fi
            start_set+=("$module_id")
        done
    elif [[ ${#ONLY_PHASES[@]} -gt 0 ]]; then
        # Phase filter: include all modules in specified phases
        for phase in "${ONLY_PHASES[@]}"; do
            if ! _selection_is_valid_phase "$phase"; then
                log_error "Unknown phase: '$phase'"
                log_detail "Valid phases: 1-10"
                return 1
            fi
            for module_id in "${ACFS_MODULES_IN_ORDER[@]}"; do
                if [[ "${ACFS_MODULE_PHASE[$module_id]}" == "$phase" ]]; then
                    start_set+=("$module_id")
                fi
            done
        done
    else
        # Default: all enabled_by_default modules
        for module_id in "${ACFS_MODULES_IN_ORDER[@]}"; do
            if [[ "${ACFS_MODULE_DEFAULT[$module_id]}" == "1" ]]; then
                start_set+=("$module_id")
            fi
        done
    fi

    # ------------------------------------------------------------
    # Step 2: Apply skips (validate first)
    # ------------------------------------------------------------

    for module_id in "${SKIP_MODULES[@]}"; do
        if ! _selection_is_valid_module "$module_id"; then
            log_error "Unknown module in --skip: '$module_id'"
            log_detail "Use --list-modules to see available modules"
            return 1
        fi
    done

    # Build work set by removing skipped modules
    for module_id in "${start_set[@]}"; do
        if ! _selection_array_contains "$module_id" "${SKIP_MODULES[@]}"; then
            work_set+=("$module_id")
        fi
    done

    # ------------------------------------------------------------
    # Step 3: Dependency closure (unless --no-deps)
    # ------------------------------------------------------------

    if [[ "${NO_DEPS:-false}" == "true" ]]; then
        log_warn "Running with --no-deps: dependencies will NOT be auto-installed"
        log_warn "Installation may fail if dependencies are missing"
        final_plan=("${work_set[@]}")
    else
        _selection_compute_closure work_set final_plan
    fi

    # ------------------------------------------------------------
    # Step 4: Apply skips to final plan and validate safety
    # ------------------------------------------------------------

    # Remove skipped modules from final plan
    local -a filtered_plan=()
    for module_id in "${final_plan[@]}"; do
        if ! _selection_array_contains "$module_id" "${SKIP_MODULES[@]}"; then
            filtered_plan+=("$module_id")
        fi
    done
    final_plan=("${filtered_plan[@]}")

    # Validate that skips don't break dependencies
    if [[ ${#SKIP_MODULES[@]} -gt 0 ]]; then
        if ! _selection_validate_skips final_plan SKIP_MODULES; then
            return 1
        fi
    fi

    # ------------------------------------------------------------
    # Step 5: Build output variables
    # ------------------------------------------------------------

    ACFS_EFFECTIVE_PLAN=("${final_plan[@]}")
    ACFS_EFFECTIVE_RUN=()
    for module_id in "${final_plan[@]}"; do
        ACFS_EFFECTIVE_RUN[$module_id]=1
    done

    # ------------------------------------------------------------
    # Step 6: Handle --print-plan
    # ------------------------------------------------------------

    if [[ "${PRINT_PLAN:-false}" == "true" ]]; then
        acfs_print_plan
        exit 0
    fi

    return 0
}

# ============================================================
# Plan Output
# ============================================================

# Print the effective execution plan in a human-readable format.
# Called automatically when PRINT_PLAN=true, or can be called manually.
acfs_print_plan() {
    echo "ACFS Execution Plan"
    echo "==================="
    echo ""
    echo "Modules to install (${#ACFS_EFFECTIVE_PLAN[@]} total):"
    echo ""

    local current_phase=""
    for module_id in "${ACFS_EFFECTIVE_PLAN[@]}"; do
        local phase="${ACFS_MODULE_PHASE[$module_id]}"
        local category="${ACFS_MODULE_CATEGORY[$module_id]}"
        local func="${ACFS_MODULE_FUNC[$module_id]}"

        # Print phase header if changed
        if [[ "$phase" != "$current_phase" ]]; then
            current_phase="$phase"
            echo "Phase $phase:"
        fi

        echo "  - $module_id ($category) -> $func()"
    done

    echo ""
    echo "Selection summary:"
    echo "  - Start set: ${#ONLY_MODULES[@]} explicit, ${#ONLY_PHASES[@]} phases"
    echo "  - Skipped: ${#SKIP_MODULES[@]} modules"
    echo "  - No-deps: ${NO_DEPS:-false}"
}

# Print available modules (for --list-modules)
acfs_list_modules() {
    echo "Available ACFS Modules"
    echo "======================"
    echo ""

    local current_category=""
    for module_id in "${ACFS_MODULES_IN_ORDER[@]}"; do
        local category="${ACFS_MODULE_CATEGORY[$module_id]}"
        local phase="${ACFS_MODULE_PHASE[$module_id]}"
        local default="${ACFS_MODULE_DEFAULT[$module_id]}"
        local tags="${ACFS_MODULE_TAGS[$module_id]}"
        local enabled_marker=""

        [[ "$default" == "1" ]] && enabled_marker="*"

        # Print category header if changed
        if [[ "$category" != "$current_category" ]]; then
            current_category="$category"
            echo ""
            echo "[$category]"
        fi

        printf "  %s%-25s  (phase %s)  [%s]\n" "$enabled_marker" "$module_id" "$phase" "$tags"
    done

    echo ""
    echo "Legend: * = enabled by default"
}

# ============================================================
# Convenience: Check if a module should run
# ============================================================

# Fast membership test for use in install loops.
# Returns 0 if module should run, 1 otherwise.
should_run_module() {
    local module_id="$1"
    [[ -n "${ACFS_EFFECTIVE_RUN[$module_id]:-}" ]]
}

# ============================================================
# CLI Argument Parsing for Selection Options
# ============================================================

# Parse selection-related CLI arguments.
# Call this from install.sh argument parsing loop.
# Modifies: ONLY_MODULES, ONLY_PHASES, SKIP_MODULES, NO_DEPS, PRINT_PLAN, LIST_MODULES
#
# Returns:
#   0 = argument consumed
#   1 = argument not recognized (caller should handle)
acfs_parse_selection_arg() {
    case "${1:-}" in
        --only)
            IFS=',' read -ra ONLY_MODULES <<< "${2:-}"
            return 0
            ;;
        --only=*)
            IFS=',' read -ra ONLY_MODULES <<< "${1#*=}"
            return 0
            ;;
        --only-phase)
            IFS=',' read -ra ONLY_PHASES <<< "${2:-}"
            return 0
            ;;
        --only-phase=*)
            IFS=',' read -ra ONLY_PHASES <<< "${1#*=}"
            return 0
            ;;
        --skip)
            IFS=',' read -ra SKIP_MODULES <<< "${2:-}"
            return 0
            ;;
        --skip=*)
            IFS=',' read -ra SKIP_MODULES <<< "${1#*=}"
            return 0
            ;;
        --no-deps)
            NO_DEPS=true
            return 0
            ;;
        --print-plan)
            PRINT_PLAN=true
            return 0
            ;;
        --list-modules)
            LIST_MODULES=true
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

# ============================================================
# Legacy Flag Mapping (Backwards Compatibility)
# ============================================================

# Map legacy --skip-* flags to module skips.
# Call after parsing all arguments but before acfs_resolve_selection().
#
# Reads: SKIP_POSTGRES, SKIP_VAULT, SKIP_CLOUD (from install.sh)
# Modifies: SKIP_MODULES
acfs_apply_legacy_skips() {
    # Ensure SKIP_MODULES array exists
    if [[ -z "${SKIP_MODULES+x}" ]]; then
        declare -ga SKIP_MODULES=()
    fi

    # Map legacy flags to module IDs
    if [[ "${SKIP_POSTGRES:-false}" == "true" ]]; then
        SKIP_MODULES+=("db.postgres18")
    fi

    if [[ "${SKIP_VAULT:-false}" == "true" ]]; then
        SKIP_MODULES+=("tools.vault")
    fi

    if [[ "${SKIP_CLOUD:-false}" == "true" ]]; then
        SKIP_MODULES+=("cloud.wrangler")
        SKIP_MODULES+=("cloud.supabase")
        SKIP_MODULES+=("cloud.vercel")
    fi
}

# ============================================================
# Initialization (run on source)
# ============================================================

# Initialize selection input arrays if not already set
# Use declare -a to ensure arrays exist without adding empty elements
if [[ -z "${ONLY_MODULES+x}" ]]; then
    declare -ga ONLY_MODULES=()
fi
if [[ -z "${ONLY_PHASES+x}" ]]; then
    declare -ga ONLY_PHASES=()
fi
if [[ -z "${SKIP_MODULES+x}" ]]; then
    declare -ga SKIP_MODULES=()
fi
NO_DEPS="${NO_DEPS:-false}"
PRINT_PLAN="${PRINT_PLAN:-false}"
LIST_MODULES="${LIST_MODULES:-false}"
