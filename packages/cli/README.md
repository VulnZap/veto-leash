# veto-cli

**Control what AI coding assistants can do in your codebase.**

Works with Claude Code, Cursor, Windsurf, OpenCode, Aider, and any MCP-compatible agent.

## Install

```bash
npm install -g veto-cli
```

## Quick Start

```bash
cd your-project
veto init    # Create .veto config
veto         # Launch control interface
```

## Configuration

The `.veto` file defines what actions are allowed:

```
# Syntax: <action> <operation> <pattern>
# Actions: allow, deny, ask
# Operations: read, write, exec

# Block sensitive files
deny write .env* credentials* *.pem *.key

# Allow reading everything
allow read **

# Require approval for destructive commands
ask exec rm* git push* git reset* git rebase*

# Block network tools
deny exec curl* wget* nc* netcat*

# Block package publishing
deny exec npm publish* pnpm publish*
```

## Commands

| Command | Description |
|---------|-------------|
| `veto` | Launch TUI control interface |
| `veto init` | Create `.veto` config file |
| `veto status` | Show current policy status |
| `veto list` | List active rules |
| `veto sync` | Sync policies from Veto Cloud |
| `veto explain <rule>` | Explain what a rule does |

## TUI Controls

| Key | Action |
|-----|--------|
| `a` | Allow pending action |
| `d` | Deny pending action |
| `A` | Allow all from this session |
| `D` | Deny all from this session |
| `q` | Quit |
| `?` | Help |

## Agent Integration

Veto automatically integrates with supported agents. After `veto init`, it injects policy hooks into:

- `~/.claude/settings.json` (Claude Code)
- `.cursor/hooks.json` (Cursor)
- `.windsurf/hooks.json` (Windsurf)
- `opencode.json` (OpenCode)
- `.aider/config.yml` (Aider)

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VETO_API_KEY` | API key for Veto Cloud sync |
| `VETO_LOG_LEVEL` | Logging verbosity (debug, info, warn, error) |

## License

Apache-2.0
