#!/usr/bin/env bash
# DCG Smoke Test - Quick validation of DCG installation
# Exit codes: 0=pass, 1=fail, 2=skip
# Usage: ./dcg_smoke_test.sh

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

pass() { echo -e "${GREEN}[PASS]${NC} $1"; }
fail() { echo -e "${RED}[FAIL]${NC} $1"; exit 1; }
skip() { echo -e "${YELLOW}[SKIP]${NC} $1 (skipped)"; }

echo "============================================================"
echo "  DCG Smoke Test"
echo "============================================================"
echo ""

# Test 1: Binary exists
echo "1. Checking DCG binary..."
if command -v dcg &>/dev/null; then
    pass "dcg binary found: $(command -v dcg)"
else
    fail "dcg binary not found in PATH"
fi

# Test 2: Version check
echo "2. Checking DCG version..."
if dcg_version=$(dcg --version 2>/dev/null | head -1); then
    pass "dcg version: $dcg_version"
else
    fail "dcg --version failed"
fi

# Test 3: Hook status
echo "3. Checking hook registration..."
if dcg doctor --format json 2>/dev/null | grep -q '"hook_registered":true'; then
    pass "Hook is registered"
else
    # Not a fatal error - might be intentional
    skip "Hook not registered (run 'dcg install' to register)"
fi

# Test 4: Quick block test
echo "4. Testing command blocking..."
block_output=$(dcg test 'git reset --hard' 2>&1) || true
if echo "$block_output" | grep -qi "deny\|block"; then
    pass "Dangerous command correctly identified"
else
    fail "DCG did not identify dangerous command. Output: $block_output"
fi

# Test 5: Quick allow test
echo "5. Testing safe command..."
allow_output=$(dcg test 'git status' 2>&1) || true
if echo "$allow_output" | grep -qi "allow"; then
    pass "Safe command correctly allowed"
else
    fail "DCG incorrectly blocked safe command. Output: $allow_output"
fi

echo ""
echo "============================================================"
echo -e "  ${GREEN}All smoke tests passed!${NC}"
echo "============================================================"
exit 0
