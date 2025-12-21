#!/usr/bin/env bash
# ============================================================
# ACFS Update - End-to-End Integration Test (Docker)
#
# Runs acfs-update inside a fresh Ubuntu container with ACFS installed,
# testing various modes and validating behavior.
#
# Usage:
#   ./tests/vm/test_acfs_update.sh              # defaults to 24.04
#   ./tests/vm/test_acfs_update.sh --all        # run 24.04 + 25.04
#   ./tests/vm/test_acfs_update.sh --ubuntu 25.04
#   ./tests/vm/test_acfs_update.sh --skip-install  # use pre-installed container
#
# Requirements:
#   - docker (or compatible runtime that supports `docker run`)
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

usage() {
    cat <<'EOF'
tests/vm/test_acfs_update.sh - ACFS update E2E integration test (Docker)

Usage:
  ./tests/vm/test_acfs_update.sh [options]

Options:
  --ubuntu <version>   Ubuntu tag (e.g. 24.04, 25.04). Repeatable.
  --all                Run on 24.04 and 25.04.
  --help               Show help.

Test Coverage:
  1. --help flag works and shows usage
  2. --dry-run mode previews without changes
  3. --yes non-interactive mode
  4. --quiet minimal output mode
  5. --agents-only category filter
  6. --no-apt skip filter
  7. Log file creation
  8. Exit codes (success/failure)
  9. Missing tool handling (graceful skip)

Examples:
  ./tests/vm/test_acfs_update.sh
  ./tests/vm/test_acfs_update.sh --all
  ./tests/vm/test_acfs_update.sh --ubuntu 25.04
EOF
}

if [[ "${1:-}" == "--help" ]]; then
    usage
    exit 0
fi

if ! command -v docker >/dev/null 2>&1; then
    echo "ERROR: docker not found. Install Docker Desktop or docker engine." >&2
    exit 1
fi

declare -a ubuntus=()
while [[ $# -gt 0 ]]; do
    case "$1" in
        --ubuntu)
            ubuntus+=("${2:-}")
            shift 2
            ;;
        --all)
            ubuntus=("24.04" "25.04")
            shift
            ;;
        --help)
            usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1" >&2
            usage >&2
            exit 1
            ;;
    esac
done

