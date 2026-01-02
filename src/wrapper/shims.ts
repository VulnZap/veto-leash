// src/wrapper/shims.ts

import { mkdtempSync, writeFileSync, rmSync, chmodSync } from 'fs';
import { join, dirname } from 'path';
import { tmpdir } from 'os';
import type { Policy } from '../types.js';

const ACTION_COMMANDS: Record<string, string[]> = {
  delete: ['rm', 'unlink', 'rmdir'],
  modify: ['mv', 'cp', 'touch', 'chmod', 'chown', 'tee'],
  execute: [
    'node',
    'python',
    'python3',
    'bash',
    'sh',
    'npx',
    'pnpm',
    'npm',
    'yarn',
  ],
  read: ['cat', 'less', 'head', 'tail', 'more'],
};

export function createWrapperDir(port: number, policy: Policy): string {
  const dir = mkdtempSync(join(tmpdir(), 'veto-'));

  // Write the Node shim helper script
  const shimHelper = createNodeShimHelper(port, policy.action);
  const shimHelperPath = join(dir, '_veto_check.mjs');
  writeFileSync(shimHelperPath, shimHelper, { mode: 0o755 });

  // Create shims for relevant commands
  const commands = ACTION_COMMANDS[policy.action] || [];
  for (const cmd of commands) {
    const script = createShim(cmd, shimHelperPath);
    writeFileSync(join(dir, cmd), script, { mode: 0o755 });
  }

  // Always wrap git for delete/modify actions
  if (policy.action === 'delete' || policy.action === 'modify') {
    const gitShim = createGitShim(shimHelperPath, policy.action);
    writeFileSync(join(dir, 'git'), gitShim, { mode: 0o755 });
  }

  return dir;
}

/**
 * Node-based shim helper that handles:
 * - Directory walking for recursive deletes
 * - Proper JSON encoding
 * - TCP communication without netcat
 * - Path normalization without realpath
 */
function createNodeShimHelper(port: number, action: string): string {
  return `#!/usr/bin/env node
// veto-leash shim helper - checks files against policy daemon

import { createConnection } from 'net';
import { statSync, readdirSync } from 'fs';
import { relative, resolve, join } from 'path';

const PORT = ${port};
const ACTION = '${action}';
const MAX_FILES = 10000;
const MAX_DEPTH = 50;

// Get all files to check from arguments
const targets = process.argv.slice(2);

async function checkTarget(target) {
  return new Promise((resolve) => {
    const socket = createConnection({ port: PORT, host: '127.0.0.1' }, () => {
      const relPath = relative(process.cwd(), target) || target;
      const req = JSON.stringify({ action: ACTION, target: relPath });
      socket.write(req + '\\n');
    });

    let data = '';
    socket.on('data', (chunk) => {
      data += chunk.toString();
      if (data.includes('\\n')) {
        try {
          const resp = JSON.parse(data.trim());
          resolve(resp.allowed === true);
        } catch {
          resolve(false); // Fail closed
        }
        socket.end();
      }
    });

    socket.on('error', () => resolve(false)); // Fail closed
    socket.setTimeout(1000, () => {
      socket.destroy();
      resolve(false); // Fail closed on timeout
    });
  });
}

// Walk directory recursively and collect all files
function walkDir(dir, depth = 0, files = []) {
  if (depth > MAX_DEPTH || files.length > MAX_FILES) return files;
  
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (files.length > MAX_FILES) break;
      const fullPath = join(dir, entry.name);
      files.push(fullPath);
      if (entry.isDirectory()) {
        walkDir(fullPath, depth + 1, files);
      }
    }
  } catch {
    // Ignore permission errors
  }
  return files;
}

async function main() {
  const filesToCheck = [];

  for (const target of targets) {
    try {
      const resolved = resolve(target);
      const stat = statSync(resolved);
      
      if (stat.isDirectory()) {
        // For directories, check all contained files
        const contained = walkDir(resolved);
        filesToCheck.push(...contained);
      } else {
        filesToCheck.push(resolved);
      }
    } catch {
      // File doesn't exist, let the real command handle the error
      continue;
    }
  }

  // Check all files
  for (const file of filesToCheck) {
    const allowed = await checkTarget(file);
    if (!allowed) {
      process.exit(1);
    }
  }

  process.exit(0);
}

main().catch(() => process.exit(1));
`;
}

