<p align="center">
  <h1 align="center">veto-leash</h1>
  <p align="center"><strong>sudo for AI agents</strong></p>
  <p align="center">
    <a href="https://www.npmjs.com/package/veto-leash"><img src="https://img.shields.io/npm/v/veto-leash?style=flat-square&color=black" alt="npm version"></a>
    <a href="https://github.com/VulnZap/veto-leash/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/veto-leash?style=flat-square&color=black" alt="License"></a>
    <a href="https://www.npmjs.com/package/veto-leash"><img src="https://img.shields.io/npm/dm/veto-leash?style=flat-square&color=black" alt="Downloads"></a>
  </p>
</p>

Your AI agent has root access to your codebase. You have... vibes.

```bash
# One file. That's it.
echo "no lodash
no any types" > .leash

leash   # Interactive dashboard
```

Now every action is validated with **AST-level precision**. Zero false positives. Zero config.

## What's New in 2.0

- **Native Go TUI** - Beautiful interactive dashboard built with Bubble Tea
- **4.5MB binary** - Instant startup, no Node.js required at runtime
- **Cross-platform** - Native binaries for macOS, Linux, Windows (arm64 + amd64)
- **Hybrid engine** - Go for speed, TypeScript for LLM compilation + AST validation

## The Problem

AI coding agents can `npm install lodash` when you want native methods. They'll sprinkle `any` types everywhere. They'll `git push --force` to main.

Regex-based blockers create false positives. A comment saying `// TODO: remove lodash` shouldn't trigger a block.

## The Solution

veto-leash uses **AST parsing** for surgical precision:

| Code                     | Regex Result | AST Result                 |
| ------------------------ | ------------ | -------------------------- |
| `// import lodash`       | BLOCKED      | ALLOWED (comment)          |
| `"use any type"`         | BLOCKED      | ALLOWED (string)           |
| `const anyValue = 5`     | BLOCKED      | ALLOWED (variable name)    |
| `import _ from 'lodash'` | BLOCKED      | BLOCKED (correct)          |

**This precision is our moat.** No other tool achieves zero false positives.

## Quick Start

```bash
# Install globally
npm install -g veto-leash

# Create policies
echo "no lodash
no any types
prefer pnpm" > .leash

# Launch the dashboard
leash
```

The interactive TUI lets you:
- Add and manage policies
- Install hooks for detected agents
- Monitor enforcement in real-time
- View audit logs

Or use CLI commands directly:

```bash
leash init              # Auto-detect agents, install hooks
leash add "no axios"    # Add a policy
leash sync              # Apply to all agents
```

## Simple `.leash` Format

```
# .leash - One rule per line
no lodash
no any types - enforces strict TypeScript
no console.log
prefer pnpm over npm
protect .env files
```

Lines starting with `#` are comments. Optional reasons after `-`.

## Built-in Rules

These work **instantly** with zero LLM calls:

| Rule                  | What It Catches                            |
| --------------------- | ------------------------------------------ |
| `no lodash`           | ES imports, require(), dynamic import()    |
| `no any types`        | Type annotations, generics, as expressions |
| `no console.log`      | console.log(), console['log']()            |
| `no eval`             | eval(), new Function()                     |
| `no class components` | React.Component, PureComponent             |
| `no innerhtml`        | innerHTML, dangerouslySetInnerHTML         |
| `no debugger`         | debugger statements                        |
| `no var`              | var declarations                           |
| `prefer pnpm`         | npm/yarn commands blocked                  |
| `protect .env`        | Environment file modifications blocked     |

50+ built-in patterns cover most common policies.

## Native Agent Support

| Agent           | How It Works                         | Status     |
| --------------- | ------------------------------------ | ---------- |
| **Claude Code** | PreToolUse hooks with AST validation | Full       |
| **OpenCode**    | AGENTS.md injection                  | Full       |
| **Cursor**      | rules/ directory integration         | Full       |
| **Windsurf**    | Cascade rules integration            | Full       |
| **Aider**       | .aider.conf.yml configuration        | Full       |

## Commands

```
leash                     Interactive dashboard
leash init                Auto-detect agents, install hooks
leash add "<policy>"      Add a policy
leash list                Show current policies
leash explain "<policy>"  Preview what a policy catches
leash sync [agent]        Apply policies to agents
leash install <agent>     Install hooks for specific agent
leash uninstall <agent>   Remove agent hooks
leash status              Show detected agents
leash audit [--tail]      View enforcement log
```

**Agent shortcuts:** `cc` (Claude Code), `oc` (OpenCode), `cursor`, `windsurf`, `aider`

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    leash (Go, 4.5MB)                    │
├─────────────────────────────────────────────────────────┤
│  TUI Dashboard          │  Fast Commands               │
│  - Policy management    │  - list, status, sync        │
│  - Agent installation   │  - install, uninstall        │
│  - Real-time monitoring │  - Pattern matching          │
├─────────────────────────┴───────────────────────────────┤
│              TypeScript Engine (when needed)            │
│  - LLM policy compilation (custom rules)                │
│  - AST validation (Tree-sitter)                         │
│  - 243 tests                                            │
└─────────────────────────────────────────────────────────┘
```

**Key insight**: 95%+ of policies use built-in rules (pure Go, instant). LLM compilation only runs for custom rules.

## How It Works

```
User: "no lodash"
         ↓
┌─────────────────────────────────────────┐
│  1. Check builtins (instant, no LLM)    │
│     → Found: "no lodash" builtin        │
└─────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────┐
│  2. Runtime: Write/Edit intercepted     │
│     → Regex pre-filter: "lodash"?       │
│     → AST parse (5ms, cached)           │
│     → BLOCKED with line/column          │
└─────────────────────────────────────────┘
```

## Environment Variables

| Variable         | Description                                 |
| ---------------- | ------------------------------------------- |
| `GEMINI_API_KEY` | Only needed for custom rules (not builtins) |

Get a free API key: https://aistudio.google.com/apikey

## Philosophy

1. **Surgeon-level precision** - AST parsing = zero false positives
2. **Invisible until needed** - Auto-detection, background enforcement
3. **Native performance** - Go binary, instant startup
4. **Natural language** - `no lodash` not `{ "rule": "no-import", "pattern": "^lodash" }`

## Test Suite

```
243 tests passing
├── 77 AST validation tests
├── 93 content matching tests
├── 41 command interception tests
├── 17 pattern matcher tests
├── 16 builtin rules tests
├── 12 parser tests
└── 9 session tests
```

## License

Apache-2.0

---

<p align="center">
  Built by <a href="https://plaw.io">Plaw, Inc.</a> for the <a href="https://veto.run">Veto</a> product line.
  <br><br>
  <strong>Ship faster. Sleep better.</strong>
</p>
