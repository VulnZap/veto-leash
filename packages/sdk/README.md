# Veto

A guardrail system for AI agent tool calls. Veto intercepts and validates tool calls made by AI models before execution.

## How It Works

1. Define your tools with handlers
2. Wrap them with Veto to get `definitions` and `implementations`
3. Pass `definitions` to the AI model
4. Execute tool calls using `implementations` - validation happens automatically

When a tool is executed, Veto:
1. Looks up applicable rules from your YAML configuration
2. Sends the call context and rules to your validation API
3. Blocks or allows the call based on the API response

The AI model remains unaware of the guardrail - tool schemas are unchanged.

## Installation

```bash
npm install veto-sdk
```

## Quick Start

### 1. Initialize Veto in your project

```typescript
import { init } from 'veto-sdk';
await init();
```

Or via CLI: `npm install -g veto-cli && veto init`

This creates a `veto/` directory with configuration and default rules.

### 2. Define your tools and wrap them

```typescript
import { Veto, ToolCallDeniedError } from 'veto-sdk';

// Define tools with handlers
const tools = [
  {
    name: 'read_file',
    description: 'Read a file',
    inputSchema: {
      type: 'object',
      properties: { path: { type: 'string' } },
      required: ['path']
    },
    handler: async (args) => {
      return fs.readFileSync(args.path, 'utf-8');
    }
  },
  {
    name: 'write_file',
    description: 'Write a file',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        content: { type: 'string' }
      },
      required: ['path', 'content']
    },
    handler: async (args) => {
      fs.writeFileSync(args.path, args.content);
      return 'OK';
    }
  }
];

// Initialize Veto and wrap tools
const veto = await Veto.init();
const { definitions, implementations } = veto.wrapTools(tools);

// Use implementations - validation happens automatically
try {
  const content = await implementations.read_file({ path: '/home/user/file.txt' });
  console.log(content);
} catch (error) {
  if (error instanceof ToolCallDeniedError) {
    console.log('Blocked:', error.reason);
  }
}
```

### 3. Configure rules

Edit `veto/rules/defaults.yaml`:

```yaml
rules:
  - id: block-system-paths
    name: Block system path access
    enabled: true
    severity: critical
    action: block
    tools:
      - read_file
      - write_file
    conditions:
      - field: arguments.path
        operator: starts_with
        value: /etc
```

## Configuration

### veto.config.yaml

```yaml
version: "1.0"

# Operating mode
mode: "strict"  # "strict" blocks calls, "log" only logs them

# Validation mode: "api", "kernel", or "custom"
validation:
  mode: "custom"

# Custom LLM provider (when validation.mode is "custom")
custom:
  provider: "openai"  # openai, anthropic, gemini, openrouter
  model: "gpt-4o"
  # apiKey: "sk-..."  # Or set OPENAI_API_KEY env var

# Validation API (when validation.mode is "api")
api:
  baseUrl: "http://localhost:8080"
  endpoint: "/tool/call/check"
  timeout: 10000
  retries: 2

# Logging
logging:
  level: "info"  # debug, info, warn, error, silent

# Rules
rules:
  directory: "./rules"
  recursive: true
```

### Validation Modes

| Mode | Description |
|------|-------------|
| `api` | Validate via external HTTP API (default) |
| `kernel` | Validate via local Ollama model |
| `custom` | Validate via custom LLM provider (OpenAI, Anthropic, Gemini, OpenRouter) |

### Custom LLM Providers

Use your own LLM for validation instead of an external API:

```yaml
validation:
  mode: "custom"

custom:
  provider: "anthropic"
  model: "claude-sonnet-4-20250514"
```

| Provider | Environment Variable | Example Models |
|----------|---------------------|----------------|
| `openai` | `OPENAI_API_KEY` | gpt-4o, gpt-4-turbo |
| `anthropic` | `ANTHROPIC_API_KEY` | claude-sonnet-4-20250514, claude-opus-4-20250514 |
| `gemini` | `GEMINI_API_KEY` | gemini-2.0-flash, gemini-1.5-pro |
| `openrouter` | `OPENROUTER_API_KEY` | Any model on OpenRouter |

### Operating Modes

| Mode | Behavior |
|------|----------|
| `strict` | Blocks tool calls when the validation API returns a block decision |
| `log` | Logs block decisions but allows all tool calls to proceed |

Override mode programmatically:

```typescript
const veto = await Veto.init({ mode: 'log' });
```

## Validation API

Veto sends a POST request to your validation API with the tool call context and applicable rules.

### Request

```
POST /tool/call/check
Content-Type: application/json
```

```json
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
      "conditions": [
        {
          "field": "arguments.path",
          "operator": "starts_with",
          "value": "/etc"
        }
      ]
    }
  ]
}
```

### Response