/**
 * Bash shim that calls the Node helper for checking,
 * then executes the real command if allowed.
 */
function createShim(cmd: string, helperPath: string): string {
  return `#!/bin/bash
set -e

# Find real binary (skip our wrapper directory)
WRAPPER_DIR="$(dirname "$0")"
REAL_CMD=$(which -a ${cmd} 2>/dev/null | grep -v "$WRAPPER_DIR" | head -1)

if [ -z "$REAL_CMD" ]; then
  echo "veto-leash: cannot find real ${cmd} binary" >&2
  exit 127
fi

# Collect file arguments (skip flags)
FILES=()
for arg in "$@"; do
  [[ "$arg" == -* ]] && continue
  FILES+=("$arg")
done

# Check files with Node helper if any exist
if [ \${#FILES[@]} -gt 0 ]; then
  node "${helperPath}" "\${FILES[@]}" || exit 1
fi

# All approved, run real command
exec "$REAL_CMD" "$@"
`;
}

/**
 * Git shim that handles destructive git commands:
 * - git rm: check file args
 * - git clean: run dry-run, check candidates
 * - git checkout .: block by default (restores files)
 * - git reset --hard: block by default
 */
function createGitShim(helperPath: string, action: string): string {
  return `#!/bin/bash
set -e

# Find real git (skip our wrapper directory)
WRAPPER_DIR="$(dirname "$0")"
REAL_GIT=$(which -a git 2>/dev/null | grep -v "$WRAPPER_DIR" | head -1)

if [ -z "$REAL_GIT" ]; then
  echo "veto-leash: cannot find real git binary" >&2
  exit 127
fi

case "$1" in
  rm)
    # Check file arguments
    FILES=()
    for arg in "\${@:2}"; do
      [[ "$arg" == -* ]] && continue
      FILES+=("$arg")
    done
    if [ \${#FILES[@]} -gt 0 ]; then
      node "${helperPath}" "\${FILES[@]}" || exit 1
    fi
    ;;
    
  clean)
    # Check if it's a destructive clean
    if [[ "$*" == *"-f"* ]] || [[ "$*" == *"-d"* ]] || [[ "$*" == *"-x"* ]]; then
      # Get list of files that would be deleted
      CANDIDATES=$("$REAL_GIT" clean -n "\${@:2}" 2>/dev/null | sed 's/^Would remove //' || true)
      if [ -n "$CANDIDATES" ]; then
        echo "$CANDIDATES" | while read -r file; do
          [ -n "$file" ] && node "${helperPath}" "$file" || exit 1
        done
        # If the while loop exited with error, propagate it
        if [ \${PIPESTATUS[1]} -ne 0 ]; then
          exit 1
        fi
      fi
    fi
    ;;
    
  checkout)
    # Block 'git checkout .' and 'git checkout -- .' (restores tracked files)
    if [[ "$2" == "." ]] || [[ "$2" == "--" && "$3" == "." ]]; then
      echo "veto-leash: 'git checkout .' blocked - would modify protected files" >&2
      echo "           Use 'git checkout <specific-file>' instead" >&2
      exit 1
    fi
    # Check specific file args
    FILES=()
    for arg in "\${@:2}"; do
      [[ "$arg" == -* ]] && continue
      [[ "$arg" == "--" ]] && continue
      [ -e "$arg" ] && FILES+=("$arg")
    done
    if [ \${#FILES[@]} -gt 0 ]; then
      node "${helperPath}" "\${FILES[@]}" || exit 1
    fi
    ;;
    
  reset)
    # Block 'git reset --hard' (destroys uncommitted changes)
    if [[ "$*" == *"--hard"* ]]; then
      echo "veto-leash: 'git reset --hard' blocked - would modify protected files" >&2
      echo "           Use 'git stash' or commit your changes first" >&2
      exit 1
    fi
    ;;
esac

exec "$REAL_GIT" "$@"
`;
}

export function cleanupWrapperDir(dir: string): void {
  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
}
