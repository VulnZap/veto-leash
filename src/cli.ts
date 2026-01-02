#!/usr/bin/env node
// src/cli.ts

import { compile } from './compiler/index.js';
import { VetoDaemon } from './wrapper/daemon.js';
import { createWrapperDir, cleanupWrapperDir } from './wrapper/shims.js';
import { spawnAgent } from './wrapper/spawn.js';
import { COLORS, SYMBOLS, createSpinner } from './ui/colors.js';
import { clearCache } from './compiler/cache.js';
import {
  installClaudeCodeHook,
  addClaudeCodePolicy,
  uninstallClaudeCodeHook,
} from './native/claude-code.js';
import {
  installOpenCodePermissions,
  savePolicy,
  listPolicies,
  uninstallOpenCodePermissions,
} from './native/opencode.js';
import type { Policy } from './types.js';

const VERSION = '0.1.0';

async function main() {
  const args = process.argv.slice(2);

  // Handle flags
  if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    printHelp();
    process.exit(0);
  }

  if (args.includes('--version') || args.includes('-v')) {
    console.log(`veto-leash v${VERSION}`);
    process.exit(0);
  }

  const command = args[0];

  // Route commands
  switch (command) {
    case 'watch':
      await runWatchdog(args.slice(1).join(' '));
      break;
    case 'explain':
      await runExplain(args.slice(1).join(' '));
      break;
    case 'status':
      runStatus();
      break;
    case 'install':
      await runInstall(args[1]);
      break;
    case 'add':
      await runAdd(args.slice(1).join(' '));
      break;
    case 'list':
      runList();
      break;
    case 'uninstall':
      await runUninstall(args[1]);
      break;
    case 'clear':
      runClear();
      break;
    default:
      // Default: wrap agent
      await runWrapper(command, args.slice(1).join(' '));
  }
}

async function runWrapper(agent: string, restriction: string) {
  if (!restriction) {
    console.error(
      `${COLORS.error}${SYMBOLS.error} Error: No restriction provided${COLORS.reset}\n`
    );
    console.log('Usage: leash <agent> "<restriction>"\n');
    console.log("Example: leash cc \"don't delete test files\"");
    process.exit(1);
  }

  // Check for API key (only needed if not using builtins)
  // We'll check later if LLM is actually needed

  // Compile restriction
  const spinner = createSpinner('Compiling restriction...');
  let policy: Policy;

  try {
    policy = await compile(restriction);
    spinner.stop();
  } catch (err) {
    spinner.stop();
    if ((err as Error).message === 'GEMINI_API_KEY not set') {
      console.error(
        `${COLORS.error}${SYMBOLS.error} Error: GEMINI_API_KEY not set${COLORS.reset}\n`
      );
      console.log('  Get a free API key (15 requests/min, 1M tokens/month):');
      console.log('  https://aistudio.google.com/apikey\n');
      console.log('  Then run:');
      console.log('  export GEMINI_API_KEY="your-key"\n');
      process.exit(1);
    }
    console.error(
      `${COLORS.error}${SYMBOLS.error} Error: Failed to compile restriction${COLORS.reset}\n`
    );
    console.log(`  ${(err as Error).message}\n`);
    process.exit(1);
  }

  // Print startup message
  console.log(
    `\n${COLORS.success}${SYMBOLS.success} veto-leash active${COLORS.reset}\n`
  );
  console.log(`  ${COLORS.dim}Policy:${COLORS.reset} ${policy.description}`);
  console.log(`  ${COLORS.dim}Action:${COLORS.reset} ${policy.action}\n`);
  console.log(`  ${COLORS.dim}Protecting:${COLORS.reset}`);
  console.log(`    ${policy.include.slice(0, 5).join('  ')}`);
  if (policy.include.length > 5) {
    console.log(
      `    ${COLORS.dim}...and ${policy.include.length - 5} more${COLORS.reset}`
    );
  }
  if (policy.exclude.length > 0) {
    console.log(`\n  ${COLORS.dim}Allowing (exceptions):${COLORS.reset}`);
    console.log(`    ${policy.exclude.join('  ')}`);
  }
  console.log(`\n  Press Ctrl+C to exit\n`);

  // Start daemon
  const daemon = new VetoDaemon(policy, agent);
  const port = await daemon.start();

  // Create wrapper scripts
  const wrapperDir = createWrapperDir(port, policy);

  // Handle cleanup
  const cleanup = () => {
    daemon.stop();
    cleanupWrapperDir(wrapperDir);
  };

  process.on('SIGINT', () => {
    cleanup();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    cleanup();
    process.exit(0);
  });

  // Spawn agent
  spawnAgent(agent, wrapperDir, port, (code) => {
    cleanup();
    process.exit(code);
  });
}