```json
{
  "should_pass_weight": 0.1,
  "should_block_weight": 0.9,
  "decision": "block",
  "reasoning": "Access to /etc is blocked by security policy"
}
```

The `decision` field must be either `"pass"` or `"block"`.

## Rule Format

```yaml
rules:
  - id: unique-rule-id
    name: Human readable name
    description: What this rule does
    enabled: true
    severity: critical    # critical, high, medium, low, info
    action: block         # block, warn, log, allow
    tools:                # tools this applies to (empty = all tools)
      - read_file
      - write_file
    conditions:           # all conditions must match
      - field: arguments.path
        operator: starts_with
        value: /etc
```

### Condition Operators

| Operator | Description |
|----------|-------------|
| `equals` | Exact match |
| `not_equals` | Not equal |
| `contains` | String contains substring |
| `not_contains` | String does not contain substring |
| `starts_with` | String starts with prefix |
| `ends_with` | String ends with suffix |
| `matches` | Regex pattern match |
| `greater_than` | Numeric greater than |
| `less_than` | Numeric less than |
| `in` | Value in list |
| `not_in` | Value not in list |

## Provider Integration

### OpenAI

```typescript
import { Veto, toOpenAITools, fromOpenAIToolCall } from 'veto-sdk';

const veto = await Veto.init();
const { definitions, implementations } = veto.wrapTools(myTools);

// Pass definitions to OpenAI
const response = await openai.chat.completions.create({
  model: 'gpt-5.2',
  tools: toOpenAITools(definitions),
  messages: [...]
});

// Execute tool calls using implementations
for (const call of response.choices[0].message.tool_calls ?? []) {
  const args = JSON.parse(call.function.arguments);
  try {
    const result = await implementations[call.function.name](args);
    console.log('Result:', result);
  } catch (error) {
    if (error instanceof ToolCallDeniedError) {
      console.log('Blocked:', error.reason);
    }
  }
}
```

### Anthropic

```typescript
import { Veto, toAnthropicTools, fromAnthropicToolUse } from 'veto-sdk';

const veto = await Veto.init();
const { definitions, implementations } = veto.wrapTools(myTools);

// Pass definitions to Anthropic
const response = await anthropic.messages.create({
  model: 'claude-opus-4.5',
  tools: toAnthropicTools(definitions),
  messages: [...]
});

// Execute tool calls using implementations
for (const block of response.content) {
  if (block.type === 'tool_use') {
    try {
      const result = await implementations[block.name](block.input);
      console.log('Result:', result);
    } catch (error) {
      if (error instanceof ToolCallDeniedError) {
        console.log('Blocked:', error.reason);
      }
    }
  }
}
```

## API Reference

### Veto.init(options?)

Initialize Veto by loading configuration and rules.

```typescript
const veto = await Veto.init();

// With options
const veto = await Veto.init({
  configDir: './my-veto-config',
  mode: 'log',
  logLevel: 'debug'
});
```

### veto.wrapTools(tools)

Wrap tools and return definitions and implementations.

```typescript
const { definitions, implementations } = veto.wrapTools(tools);

// definitions: Tool schemas to pass to AI models (no handlers)
// implementations: Object with wrapped handler functions keyed by tool name
```

### veto.wrap(tools)

Wrap tools with validation while preserving their original type. Works with LangChain, Vercel AI SDK, or any framework.

```typescript
import { tool } from '@langchain/core/tools';
import { z } from 'zod';

const tools = [
  tool(({ query }) => searchDatabase(query), {
    name: 'search',
    description: 'Search the database',
    schema: z.object({ query: z.string() }),
  }),
];

const veto = await Veto.init();
const wrappedTools = veto.wrap(tools); // Same type as input!

// Use with any framework
const agent = createAgent({ tools: wrappedTools });
```

### veto.wrapTool(tool)

Wrap a single tool with validation.

```typescript
const safeTool = veto.wrapTool(myTool);
```

### veto.validateToolCall(call)

Manually validate a tool call (for custom execution flows).

```typescript
const result = await veto.validateToolCall({
  id: 'call_123',
  name: 'read_file',
  arguments: { path: '/some/path' }
});

if (result.allowed) {
  // Execute
}
```

### veto.getMode()

Get current operating mode.

```typescript
const mode = veto.getMode(); // 'strict' or 'log'
```

### veto.getLoadedRules()

Get all loaded rules.

```typescript
const rules = veto.getLoadedRules();
```

## Initialization

### Programmatic (SDK)

```typescript
import { init } from 'veto-sdk';

await init({ directory: './my-project' });
```

### CLI (via veto-cli)

Install the CLI for command-line initialization:

```bash
npm install -g veto-cli
veto init
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VETO_LOG_LEVEL` | Override log level |
| `VETO_SESSION_ID` | Session ID for tracking |
| `VETO_AGENT_ID` | Agent ID for tracking |

## License

MIT