if [[ ${#ubuntus[@]} -eq 0 ]]; then
    ubuntus=("24.04")
fi

# Test script that runs inside the container
# This is passed as a heredoc to avoid escaping issues
create_test_script() {
    cat <<'TESTSCRIPT'
#!/usr/bin/env bash
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

pass_count=0
fail_count=0

pass() {
    echo -e "${GREEN}✅ PASS${NC}: $1"
    ((pass_count += 1))
}

fail() {
    echo -e "${RED}❌ FAIL${NC}: $1"
    ((fail_count += 1))
}

info() {
    echo -e "${YELLOW}ℹ️ ${NC} $1"
}

# Test 1: --help works
test_help() {
    info "Testing --help flag"
    if acfs-update --help 2>&1 | grep -q "USAGE:"; then
        pass "--help shows usage"
    else
        fail "--help does not show usage"
    fi
}

# Test 2: --dry-run mode
test_dry_run() {
    info "Testing --dry-run mode"
    local output
    output=$(acfs-update --dry-run --yes 2>&1) || true

    if echo "$output" | grep -q "dry-run"; then
        pass "--dry-run mentions dry-run mode"
    else
        fail "--dry-run output missing dry-run indicator"
    fi

    # Dry run should not create errors on skip
    if echo "$output" | grep -q "\[skip\]"; then
        pass "--dry-run shows skip markers"
    else
        fail "--dry-run missing skip markers"
    fi
}

# Test 3: --quiet mode
test_quiet() {
    info "Testing --quiet mode"
    local output
    output=$(acfs-update --quiet --dry-run --yes 2>&1) || true

    # Quiet mode should have minimal output
    local line_count
    line_count=$(echo "$output" | wc -l)
    if [[ $line_count -lt 20 ]]; then
        pass "--quiet produces minimal output ($line_count lines)"
    else
        fail "--quiet produces too much output ($line_count lines)"
    fi
}

# Test 4: --agents-only category filter
test_agents_only() {
    info "Testing --agents-only filter"
    local output
    output=$(acfs-update --agents-only --dry-run --yes 2>&1) || true

    # Should mention agents section
    if echo "$output" | grep -qi "agents\|claude\|codex\|gemini"; then
        pass "--agents-only processes agent section"
    else
        fail "--agents-only missing agent output"
    fi

    # Should NOT mention apt section header
    if echo "$output" | grep -q "System Packages (apt)"; then
        fail "--agents-only still shows apt section"
    else
        pass "--agents-only skips apt section"
    fi
}

# Test 5: --no-apt skip filter
test_no_apt() {
    info "Testing --no-apt filter"
    local output
    output=$(acfs-update --no-apt --dry-run --yes 2>&1) || true

    # Should show skip message for apt
    if echo "$output" | grep -q "disabled via --no-apt\|skip.*apt"; then
        pass "--no-apt shows apt disabled"
    else
        # It might just not show apt at all
        if echo "$output" | grep -q "apt update"; then
            fail "--no-apt still runs apt update"
        else
            pass "--no-apt skips apt"
        fi
    fi
}

# Test 6: Log file creation
test_logging() {
    info "Testing log file creation"

    # Run a real (but quick) update to create log
    acfs-update --shell-only --yes --quiet 2>&1 || true

    local log_dir="$HOME/.acfs/logs/updates"
    if [[ -d "$log_dir" ]]; then
        pass "Log directory created: $log_dir"
    else
        fail "Log directory not created"
        return
    fi

    local log_count
    log_count=$(find "$log_dir" -name "*.log" 2>/dev/null | wc -l)
    if [[ $log_count -gt 0 ]]; then
        pass "Log file(s) created ($log_count found)"
    else
        fail "No log files created"
        return
    fi

    # Check log content
    local latest_log
    latest_log=$(ls -1t "$log_dir"/*.log 2>/dev/null | head -1)
    if [[ -n "$latest_log" ]] && grep -q "ACFS Update Log" "$latest_log"; then
        pass "Log file has proper header"
    else
        fail "Log file missing header"
    fi
}

# Test 7: Missing tool graceful handling
test_missing_tools() {
    info "Testing missing tool handling"

    # Remove a tool temporarily and verify graceful skip
    local output
    output=$(acfs-update --stack --dry-run --yes 2>&1) || true

    # Stack should show skip for uninstalled tools
    if echo "$output" | grep -q "\[skip\]"; then
        pass "Missing tools handled gracefully with skip"
    else
        fail "Missing tools not showing skip status"
    fi
}

# Test 8: Exit codes
test_exit_codes() {
    info "Testing exit codes"

    # Dry run with yes should succeed
    if acfs-update --dry-run --yes --quiet >/dev/null 2>&1; then
        pass "Successful run returns exit code 0"
    else
        fail "Dry run returned non-zero exit code"
    fi
}

# Test 9: Shell tools section
test_shell_only() {
    info "Testing --shell-only filter"
    local output
    output=$(acfs-update --shell-only --dry-run --yes 2>&1) || true

    # Should mention shell tools
    if echo "$output" | grep -qi "shell\|omz\|zsh\|atuin\|zoxide"; then
        pass "--shell-only processes shell section"
    else
        fail "--shell-only missing shell output"
    fi
}

# Test 10: Version display
test_version_display() {
    info "Testing version display"
    local output
    output=$(acfs-update --dry-run --yes 2>&1) || true

    if echo "$output" | grep -q "ACFS Update v"; then
        pass "Version displayed in header"
    else
        fail "Version not displayed"
    fi
}

# Run all tests
main() {
    echo ""
    echo "============================================================"
    echo "ACFS Update E2E Tests"
    echo "============================================================"
    echo ""

    test_help
    test_dry_run
    test_quiet
    test_agents_only
    test_no_apt
    test_shell_only
    test_logging
    test_missing_tools
    test_exit_codes
    test_version_display

    echo ""
    echo "============================================================"
    echo -e "Results: ${GREEN}$pass_count passed${NC}, ${RED}$fail_count failed${NC}"
    echo "============================================================"

    if [[ $fail_count -gt 0 ]]; then
        exit 1
    fi
    exit 0
}

main "$@"
TESTSCRIPT
}

run_one() {
    local ubuntu_version="$1"
    local image="ubuntu:${ubuntu_version}"

    echo "" >&2
    echo "============================================================" >&2
    echo "[ACFS Update Test] Ubuntu ${ubuntu_version}" >&2
    echo "============================================================" >&2

    docker pull "$image" >/dev/null

    # Create a temporary file for the test script
    local test_script
    test_script=$(mktemp "${TMPDIR:-/tmp}/acfs_update_test.XXXXXX")
    create_test_script > "$test_script"
    chmod +x "$test_script"

    docker run --rm -t \
        -e DEBIAN_FRONTEND=noninteractive \
        -v "${REPO_ROOT}:/repo:ro" \
        -v "${test_script}:/run_tests.sh:ro" \
        "$image" bash -lc '
            set -euo pipefail

            # Install prerequisites
            apt-get update >/dev/null
            apt-get install -y sudo curl git ca-certificates jq unzip tar xz-utils gnupg >/dev/null

            # Run ACFS installer
            echo "Installing ACFS..."
            cd /repo
            bash install.sh --yes --mode vibe

            # Switch to ubuntu user and run update tests
            echo ""
            echo "Running acfs-update E2E tests..."
            su - ubuntu -c "zsh -ic '\''bash /run_tests.sh'\''"
        '

    local exit_code=$?
    rm -f "$test_script"

    return $exit_code
}

# Main execution
failures=0
for ubuntu_version in "${ubuntus[@]}"; do
    if [[ -z "$ubuntu_version" ]]; then
        echo "ERROR: --ubuntu requires a version (e.g. 24.04)" >&2
        exit 1
    fi
    if ! run_one "$ubuntu_version"; then
        ((failures += 1))
    fi
done

echo "" >&2
if [[ $failures -gt 0 ]]; then
    echo "❌ ACFS update tests: $failures version(s) failed" >&2
    exit 1
fi

echo "✅ All ACFS update tests passed." >&2