async function runExplain(restriction: string) {
  if (!restriction) {
    console.error(
      `${COLORS.error}${SYMBOLS.error} Error: No restriction provided${COLORS.reset}`
    );
    process.exit(1);
  }

  const spinner = createSpinner('Analyzing restriction...');
  let policy: Policy;

  try {
    policy = await compile(restriction);
    spinner.stop();
  } catch (err) {
    spinner.stop();
    if ((err as Error).message === 'GEMINI_API_KEY not set') {
      console.error(
        `${COLORS.error}${SYMBOLS.error} Error: GEMINI_API_KEY not set${COLORS.reset}\n`
      );
      console.log('  Get a free API key: https://aistudio.google.com/apikey\n');
      process.exit(1);
    }
    throw err;
  }

  console.log(`\n${COLORS.bold}Policy Preview${COLORS.reset}`);
  console.log('\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n');
  console.log(`Restriction: "${restriction}"\n`);
  console.log(`Action: ${policy.action}\n`);
  console.log(`Patterns:`);
  console.log(
    `  ${COLORS.dim}include:${COLORS.reset} ${policy.include.join(', ')}`
  );
  console.log(
    `  ${COLORS.dim}exclude:${COLORS.reset} ${policy.exclude.join(', ') || '(none)'}`
  );
  console.log(`\nDescription: ${policy.description}`);
  console.log(`\nRun 'leash <agent> "${restriction}"' to enforce.\n`);
}

async function runWatchdog(restriction: string) {
  console.log(
    `${COLORS.warning}${SYMBOLS.warning} Watchdog mode not yet implemented${COLORS.reset}`
  );
  console.log('Use wrapper mode: leash cc "' + restriction + '"');
}

function runStatus() {
  console.log(`\n${COLORS.bold}veto-leash Status${COLORS.reset}`);
  console.log('\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\n');
  console.log('No active sessions.\n');
}

async function runInstall(agent: string) {
  const normalized = normalizeAgent(agent);

  switch (normalized) {
    case 'claude-code':
      await installClaudeCodeHook();
      break;
    case 'opencode':
      await installOpenCodePermissions('project');
      break;
    case 'opencode-global':
      await installOpenCodePermissions('global');
      break;
    default:
      console.error(
        `${COLORS.error}${SYMBOLS.error} Unknown agent: ${agent}${COLORS.reset}`
      );
      console.log(`\nSupported agents for native install:`);
      console.log(`  ${COLORS.dim}cc, claude-code${COLORS.reset}    Claude Code`);
      console.log(`  ${COLORS.dim}oc, opencode${COLORS.reset}       OpenCode (project config)`);
      console.log(`  ${COLORS.dim}oc-global${COLORS.reset}          OpenCode (global config)\n`);
      process.exit(1);
  }
}

