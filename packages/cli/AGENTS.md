# CLI AGENTS.md

> **veto-cli** controls what AI coding assistants (Claude, Cursor, Windsurf, etc.) can do. It parses `.veto` policy files and hooks into agent configs.

## Commands

```bash
pnpm build                          # Build TypeScript
pnpm build:go                       # Build Go TUI binary
pnpm test                           # Run tests (turbo-cached)
pnpm test -- test/matcher           # Run tests in specific file
pnpm dev                            # Run CLI directly with tsx
pnpm typecheck                      # Type check
```

## Architecture

```
src/
├── cli.ts                   # ENTRY POINT - command dispatch
├── errors.ts                # Structured error classes (CLIError, ConfigError, etc.)
├── config/                  # Configuration loading
│   ├── loader.ts            # Find and load .veto files
│   ├── veto-parser.ts       # Parse .veto policy syntax
│   └── schema.ts            # Config validation
├── compiler/                # Policy compilation
│   ├── builtins.ts          # Built-in security policies
│   ├── content.ts           # Content pattern detection
│   ├── commands.ts          # Command pattern matching
│   └── llm.ts               # LLM-assisted policy generation
├── native/                  # AGENT INTEGRATIONS
│   ├── index.ts             # installAgent(), uninstallAgent()
│   ├── claude-code.ts       # Claude Code hooks
│   ├── cursor.ts            # Cursor hooks
│   ├── windsurf.ts          # Windsurf hooks
│   ├── opencode.ts          # OpenCode plugin
│   └── aider.ts             # Aider config
├── ast/                     # Code analysis (tree-sitter)
│   ├── parser.ts            # Multi-language parsing
│   └── checker.ts           # Security checks
├── matcher.ts               # Glob pattern matching for policies
├── wrapper/                 # Process wrapping
│   ├── daemon.ts            # Background validation daemon
│   └── sessions.ts          # Session tracking
└── types.ts                 # Policy, Rule types
go/                          # NATIVE TUI (Go)
├── cmd/veto/main.go         # TUI entry point
├── internal/
│   ├── agent/               # Agent detection + install
│   ├── config/              # Config loading
│   └── matcher/             # Policy matching
└── Makefile                 # Build targets
```

## Policy Syntax

```bash
deny write .env* credentials* *.key    # Block writing secrets
allow read **                          # Allow reading anything
ask exec rm* git push* git reset*      # Require approval
deny exec curl* wget* nc*              # Block network tools
```

## Error Handling

CLI uses structured errors instead of `process.exit()`:

```typescript
import {
  CLIError,
  ConfigError,
  ValidationError,
  AgentError,
} from "./errors.js";

if (!config) throw new ConfigError("Failed to load config");
if (!agent) throw new ValidationError("No agent specified");

main().catch((err) => {
  console.error(err.message);
  process.exit(err instanceof CLIError ? err.exitCode : 1);
});
```

Error classes: `CLIError` (base), `ConfigError`, `NotFoundError`, `ValidationError`, `AgentError`, `NetworkError`

## Key Files

| File                        | What It Does                                 |
| --------------------------- | -------------------------------------------- |
| `src/cli.ts`                | Main entry, parses args, dispatches commands |
| `src/errors.ts`             | Structured error classes with exit codes     |
| `src/config/veto-parser.ts` | Parses `.veto` file format                   |
| `src/compiler/builtins.ts`  | 20+ built-in security policies               |
| `src/native/index.ts`       | `installAgent()`, `detectInstalledAgents()`  |
| `src/matcher.ts`            | `isProtected()`, glob matching               |

## Go TUI

```bash
cd go
make build              # Build for current platform
make build-all          # Cross-compile all platforms
```

Binaries: `veto-darwin-arm64`, `veto-linux-amd64`, etc.

## Release

Releases are automated via Changesets. To release:

1. Add changeset: `pnpm changeset` (select veto-cli, choose bump type)
2. Merge PR → "Version Packages" PR created
3. Merge that → published to npm automatically
