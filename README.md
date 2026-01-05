<p align="center">
  <h1 align="center">veto</h1>
  <p align="center"><strong>The permission layer for AI agents</strong></p>
  <p align="center">
    <a href="https://www.npmjs.com/package/veto-cli"><img src="https://img.shields.io/npm/v/veto-cli?style=flat-square&color=f5a524" alt="npm version"></a>
    <a href="https://github.com/VulnZap/veto/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/veto-cli?style=flat-square&color=000" alt="License"></a>
    <a href="https://www.npmjs.com/package/veto-cli"><img src="https://img.shields.io/npm/dm/veto-cli?style=flat-square&color=000" alt="Downloads"></a>
  </p>
</p>

<br>

## Overview

AI coding agents have unrestricted access to your codebase. Veto adds a permission layer with natural language policies enforced through AST-level validation.

```bash
npm install -g veto-cli
veto
```

Create policies in plain English. Block dangerous operations. Zero false positives.

<br>

## The Problem

Modern AI coding assistants can execute arbitrary commands and modify any file. While powerful, this creates risk:

- Installing unwanted dependencies (lodash when you prefer native)
- Using loose types (any instead of proper TypeScript)
- Executing dangerous commands (force push to main)
- Modifying protected files (.env, credentials)

Traditional regex-based blocking creates false positives. Comments mentioning "lodash" shouldn't trigger blocks.

<br>

## The Solution

Veto uses Abstract Syntax Tree parsing for surgical precision:

| Code                     | Regex Blocker | Veto                  |
| ------------------------ | ------------- | --------------------- |
| `// import lodash`       | BLOCKED       | ALLOWED (comment)     |
| `"use any type"`         | BLOCKED       | ALLOWED (string)      |
| `const anyValue = 5`     | BLOCKED       | ALLOWED (variable)    |
| `import _ from 'lodash'` | BLOCKED       | BLOCKED (actual code) |

The difference is precision. AST parsing understands code structure, eliminating false positives entirely.

<br>

## Quick Start

### Installation

```bash
npm install -g veto-cli
```

### Create Policies

One policy per line in `.veto`:

```
no lodash
no any types
prefer pnpm over npm
protect .env files
```

### Launch Dashboard

```bash
veto
```

Interactive TUI for policy management, agent configuration, and monitoring.

### CLI Usage

```bash
veto init              # Auto-detect agents, install hooks
veto add "no axios"    # Add policy
veto sync              # Apply to all agents
veto status            # Show configuration
```

<br>

## Features

### Native Performance

- **6.8MB binary** - Go-based TUI, instant startup
- **Cross-platform** - macOS, Linux, Windows (ARM64 + AMD64)
- **Auto-update** - Built-in version checking and updates

### Smart Validation

- **50+ built-in patterns** - Common policies work instantly
- **AST parsing** - Tree-sitter for zero false positives
- **LLM compilation** - Custom policies use Gemini API
- **243 test suite** - Comprehensive validation coverage

### Agent Integration

Native support for major AI coding tools:

| Agent           | Integration Method          | Status |
| --------------- | --------------------------- | ------ |
| **Claude Code** | PreToolUse hooks            | Full   |
| **OpenCode**    | AGENTS.md injection         | Full   |
| **Cursor**      | rules/ directory            | Full   |
| **Windsurf**    | Cascade rules               | Full   |
| **Aider**       | .aider.conf.yml             | Full   |

<br>

## Built-in Policies

Instant validation without LLM calls:

| Policy                | Blocks                                     |
| --------------------- | ------------------------------------------ |
| `no lodash`           | ES imports, require(), dynamic import()    |
| `no any types`        | Type annotations, generics, as expressions |
| `no console.log`      | console.log(), console['log']()            |
| `no eval`             | eval(), new Function()                     |
| `no class components` | React.Component, PureComponent             |
| `no innerHTML`        | innerHTML, dangerouslySetInnerHTML         |
| `no debugger`         | debugger statements                        |
| `no var`              | var declarations                           |
| `prefer pnpm`         | npm/yarn package manager commands          |
| `protect .env`        | Modifications to environment files         |