async function runAdd(restriction: string) {
  if (!restriction) {
    console.error(
      `${COLORS.error}${SYMBOLS.error} Error: No restriction provided${COLORS.reset}`
    );
    process.exit(1);
  }

  const spinner = createSpinner('Compiling restriction...');
  let policy: Policy;

  try {
    policy = await compile(restriction);
    spinner.stop();
  } catch (err) {
    spinner.stop();
    if ((err as Error).message === 'GEMINI_API_KEY not set') {
      console.error(
        `${COLORS.error}${SYMBOLS.error} Error: GEMINI_API_KEY not set${COLORS.reset}\n`
      );
      console.log('  Get a free API key: https://aistudio.google.com/apikey\n');
      process.exit(1);
    }
    throw err;
  }

  // Save to veto-leash config (used by OpenCode install)
  savePolicy(restriction, policy);

  // Also save to Claude Code policies dir if it exists
  const policyName = restriction
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
  await addClaudeCodePolicy(policy, policyName);

  console.log(`\n${COLORS.success}${SYMBOLS.success} Policy added${COLORS.reset}\n`);
  console.log(`  ${COLORS.dim}Restriction:${COLORS.reset} "${restriction}"`);
  console.log(`  ${COLORS.dim}Action:${COLORS.reset} ${policy.action}`);
  console.log(`  ${COLORS.dim}Patterns:${COLORS.reset} ${policy.include.join(', ')}`);
  console.log(`\nTo enforce:`);
  console.log(`  ${COLORS.dim}leash install cc${COLORS.reset}   (Claude Code - ready immediately)`);
  console.log(`  ${COLORS.dim}leash install oc${COLORS.reset}   (OpenCode - regenerate config)\n`);
}

function runList() {
  listPolicies();
}

async function runUninstall(agent: string) {
  const normalized = normalizeAgent(agent);

  switch (normalized) {
    case 'claude-code':
      await uninstallClaudeCodeHook();
      break;
    case 'opencode':
      await uninstallOpenCodePermissions('project');
      break;
    case 'opencode-global':
      await uninstallOpenCodePermissions('global');
      break;
    default:
      console.error(
        `${COLORS.error}${SYMBOLS.error} Unknown agent: ${agent}${COLORS.reset}`
      );
      process.exit(1);
  }
}

function normalizeAgent(agent: string): string {
  switch (agent?.toLowerCase()) {
    case 'cc':
    case 'claude':
    case 'claude-code':
      return 'claude-code';
    case 'oc':
    case 'opencode':
      return 'opencode';
    case 'oc-global':
    case 'opencode-global':
      return 'opencode-global';
    default:
      return agent || '';
  }
}

function runClear() {
  clearCache();
  console.log(`${COLORS.success}${SYMBOLS.success} Cache cleared${COLORS.reset}`);
}

function printHelp() {
  console.log(`
${COLORS.bold}veto-leash${COLORS.reset} \u2014 Semantic permissions for AI coding agents

${COLORS.bold}USAGE${COLORS.reset}
  leash <agent> "<restriction>"     Wrap agent with policy enforcement
  leash explain "<restriction>"     Preview what a restriction protects
  leash add "<restriction>"         Save a policy for native install
  leash install <agent>             Install native hooks/config
  leash uninstall <agent>           Remove native hooks/config
  leash list                        Show saved policies
  leash watch "<restriction>"       Background filesystem protection
  leash status                      Show active sessions
  leash clear                       Clear compilation cache

${COLORS.bold}AGENTS${COLORS.reset}
  cc, claude-code    Claude Code (native hooks)
  oc, opencode       OpenCode (project config)
  oc-global          OpenCode (global config)
  cursor             Cursor (wrapper mode)
  aider              Aider (wrapper mode)
  <any>              Any CLI command (wrapper mode)

${COLORS.bold}EXAMPLES${COLORS.reset}
  ${COLORS.dim}# Wrapper mode (intercepts commands)${COLORS.reset}
  leash cc "don't delete test files"
  leash opencode "protect .env"

  ${COLORS.dim}# Native mode (integrates with agent's permission system)${COLORS.reset}
  leash add "don't delete test files"
  leash add "protect .env"
  leash install cc

  ${COLORS.dim}# Preview policy without installing${COLORS.reset}
  leash explain "no database migrations"

${COLORS.bold}ENVIRONMENT${COLORS.reset}
  GEMINI_API_KEY     Required for custom restrictions.
                     Get free at https://aistudio.google.com/apikey

${COLORS.bold}MORE INFO${COLORS.reset}
  https://github.com/plaw-inc/veto-leash
`);
}

main().catch((err) => {
  console.error(
    `${COLORS.error}${SYMBOLS.error} Error: ${err.message}${COLORS.reset}`
  );
  process.exit(1);
});
