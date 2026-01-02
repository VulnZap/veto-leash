// src/native/claude-code.ts
// Claude Code native hook integration
// Generates PreToolUse hooks that integrate directly with Claude Code's permission system

import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import type { Policy } from '../types.js';
import { COLORS, SYMBOLS } from '../ui/colors.js';

const CLAUDE_CONFIG_DIR = join(homedir(), '.claude');
const CLAUDE_HOOKS_DIR = join(CLAUDE_CONFIG_DIR, 'hooks', 'veto-leash');
const CLAUDE_SETTINGS_FILE = join(CLAUDE_CONFIG_DIR, 'settings.json');

interface ClaudeSettings {
  hooks?: {
    PreToolUse?: Array<{
      matcher: string;
      hooks: Array<{
        type: string;
        command: string;
      }>;
    }>;
  };
  [key: string]: unknown;
}

/**
 * Install veto-leash as a Claude Code PreToolUse hook
 */
export async function installClaudeCodeHook(): Promise<void> {
  console.log(`\n${COLORS.info}Installing veto-leash for Claude Code...${COLORS.reset}\n`);

  // Create hooks directory
  mkdirSync(CLAUDE_HOOKS_DIR, { recursive: true });
  mkdirSync(join(CLAUDE_HOOKS_DIR, 'policies'), { recursive: true });

  // Write the validator script (Python for cross-platform compatibility)
  const validatorPath = join(CLAUDE_HOOKS_DIR, 'validator.py');
  writeFileSync(validatorPath, VALIDATOR_SCRIPT, { mode: 0o755 });
  console.log(`  ${COLORS.success}${SYMBOLS.success}${COLORS.reset} Created validator: ${validatorPath}`);

  // Update Claude settings
  let settings: ClaudeSettings = {};
  if (existsSync(CLAUDE_SETTINGS_FILE)) {
    try {
      settings = JSON.parse(readFileSync(CLAUDE_SETTINGS_FILE, 'utf-8'));
    } catch {
      // Start fresh if parse fails
    }
  }

  // Ensure hooks structure exists
  if (!settings.hooks) {
    settings.hooks = {};
  }
  if (!settings.hooks.PreToolUse) {
    settings.hooks.PreToolUse = [];
  }

  // Check if veto-leash hook already exists
  const existingIndex = settings.hooks.PreToolUse.findIndex(
    (h) => h.hooks.some((cmd) => cmd.command.includes('veto-leash'))
  );

  const hookEntry = {
    matcher: 'Bash|Write|Edit|MultiEdit',
    hooks: [
      {
        type: 'command',
        command: `python3 "${validatorPath}"`,
      },
    ],
  };

  if (existingIndex >= 0) {
    settings.hooks.PreToolUse[existingIndex] = hookEntry;
    console.log(`  ${COLORS.success}${SYMBOLS.success}${COLORS.reset} Updated hook in settings`);
  } else {
    settings.hooks.PreToolUse.push(hookEntry);
    console.log(`  ${COLORS.success}${SYMBOLS.success}${COLORS.reset} Added hook to settings`);
  }

  // Write settings back
  mkdirSync(CLAUDE_CONFIG_DIR, { recursive: true });
  writeFileSync(CLAUDE_SETTINGS_FILE, JSON.stringify(settings, null, 2));
  console.log(`  ${COLORS.success}${SYMBOLS.success}${COLORS.reset} Updated: ${CLAUDE_SETTINGS_FILE}`);

  console.log(`\n${COLORS.success}${SYMBOLS.success} veto-leash installed for Claude Code${COLORS.reset}\n`);
  console.log(`To add a policy:`);
  console.log(`  ${COLORS.dim}leash add "don't delete test files"${COLORS.reset}\n`);
  console.log(`To remove:`);
  console.log(`  ${COLORS.dim}leash uninstall cc${COLORS.reset}\n`);
}

/**
 * Add a policy to Claude Code's veto-leash policies
 */
export async function addClaudeCodePolicy(policy: Policy, name: string): Promise<void> {
  const policiesDir = join(CLAUDE_HOOKS_DIR, 'policies');
  mkdirSync(policiesDir, { recursive: true });

  const policyFile = join(policiesDir, `${name}.json`);
  writeFileSync(policyFile, JSON.stringify(policy, null, 2));
  console.log(`${COLORS.success}${SYMBOLS.success}${COLORS.reset} Policy saved: ${policyFile}`);
}

/**
 * Uninstall veto-leash from Claude Code
 */
export async function uninstallClaudeCodeHook(): Promise<void> {
  console.log(`\n${COLORS.info}Removing veto-leash from Claude Code...${COLORS.reset}\n`);

  // Remove from settings
  if (existsSync(CLAUDE_SETTINGS_FILE)) {
    try {
      const settings: ClaudeSettings = JSON.parse(
        readFileSync(CLAUDE_SETTINGS_FILE, 'utf-8')
      );
      
      if (settings.hooks?.PreToolUse) {
        settings.hooks.PreToolUse = settings.hooks.PreToolUse.filter(
          (h) => !h.hooks.some((cmd) => cmd.command.includes('veto-leash'))
        );
        writeFileSync(CLAUDE_SETTINGS_FILE, JSON.stringify(settings, null, 2));
        console.log(`  ${COLORS.success}${SYMBOLS.success}${COLORS.reset} Removed hook from settings`);
      }
    } catch {
      console.log(`  ${COLORS.warning}${SYMBOLS.warning}${COLORS.reset} Could not parse settings file`);
    }
  }

  console.log(`\n${COLORS.success}${SYMBOLS.success} veto-leash removed from Claude Code${COLORS.reset}\n`);
  console.log(`${COLORS.dim}Note: Policy files in ${CLAUDE_HOOKS_DIR} were preserved.${COLORS.reset}\n`);
}

