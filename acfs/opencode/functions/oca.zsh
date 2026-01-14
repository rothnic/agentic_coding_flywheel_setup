#!/usr/bin/env zsh
# OpenCode Attach (oca) - Intelligent wrapper around opencode CLI
# Manages per-project server instances and provides seamless TUI attachment

# Source central configuration
OPENCODE_CONFIG_DIR="${OPENCODE_CONFIG_DIR:-${0:A:h}/../config}"
if [[ -f "$OPENCODE_CONFIG_DIR/opencode.conf.sh" ]]; then
  source "$OPENCODE_CONFIG_DIR/opencode.conf.sh"
fi

oca() {
  local project_dir="$PWD"
  local acfs_dir=$(opencode_get_acfs_dir "$project_dir")
  local port=$(opencode_calculate_port "$project_dir")
  local pid_file=$(opencode_get_pid_file "$project_dir")
  
  # Ensure directory exists
  mkdir -p "$acfs_dir"
  
  # Check if server is running
  if ! opencode_is_server_running "$project_dir"; then
    echo "🚀 Starting OpenCode server for $(basename "$project_dir") on port $port..."
    # Start server in background (daemon mode)
    opencode server --port "$port" &>/dev/null &
    local server_pid=$!
    echo "$server_pid" > "$pid_file"
    
    # Wait for server to be ready (poll status endpoint)
    local max_attempts=30
    local attempt=0
    echo "Waiting for server to be ready..."
    while [[ $attempt -lt $max_attempts ]]; do
      if curl -s "http://localhost:$port/health" &>/dev/null || \
         curl -s "http://localhost:$port/status" &>/dev/null || \
         curl -s "http://localhost:$port/" &>/dev/null; then
        echo "✓ Server ready on port $port"
        break
      fi
      sleep 0.5
      ((attempt++))
    done
    
    if [[ $attempt -ge $max_attempts ]]; then
      echo "⚠️  Warning: Server may not be fully ready yet (timed out after 15s)"
    fi
  fi
  
  # Handle different invocation patterns
  if [[ $# -eq 0 ]]; then
    # No arguments: Open TUI attached to server
    opencode attach "http://localhost:$port"
  elif [[ "$1" == "run" ]]; then
    # Explicit run command: execute prompt in TUI mode
    shift
    opencode run "$@"
  else
    # Pass through all other commands with proper context
    opencode "$@"
  fi
}
