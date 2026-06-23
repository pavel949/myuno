#!/bin/bash
# SessionStart hook — installs the Graphify knowledge-graph skill for Claude Code.
#
# Runs only in Claude Code on the web (remote) sessions. Idempotent and
# failure-tolerant: it never fails the session (e.g. when offline) — any error
# is logged to stderr and the hook still exits 0.
set -uo pipefail

# Only run in the remote (web) environment; local machines manage their own setup.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# uv installs tools into ~/.local/bin — make sure it is on PATH for this hook
# and persist it for the rest of the session so `graphify` is callable.
export PATH="$HOME/.local/bin:$PATH"
path_line='export PATH="$HOME/.local/bin:$PATH"'
if [ -n "${CLAUDE_ENV_FILE:-}" ] && ! grep -qF "$path_line" "$CLAUDE_ENV_FILE" 2>/dev/null; then
  echo "$path_line" >> "$CLAUDE_ENV_FILE"
fi

# Install the graphify CLI if it is not already present (container state is
# cached across sessions, so this usually no-ops after the first run).
if ! command -v graphify >/dev/null 2>&1; then
  if ! uv tool install graphifyy >/dev/null 2>&1; then
    echo "graphify: CLI install skipped (uv tool install failed — likely offline)" >&2
    exit 0
  fi
fi

# Register the /graphify skill into the Claude Code config (idempotent copy).
if ! graphify install --platform claude >/dev/null 2>&1; then
  echo "graphify: skill registration skipped" >&2
fi

exit 0