/**
 * Python validator script that runs as a Claude Code PreToolUse hook.
 * Uses Python for maximum cross-platform compatibility.
 */
const VALIDATOR_SCRIPT = `#!/usr/bin/env python3
"""
veto-leash validator for Claude Code PreToolUse hooks.
Checks tool inputs against configured policies.

Exit codes:
  0 = allow
  2 = block (stderr shown to Claude)
"""

import json
import sys
import os
import re
from pathlib import Path
from fnmatch import fnmatch

POLICIES_DIR = Path(__file__).parent / "policies"

def load_policies():
    """Load all policy files from the policies directory."""
    policies = []
    if POLICIES_DIR.exists():
        for f in POLICIES_DIR.glob("*.json"):
            try:
                policies.append(json.loads(f.read_text()))
            except:
                pass
    return policies

def normalize_path(p):
    """Normalize path for pattern matching."""
    # Convert to forward slashes for consistent matching
    return str(p).replace("\\\\", "/")

def matches_pattern(target, pattern):
    """Check if target matches a glob pattern."""
    target = normalize_path(target)
    pattern = normalize_path(pattern)
    
    # Also try matching just the basename
    basename = os.path.basename(target)
    
    return fnmatch(target, pattern) or fnmatch(basename, pattern)

def is_protected(target, policy):
    """Check if target is protected by policy."""
    # Must match at least one include pattern
    matches_include = any(
        matches_pattern(target, p) for p in policy.get("include", [])
    )
    if not matches_include:
        return False
    
    # Must not match any exclude pattern
    matches_exclude = any(
        matches_pattern(target, p) for p in policy.get("exclude", [])
    )
    
    return not matches_exclude

def parse_bash_targets(command, action):
    """Extract file targets from bash commands."""
    targets = []
    
    # rm command patterns
    if action == "delete":
        # Match: rm, rm -rf, rm -f, etc.
        rm_match = re.search(r'\\brm\\s+(?:-[rfiv]+\\s+)*(.+)', command)
        if rm_match:
            args = rm_match.group(1)
            # Split on spaces, filter out flags
            for arg in args.split():
                if not arg.startswith('-'):
                    targets.append(arg)
        
        # git rm
        git_rm_match = re.search(r'\\bgit\\s+rm\\s+(?:-[rf]+\\s+)*(.+)', command)
        if git_rm_match:
            for arg in git_rm_match.group(1).split():
                if not arg.startswith('-'):
                    targets.append(arg)
    
    # mv/cp for modify action
    elif action == "modify":
        mv_match = re.search(r'\\b(mv|cp)\\s+(?:-[a-z]+\\s+)*(.+)', command)
        if mv_match:
            args = mv_match.group(2).split()
            # First non-flag arg is source
            for arg in args:
                if not arg.startswith('-'):
                    targets.append(arg)
                    break
    
    return targets

def get_action_for_tool(tool_name):
    """Map Claude Code tool names to veto-leash actions."""
    mapping = {
        "Bash": ["delete", "modify", "execute"],
        "Write": ["modify"],
        "Edit": ["modify"],
        "MultiEdit": ["modify"],
        "Read": ["read"],
    }
    return mapping.get(tool_name, [])

def main():
    try:
        input_data = json.load(sys.stdin)
    except json.JSONDecodeError:
        sys.exit(0)  # Allow if can't parse
    
    tool_name = input_data.get("tool_name", "")
    tool_input = input_data.get("tool_input", {})
    cwd = input_data.get("cwd", os.getcwd())
    
    policies = load_policies()
    if not policies:
        sys.exit(0)  # No policies = allow all
    
    # Extract targets based on tool
    targets = []
    
    if tool_name == "Bash":
        command = tool_input.get("command", "")
        for policy in policies:
            action = policy.get("action", "modify")
            targets.extend(parse_bash_targets(command, action))
    
    elif tool_name in ("Write", "Edit", "MultiEdit"):
        file_path = tool_input.get("file_path", "")
        if file_path:
            targets.append(file_path)
    
    if not targets:
        sys.exit(0)  # No targets = allow
    
    # Check each target against policies
    for target in targets:
        # Make relative to cwd if absolute
        try:
            target_path = Path(target)
            if not target_path.is_absolute():
                target_path = Path(cwd) / target
            rel_target = str(target_path.relative_to(cwd))
        except:
            rel_target = target
        
        for policy in policies:
            tool_actions = get_action_for_tool(tool_name)
            policy_action = policy.get("action", "modify")
            
            if policy_action in tool_actions:
                if is_protected(rel_target, policy):
                    # Block and report to Claude
                    desc = policy.get("description", "Protected file")
                    print(f"veto-leash: BLOCKED {policy_action}", file=sys.stderr)
                    print(f"  Target: {rel_target}", file=sys.stderr)
                    print(f"  Policy: {desc}", file=sys.stderr)
                    print(f"  Filesystem unchanged.", file=sys.stderr)
                    sys.exit(2)
    
    sys.exit(0)  # Allow

if __name__ == "__main__":
    main()
`;