Over 50 patterns available. See source for complete list.

<br>

## Architecture

```
┌──────────────────────────────────────────────┐
│           veto (Native Binary)               │
├──────────────────────────────────────────────┤
│  Interactive TUI    │  CLI Commands          │
│  • Policy editor    │  • add, list, sync     │
│  • Agent manager    │  • install, status     │
│  • Live updates     │  • Pattern matching    │
├─────────────────────┴──────────────────────┤
│         TypeScript Engine (as needed)        │
│  • LLM policy compilation (Gemini API)       │
│  • AST validation (Tree-sitter)              │
│  • Audit logging and reporting               │
└──────────────────────────────────────────────┘
```

Built-in policies execute in Go (instant). Custom policies compile via TypeScript engine with LLM.

<br>

## How It Works

**Step 1: Policy Compilation**

```
Input: "no lodash"
  ↓
Check built-in patterns → Match found
  ↓
Generate:
  - Regex pre-filter: /lodash/
  - AST query: (import_statement source: "lodash")
  - Suggested alternative: "Use native ES6+"
```

**Step 2: Runtime Enforcement**

```
Agent attempts: import _ from 'lodash'
  ↓
Regex pre-filter → Contains "lodash"
  ↓
Parse file with Tree-sitter (5ms)
  ↓
Query AST → Import statement found
  ↓
BLOCK with context and suggestion
```

<br>

## Configuration

### .veto Format

```
# Lines starting with # are comments
no lodash
no any types - enforces strict TypeScript
protect .env
prefer pnpm over npm
```

Policies support optional reasoning after `-`.

### Environment Variables

| Variable         | Purpose                         | Required |
| ---------------- | ------------------------------- | -------- |
| `GEMINI_API_KEY` | LLM compilation for custom rules | Optional |

Free API key: https://aistudio.google.com/apikey

Built-in policies work without API key.

<br>

## CLI Reference

```
USAGE
  veto                     Interactive dashboard
  veto init                Setup wizard
  veto add "policy"        Add enforcement rule
  veto list                Show active policies
  veto sync [agent]        Apply to agents
  veto install <agent>     Install agent hooks
  veto uninstall <agent>   Remove hooks
  veto status              Show configuration
  veto explain "policy"    Preview rule behavior
  veto audit [--tail]      View enforcement log
  veto update              Update to latest version

AGENTS
  cc, claude-code    Claude Code
  oc, opencode       OpenCode
  cursor             Cursor
  windsurf           Windsurf
  aider              Aider
```

<br>

## Development

### Build from Source

```bash
git clone https://github.com/VulnZap/veto
cd veto
pnpm install
pnpm build
cd go && make build-all
```

### Run Tests

```bash
pnpm test              # TypeScript test suite
pnpm typecheck         # Type validation
go test ./...          # Go tests
```

### Test Suite

- 243 tests passing
- 77 AST validation tests
- 93 content matching tests
- 41 command interception tests
- 17 pattern matcher tests
- 16 builtin rule tests
- 12 parser tests
- 9 session tests

<br>

## Design Principles

1. **Precision over approximation** - AST parsing eliminates false positives
2. **Speed over flexibility** - Native binary, instant feedback
3. **Clarity over cleverness** - Natural language policies
4. **Safety over convenience** - Explicit validation required

<br>

## Comparison

| Feature          | Veto         | git hooks | IDE linters |
| ---------------- | ------------ | --------- | ----------- |
| AST validation   | Yes          | No        | Limited     |
| Natural language | Yes          | No        | No          |
| Agent-aware      | Yes          | No        | No          |
| False positives  | Zero         | High      | Medium      |
| Runtime          | 5ms          | N/A       | Seconds     |
| Setup            | One command  | Manual    | Per-project |

<br>

## License

Apache-2.0

See [LICENSE](LICENSE) for details.

<br>

---

<p align="center">
  Built by <a href="https://plaw.io">Plaw, Inc.</a> for <a href="https://veto.run">veto.run</a>
</p>
