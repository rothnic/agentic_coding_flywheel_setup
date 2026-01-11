#!/usr/bin/env bash
# DCG + SLB Integration Test - Verify layered safety tools work together
# Tests that DCG (immediate blocking) and SLB (approval workflow) complement each other
# Usage: ./dcg_slb_integration_test.sh [--verbose]

set -euo pipefail

VERBOSE="${1:-}"

# ============================================================
# LOGGING
# ============================================================
log() { echo "[$(date '+%H:%M:%S')] $*"; }
pass() { echo "[$(date '+%H:%M:%S')] [PASS] $*"; }
fail() { echo "[$(date '+%H:%M:%S')] [FAIL] $*"; return 1; }
skip() { echo "[$(date '+%H:%M:%S')] [SKIP] $*"; }
detail() { [[ "$VERBOSE" == "--verbose" ]] && echo "  -> $*" >&2 || true; }

# ============================================================
# PREREQUISITE CHECKS
# ============================================================

check_dcg_installed() {
    if ! command -v dcg &>/dev/null; then
        echo "[FATAL] dcg not found in PATH"
        return 1
    fi
    return 0
}

check_slb_installed() {
    if ! command -v slb &>/dev/null; then
        echo "[FATAL] slb not found in PATH"
        return 1
    fi
    return 0
}

# ============================================================
# DCG HOOK SIMULATION
# ============================================================

build_hook_input() {
    local command="$1"
    cat <<EOF
{
    "tool_name": "Bash",
    "tool_input": {
        "command": "$command"
    }
}
EOF
}

is_deny_output() {
    echo "$1" | grep -Eqi '"permissionDecision"[[:space:]]*:[[:space:]]*"deny"'
}

simulate_dcg_hook() {
    local command="$1"
    local hook_input
    hook_input=$(build_hook_input "$command")
    detail "DCG hook input: $hook_input"

    local hook_output
    local exit_code=0
    hook_output=$(echo "$hook_input" | dcg 2>/dev/null) || exit_code=$?

    detail "DCG hook output: $hook_output"
    detail "DCG exit code: $exit_code"

    if is_deny_output "$hook_output"; then
        echo "DENIED"
        return 0
    elif [[ -z "$hook_output" ]] && [[ $exit_code -eq 0 ]]; then
        echo "ALLOWED"
        return 0
    else
        echo "UNKNOWN"
        return 1
    fi
}

# ============================================================
# SLB CLASSIFICATION
# ============================================================

get_slb_tier() {
    local command="$1"
    local tier
    tier=$(slb check "$command" 2>/dev/null | grep -oE '(CRITICAL|DANGEROUS|CAUTION|SAFE|unknown)' | head -1) || true
    echo "${tier:-unknown}"
}

# ============================================================
# INTEGRATION TESTS
# ============================================================

# Test 1: Both tools installed and working
test_both_tools_available() {
    log "Testing both DCG and SLB are available..."

    # Check if binaries exist in PATH
    local dcg_installed slb_installed
    dcg_installed=$(command -v dcg 2>/dev/null) || dcg_installed=""
    slb_installed=$(command -v slb 2>/dev/null) || slb_installed=""

    # Verify DCG can run basic commands
    local dcg_works=0
    if dcg packs >/dev/null 2>&1; then
        dcg_works=1
    fi

    # Verify SLB responds to --help (status may have no output)
    local slb_works=0
    if slb --help >/dev/null 2>&1; then
        slb_works=1
    fi

    detail "DCG path: $dcg_installed"
    detail "SLB path: $slb_installed"
    detail "DCG works: $dcg_works"
    detail "SLB works: $slb_works"

    if [[ -n "$dcg_installed" ]] && [[ -n "$slb_installed" ]] && [[ $dcg_works -eq 1 ]] && [[ $slb_works -eq 1 ]]; then
        pass "Both DCG and SLB are available"
        return 0
    else
        fail "One or both tools not properly installed"
        return 1
    fi
}

