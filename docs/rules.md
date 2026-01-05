# Veto Rule Reference

## Overview

Veto rules define what AI agents can and cannot do. Rules are evaluated in order - first match wins.

## CLI Rules (.veto file)

Simple pattern-based rules for AI coding assistants.

### Syntax

```
<action> <operation> <pattern> [<pattern>...]
```

### Actions

| Action | Behavior |
|--------|----------|
| `allow` | Permit the operation |
| `deny` | Block the operation |
| `ask` | Prompt user for approval |

### Operations

| Operation | Description |
|-----------|-------------|
| `read` | Reading files |
| `write` | Creating or modifying files |
| `exec` | Executing commands |

### Patterns

Glob patterns with support for:
- `*` - Match any characters except `/`
- `**` - Match any characters including `/`
- `?` - Match single character
- `[abc]` - Match character class
- `{a,b}` - Match alternatives

### Examples

```
# Block all .env files
deny write .env*
deny read .env*

# Allow reading source code
allow read src/**/*.ts
allow read src/**/*.js

# Block system directories
deny read /etc/**
deny write /etc/**

# Require approval for git operations
ask exec git push*
ask exec git reset --hard*

# Block dangerous commands
deny exec rm -rf*
deny exec sudo*
deny exec chmod 777*

# Block network tools
deny exec curl*
deny exec wget*
deny exec nc*

# Allow npm/pnpm scripts
allow exec npm run*
allow exec pnpm run*
```

## SDK Rules (YAML)

Structured rules for agentic applications with validation API integration.

### Schema

```yaml
rules:
  - id: string           # Unique identifier
    name: string         # Human-readable name
    description: string  # Optional description
    enabled: boolean     # Default: true
    severity: string     # critical, high, medium, low, info
    action: string       # block, warn, log, allow
    tools: [string]      # Tool names this applies to (empty = all)
    conditions:          # All must match
      - field: string    # Dot-notation path (arguments.path)
        operator: string # See operators below
        value: any       # Value to compare against
```

### Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `equals` | Exact match | `value: "production"` |
| `not_equals` | Not equal | `value: "test"` |
| `contains` | Substring match | `value: "password"` |
| `not_contains` | No substring | `value: "secret"` |
| `starts_with` | Prefix match | `value: "/etc"` |
| `ends_with` | Suffix match | `value: ".env"` |
| `matches` | Regex pattern | `value: "rm -rf.*"` |
| `greater_than` | Numeric > | `value: 1000` |
| `less_than` | Numeric < | `value: 100` |
| `in` | In list | `value: ["dev", "staging"]` |
| `not_in` | Not in list | `value: ["production"]` |

### Field Paths

Access nested values with dot notation:

```yaml
conditions:
  - field: arguments.path
    operator: starts_with
    value: /home

  - field: arguments.options.recursive
    operator: equals
    value: true

  - field: tool_name
    operator: in
    value: [delete_file, remove_directory]
```

### Examples

```yaml
rules:
  # Block system path access
  - id: block-system-paths
    name: Block /etc and /sys access
    severity: critical
    action: block
    tools: [read_file, write_file]
    conditions:
      - field: arguments.path
        operator: matches
        value: "^/(etc|sys|proc)/.*"

  # Prevent mass deletion
  - id: block-recursive-delete
    name: Block recursive deletion
    severity: high
    action: block
    tools: [delete_file, run_command]
    conditions:
      - field: arguments.cmd
        operator: matches
        value: "rm.*-r.*/"

  # Warn on large file writes
  - id: warn-large-writes
    name: Warn on writes over 1MB
    severity: medium
    action: warn
    tools: [write_file]
    conditions:
      - field: arguments.content.length
        operator: greater_than
        value: 1048576

  # Log all database operations
  - id: log-database-ops
    name: Log database operations
    severity: info
    action: log
    tools: [query_database, execute_sql]
```

## Validation API

For SDK rules, Veto sends tool calls to your validation API.

### Request

```http
POST /tool/call/check
Content-Type: application/json

{
  "context": {
    "call_id": "call_abc123",
    "tool_name": "read_file",
    "arguments": { "path": "/etc/passwd" },
    "timestamp": "2024-01-15T10:30:00Z",
    "call_history": []
  },
  "rules": [
    {
      "id": "block-system-paths",
      "name": "Block system path access",
      "severity": "critical",
      "conditions": [...]
    }
  ]
}
```

### Response

```json
{
  "decision": "block",
  "reasoning": "Access to /etc is blocked by security policy"
}
```

## Best Practices

1. **Default deny** - Start restrictive, allow what's needed
2. **Specific rules first** - More specific patterns should come before general ones
3. **Use severity** - Mark critical rules appropriately for audit
4. **Test rules** - Use `veto explain <rule>` to verify behavior
5. **Version control** - Track `.veto` and `veto/` in git
