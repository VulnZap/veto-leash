# veto

**Guardrails for AI agent tool calls.**

Intercept, validate, and control tool calls before execution. Works with OpenAI, Anthropic, Google, and any provider.

## Install

```bash
npm install veto
```

## Quick Start

```bash
npx veto init  # Creates veto/ directory with config and rules
```

```typescript
import { Veto, toOpenAITools, ToolCallDeniedError } from 'veto';

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
    handler: async ({ path }) => fs.readFileSync(path, 'utf-8')
  },
  {
    name: 'write_file',
    description: 'Write a file',
    inputSchema: {
      type: 'object',
      properties: { path: { type: 'string' }, content: { type: 'string' } },
      required: ['path', 'content']
    },
    handler: async ({ path, content }) => {
      fs.writeFileSync(path, content);
      return 'OK';
    }
  }
];

// Initialize and wrap
const veto = await Veto.init();
const { definitions, implementations } = veto.wrapTools(tools);

// Use with OpenAI
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  tools: toOpenAITools(definitions),
  messages: [{ role: 'user', content: 'Read /etc/passwd' }]
});

// Execute - validation happens automatically
for (const call of response.choices[0].message.tool_calls ?? []) {
  try {
    const result = await implementations[call.function.name](
      JSON.parse(call.function.arguments)
    );
    console.log('Result:', result);
  } catch (error) {
    if (error instanceof ToolCallDeniedError) {
      console.log('Blocked:', error.reason);
    }
  }
}
```

## Configuration

### veto/config.yaml

```yaml
version: "1.0"
mode: "strict"  # strict = block, log = allow but log

api:
  baseUrl: "http://localhost:8080"
  endpoint: "/tool/call/check"
  timeout: 10000

rules:
  directory: "./rules"
```

### veto/rules/defaults.yaml

```yaml
rules:
  - id: block-system-paths
    name: Block system path access
    severity: critical
    action: block
    tools: [read_file, write_file]
    conditions:
      - field: arguments.path
        operator: starts_with
        value: /etc

  - id: block-home-deletion
    name: Prevent home directory deletion
    severity: critical
    action: block
    tools: [delete_file, run_command]
    conditions:
      - field: arguments.path
        operator: matches
        value: "^/home/.*"
```

## Provider Adapters

### OpenAI

```typescript
import { toOpenAITools, fromOpenAIToolCall } from 'veto';

const tools = toOpenAITools(definitions);
```

### Anthropic

```typescript
import { toAnthropicTools, fromAnthropicToolUse } from 'veto';

const tools = toAnthropicTools(definitions);
```

### Google

```typescript
import { toGoogleTool, fromGoogleFunctionCall } from 'veto';

const tools = toGoogleTool(definitions);
```

## Rule Conditions

| Operator | Description |
|----------|-------------|
| `equals` | Exact match |
| `not_equals` | Not equal |
| `contains` | String contains |
| `not_contains` | String does not contain |
| `starts_with` | String starts with |
| `ends_with` | String ends with |
| `matches` | Regex pattern |
| `greater_than` | Numeric > |
| `less_than` | Numeric < |
| `in` | Value in list |
| `not_in` | Value not in list |

## API

### `Veto.init(options?)`

Initialize Veto with configuration.

```typescript
const veto = await Veto.init({
  configDir: './my-veto',
  mode: 'log',
  logLevel: 'debug'
});
```

### `veto.wrapTools(tools)`

Wrap tools to add validation.

```typescript
const { definitions, implementations } = veto.wrapTools(tools);
// definitions: schemas for AI provider (no handlers)
// implementations: callable functions with validation
```

### `veto.validateToolCall(call)`

Manual validation for custom flows.

```typescript
const result = await veto.validateToolCall({
  id: 'call_123',
  name: 'read_file',
  arguments: { path: '/etc/passwd' }
});

if (result.allowed) {
  // proceed
}
```

### `veto.getMode()`

Get current mode (`'strict'` or `'log'`).

### `veto.getLoadedRules()`

Get all loaded rules.

## License

Apache-2.0