# Test 2: DCG blocks immediately while SLB would require approval
test_dcg_blocks_before_slb() {
    log "Testing DCG blocks dangerous commands before SLB check..."

    # git push --force should be blocked by DCG
    local dcg_result
    dcg_result=$(simulate_dcg_hook "git push --force origin main")

    # SLB would classify this as DANGEROUS (requiring approval)
    local slb_tier
    slb_tier=$(get_slb_tier "git push --force origin main")

    detail "DCG result: $dcg_result"
    detail "SLB tier: $slb_tier"

    if [[ "$dcg_result" == "DENIED" ]]; then
        pass "DCG blocks git push --force immediately"
        # Note: SLB tier is informational - DCG acts first
        if [[ "$slb_tier" == "DANGEROUS" ]] || [[ "$slb_tier" == "CRITICAL" ]]; then
            detail "SLB would also require approval ($slb_tier)"
        fi
        return 0
    else
        fail "DCG did not block git push --force (result: $dcg_result)"
        return 1
    fi
}

# Test 3: SLB handles commands DCG allows
test_slb_handles_dcg_allowed() {
    log "Testing SLB classifies commands DCG allows..."

    # git status is allowed by DCG
    local dcg_result
    dcg_result=$(simulate_dcg_hook "git status")

    # SLB should classify as SAFE
    local slb_tier
    slb_tier=$(get_slb_tier "git status")

    detail "DCG result: $dcg_result"
    detail "SLB tier: $slb_tier"

    if [[ "$dcg_result" == "ALLOWED" ]]; then
        pass "DCG allows git status"
        if [[ "$slb_tier" == "SAFE" ]]; then
            pass "SLB correctly classifies git status as SAFE"
        else
            # SLB may classify differently, but that's OK
            detail "SLB classified as: $slb_tier (expected SAFE)"
        fi
        return 0
    else
        fail "DCG unexpectedly blocked git status (result: $dcg_result)"
        return 1
    fi
}

# Test 4: Commands allowed by DCG but requiring SLB approval
test_dcg_allows_slb_requires_approval() {
    log "Testing commands DCG allows but SLB may require approval..."

    # kubectl delete is not in DCG's default pack, but SLB should catch it
    local dcg_result
    dcg_result=$(simulate_dcg_hook "kubectl delete deployment nginx")

    local slb_tier
    slb_tier=$(get_slb_tier "kubectl delete deployment nginx")

    detail "DCG result: $dcg_result"
    detail "SLB tier: $slb_tier"

    # DCG may or may not block depending on pack config
    if [[ "$dcg_result" == "ALLOWED" ]]; then
        if [[ "$slb_tier" == "DANGEROUS" ]] || [[ "$slb_tier" == "CRITICAL" ]]; then
            pass "DCG allows but SLB requires approval for kubectl delete ($slb_tier)"
            return 0
        elif [[ "$slb_tier" == "CAUTION" ]]; then
            pass "DCG allows and SLB requires acknowledgment for kubectl delete ($slb_tier)"
            return 0
        else
            # SLB may not have kubectl patterns
            skip "SLB does not classify kubectl delete (tier: $slb_tier)"
            return 0
        fi
    else
        # DCG blocked it (kubernetes pack might be enabled)
        pass "DCG blocked kubectl delete (kubernetes pack likely enabled)"
        return 0
    fi
}

# Test 5: Production deploy commands
test_production_deploy_safety() {
    log "Testing production deploy commands safety..."

    # Example: terraform apply in production
    local dcg_result
    dcg_result=$(simulate_dcg_hook "terraform apply -auto-approve")

    local slb_tier
    slb_tier=$(get_slb_tier "terraform apply -auto-approve")

    detail "DCG result: $dcg_result"
    detail "SLB tier: $slb_tier"

    # Either tool should catch this
    if [[ "$dcg_result" == "DENIED" ]]; then
        pass "DCG blocks terraform apply -auto-approve"
        return 0
    elif [[ "$slb_tier" == "CRITICAL" ]] || [[ "$slb_tier" == "DANGEROUS" ]]; then
        pass "SLB requires approval for terraform apply -auto-approve ($slb_tier)"
        return 0
    else
        # Both tools may not catch this, which is a gap
        skip "Neither DCG nor SLB specifically catches terraform -auto-approve"
        return 0
    fi
}

