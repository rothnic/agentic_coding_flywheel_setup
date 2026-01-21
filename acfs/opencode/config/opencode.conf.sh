#!/usr/bin/env bash
# Central OpenCode Configuration
# This file contains all OpenCode-related constants, paths, and command templates
# Source this file in scripts that need OpenCode configuration

# Version
export OPENCODE_ACFS_VERSION="1.0.0"

# Port Configuration
export OPENCODE_BASE_PORT=4096
export OPENCODE_PORT_RANGE=1000

# Directory Paths (relative to project root or home)
export OPENCODE_ACFS_SUBDIR=".opencode/acfs"
export OPENCODE_GLOBAL_CONFIG="$HOME/.config/opencode"

# File Names
export OPENCODE_PORT_FILE="port"
export OPENCODE_PID_FILE="server.pid"
export OPENCODE_LOG_FILE="server.log"

# Command Templates (for consistent documentation)
export OPENCODE_CMD_ALIAS="oc"
export OPENCODE_CMD_ATTACH="oca"
export OPENCODE_CMD_SERVER="ocs"

# Example Commands (used in tutorials and documentation)
export OPENCODE_EXAMPLE_START="ocs start"
export OPENCODE_EXAMPLE_STOP="ocs stop"
export OPENCODE_EXAMPLE_STATUS="ocs status"
export OPENCODE_EXAMPLE_ATTACH="oca"
export OPENCODE_EXAMPLE_CONTINUE="oca --continue"
export OPENCODE_EXAMPLE_RUN="oca run 'prompt here'"
export OPENCODE_EXAMPLE_LIST="ocs list"
export OPENCODE_EXAMPLE_KILL="ocs kill PROJECT"
export OPENCODE_EXAMPLE_KILL_ALL="ocs kill-all"

# NTM Integration Examples
export OPENCODE_NTM_SPAWN="ntm spawn myproject --oc=2"
export OPENCODE_NTM_SPAWN_MIXED="ntm spawn myproject --cc=1 --oc=1 --cod=1"
export OPENCODE_NTM_SEND='ntm send myproject "command"'
export OPENCODE_NTM_SEND_PATTERN='ntm send myproject --oc "OpenCode specific task"'

# Update Command
export OPENCODE_UPDATE_CMD="opencode update"

# Installation Verification
export OPENCODE_VERSION_CHECK="opencode --version"
export OPENCODE_MODELS_CHECK="opencode models"

# Helper Functions
opencode_get_project_dir() {
  echo "$PWD"
}

opencode_get_acfs_dir() {
  local project_dir="${1:-$PWD}"
  if [[ "$project_dir" == "$HOME" ]]; then
    echo "$HOME/$OPENCODE_ACFS_SUBDIR"
  else
    echo "$project_dir/$OPENCODE_ACFS_SUBDIR"
  fi
}

opencode_calculate_port() {
  local project_dir="${1:-$PWD}"
  local acfs_dir=$(opencode_get_acfs_dir "$project_dir")
  local port_file="$acfs_dir/$OPENCODE_PORT_FILE"
  
  mkdir -p "$acfs_dir"
  
  if [[ ! -f "$port_file" ]]; then
    local hash=$(echo -n "$project_dir" | md5sum | cut -c1-4)
    local port=$((OPENCODE_BASE_PORT + 0x$hash % OPENCODE_PORT_RANGE))
    echo "$port" > "$port_file"
  fi
  
  cat "$port_file"
}

opencode_get_pid_file() {
  local project_dir="${1:-$PWD}"
  local acfs_dir=$(opencode_get_acfs_dir "$project_dir")
  echo "$acfs_dir/$OPENCODE_PID_FILE"
}

opencode_is_server_running() {
  local project_dir="${1:-$PWD}"
  local pid_file=$(opencode_get_pid_file "$project_dir")
  
  if [[ -f "$pid_file" ]]; then
    local pid=$(cat "$pid_file")
    if kill -0 "$pid" 2>/dev/null; then
      return 0  # Running
    fi
  fi
  return 1  # Not running
}
