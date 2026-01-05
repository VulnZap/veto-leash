# Veto

**The permission layer for AI agents.**

Veto gives you control over what AI agents can and cannot do. Whether you're building agentic applications or using AI coding assistants, Veto ensures they operate within boundaries you define.

```bash
npm install veto-sdk      # SDK for building agentic apps
npm install -g veto-cli   # CLI for AI coding assistants
```

## The Problem

AI agents are powerful but unpredictable. They can:
- Execute arbitrary shell commands
- Modify or delete any file
- Access sensitive data
- Make network requests
- Run indefinitely without oversight

Without guardrails, you're trusting the model to always do the right thing.

## The Solution

Veto intercepts AI agent actions before they execute and validates them against your rules.

### For Developers Building Agents (`veto-sdk`)

Wrap your tools with Veto. Validation happens automatically.

```typescript
import { Veto, toOpenAITools } from 'veto-sdk';

const veto = await Veto.init();
const { definitions, implementations } = veto.wrapTools([
  {
    name: 'run_command',
    description: 'Execute a shell command',
    inputSchema: { type: 'object', properties: { cmd: { type: 'string' } } },
    handler: async ({ cmd }) => execSync(cmd).toString()
  }
]);

// Pass definitions to your AI provider
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  tools: toOpenAITools(definitions),
  messages: [...]
});

// Execute with automatic validation
for (const call of response.choices[0].message.tool_calls) {
  const result = await implementations[call.function.name](
    JSON.parse(call.function.arguments)
  );
}
```

Define rules in `veto/rules/defaults.yaml`:

```yaml
rules:
  - id: block-dangerous-commands
    tools: [run_command]
    conditions:
      - field: arguments.cmd
        operator: matches
        value: "rm -rf|sudo|chmod 777"
    action: block
```

### For Teams Using AI Coding Assistants (`veto-cli`)

Control what Claude, Cursor, Windsurf, and other AI coding tools can do in your codebase.

```bash
veto init
```

This creates a `.veto` file in your project:

```
# Block modifications to critical files
deny write .env* credentials* *.pem *.key

# Allow reading anything
allow read **

# Require approval for destructive operations  
ask exec rm* git push* git reset*

# Block network access
deny exec curl* wget* nc*
```

Launch the TUI to monitor and control agent actions in real-time:

```bash
veto
```

## Packages

| Package | Description | Install |
|---------|-------------|---------|
| [`veto-sdk`](./packages/sdk) | SDK for building agentic applications with guardrails | `npm install veto-sdk` |
| [`veto-cli`](./packages/cli) | CLI for controlling AI coding assistants | `npm install -g veto-cli` |

## How It Works

```
┌─────────────┐     ┌─────────┐     ┌──────────────┐
│  AI Agent   │────▶│  Veto   │────▶│  Your Tools  │
│  (LLM)      │     │ (Guard) │     │  (Handlers)  │
└─────────────┘     └─────────┘     └──────────────┘
                         │
                         ▼
                    ┌─────────┐
                    │  Rules  │
                    │  (YAML) │
                    └─────────┘
```

1. AI agent requests a tool call
2. Veto intercepts and evaluates against your rules
3. If allowed: execute. If blocked: deny. If ask: prompt user.
4. Result returned to agent (unaware of guardrail)

## Quick Start

### SDK

```bash
npm install veto-sdk
npx veto-sdk init
```

```typescript
import { Veto } from 'veto-sdk';

const veto = await Veto.init();
const { definitions, implementations } = veto.wrapTools(myTools);
```

### CLI

```bash
npm install -g veto-cli
cd your-project
veto init
veto
```

## Documentation

- [SDK Documentation](./packages/sdk/README.md)
- [CLI Documentation](./packages/cli/README.md)
- [Rule Reference](./docs/rules.md)

## Why Veto?

| Feature | Veto |
|---------|------|
| Zero-config defaults | Yes |
| Provider agnostic | OpenAI, Anthropic, Google, any |
| Local-first | No cloud required |
| Real-time monitoring | TUI dashboard |
| Team policies | Sync via Veto Cloud |
| Performance | Sub-millisecond overhead |

## License

Apache-2.0