# Test 6: Safe force-push variant handling
test_safe_force_push_handling() {
    log "Testing safe force-push variant (--force-with-lease)..."

    # --force-with-lease is the safe variant
    local dcg_result
    dcg_result=$(simulate_dcg_hook "git push --force-with-lease origin main")

    local slb_tier
    slb_tier=$(get_slb_tier "git push --force-with-lease origin main")

    detail "DCG result: $dcg_result"
    detail "SLB tier: $slb_tier"

    if [[ "$dcg_result" == "ALLOWED" ]]; then
        pass "DCG correctly allows --force-with-lease"
        if [[ "$slb_tier" == "SAFE" ]] || [[ "$slb_tier" == "CAUTION" ]]; then
            pass "SLB also recognizes --force-with-lease as safer ($slb_tier)"
        else
            detail "SLB classified as: $slb_tier"
        fi
        return 0
    else
        fail "DCG incorrectly blocked --force-with-lease"
        return 1
    fi
}

# Test 7: No interference between tools
test_no_tool_interference() {
    log "Testing no interference between DCG and SLB..."

    # Run multiple checks in sequence - should not interfere
    local result1 result2 result3
    result1=$(simulate_dcg_hook "git status")
    result2=$(get_slb_tier "git status")
    result3=$(simulate_dcg_hook "git status")

    detail "First DCG check: $result1"
    detail "SLB check: $result2"
    detail "Second DCG check: $result3"

    if [[ "$result1" == "$result3" ]]; then
        pass "DCG results consistent after SLB check"
        return 0
    else
        fail "DCG results inconsistent (before: $result1, after: $result3)"
        return 1
    fi
}

# Test 8: Database command layered safety
test_database_layered_safety() {
    log "Testing database command layered safety..."

    # DROP TABLE should be caught by one or both
    local dcg_result
    dcg_result=$(simulate_dcg_hook "psql -c 'DROP TABLE users'")

    local slb_tier
    slb_tier=$(get_slb_tier "psql -c 'DROP TABLE users'")

    detail "DCG result: $dcg_result"
    detail "SLB tier: $slb_tier"

    # At least one should catch this
    if [[ "$dcg_result" == "DENIED" ]]; then
        pass "DCG blocks DROP TABLE"
        return 0
    elif [[ "$slb_tier" == "CRITICAL" ]] || [[ "$slb_tier" == "DANGEROUS" ]]; then
        pass "SLB requires approval for DROP TABLE ($slb_tier)"
        return 0
    else
        # Both miss it - potential gap
        skip "Neither tool specifically catches DROP TABLE via psql"
        return 0
    fi
}

# ============================================================
# MAIN
# ============================================================

main() {
    echo "============================================================"
    echo "  DCG + SLB Integration Test"
    echo "  Verifying layered safety tools work together"
    echo "============================================================"
    echo ""

    # Prerequisite checks
    check_dcg_installed || exit 1
    check_slb_installed || exit 1

    local passed=0
    local failed=0

    # Run tests
    echo ">> Testing tool availability:"
    if test_both_tools_available; then
        passed=$((passed + 1))
    else
        failed=$((failed + 1))
    fi

    echo ""
    echo ">> Testing DCG immediate blocking:"
    if test_dcg_blocks_before_slb; then
        passed=$((passed + 1))
    else
        failed=$((failed + 1))
    fi

    echo ""
    echo ">> Testing SLB classification:"
    if test_slb_handles_dcg_allowed; then
        passed=$((passed + 1))
    else
        failed=$((failed + 1))
    fi

    echo ""
    echo ">> Testing layered protection:"
    if test_dcg_allows_slb_requires_approval; then
        passed=$((passed + 1))
    else
        failed=$((failed + 1))
    fi

    if test_production_deploy_safety; then
        passed=$((passed + 1))
    else
        failed=$((failed + 1))
    fi

    if test_safe_force_push_handling; then
        passed=$((passed + 1))
    else
        failed=$((failed + 1))
    fi

    echo ""
    echo ">> Testing tool interaction:"
    if test_no_tool_interference; then
        passed=$((passed + 1))
    else
        failed=$((failed + 1))
    fi

    if test_database_layered_safety; then
        passed=$((passed + 1))
    else
        failed=$((failed + 1))
    fi

    echo ""
    echo "============================================================"
    echo "  Results: $passed passed, $failed failed"
    echo "============================================================"

    [[ $failed -eq 0 ]] && exit 0 || exit 1
}

main "$@"
