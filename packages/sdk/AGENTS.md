# SDK AGENTS.md

> **veto-sdk** is the core guardrail system. It intercepts AI tool calls, validates them against YAML rules, and blocks dangerous operations.

## Commands

```bash
pnpm build                          # Build SDK
pnpm test                           # Run tests (turbo-cached)
pnpm test -- -t "validator"         # Run tests matching "validator"
pnpm dev                            # Watch mode
pnpm benchmark:dev                  # Run kernel benchmark
```

## Architecture

```
src/
├── core/                    # THE CORE - start here
│   ├── veto.ts              # Main entry: Veto.init(), wrapTools()
│   ├── interceptor.ts       # Tool call interception + ToolCallDeniedError
│   ├── validator.ts         # Rule evaluation engine
│   └── history.ts           # Call history tracking
├── kernel/                  # Local LLM validation (Ollama)
│   ├── client.ts            # KernelClient for model inference
│   └── prompt.ts            # Prompt templates for validation
├── providers/               # AI provider adapters
│   └── adapters.ts          # toOpenAITools(), toAnthropicTools()
├── rules/                   # YAML rule system
│   ├── loader.ts            # Load rules from veto/rules/*.yaml
│   ├── types.ts             # Rule, RuleSet, Condition types + RuleSchemaError
│   └── rule-validator.ts    # Validate rule syntax
├── types/                   # Shared types
│   ├── tool.ts              # ToolDefinition, ToolCall
│   └── config.ts            # VetoConfig, ValidationResult
└── utils/                   # Helpers
    ├── logger.ts            # Structured logging
    └── glob.ts              # Pattern matching
```

## Key Concepts

1. **wrapTools()** - Returns `{ definitions, implementations }`. Definitions go to AI, implementations have validation baked in.

2. **Rules** - YAML with conditions: `{ field, operator, value }`. Operators: `equals`, `contains`, `matches`, `starts_with`, `in`, etc.

3. **Actions** - `block` (deny), `allow` (permit), `ask` (prompt), `warn` (log only)

4. **Kernel** - Optional local LLM via Ollama for semantic validation beyond pattern matching

## Code Patterns

```typescript
import { join } from "node:path";
import type { ToolDefinition } from "../types/tool.js";

throw new ToolCallDeniedError(toolName, "Blocked by rule: " + rule.id);
throw new RuleSchemaError("Invalid severity", filePath, "rules[0].severity");

const result = await veto.validateToolCall(call);
```

## Schema Validation

Rule YAML files are strictly validated on load. Invalid files throw `RuleSchemaError`:

```typescript
import { parseRuleSetStrict, RuleSchemaError } from "veto-sdk";

try {
  const ruleSet = parseRuleSetStrict(yamlContent, "path/to/file.yaml");
} catch (err) {
  if (err instanceof RuleSchemaError) {
    console.error(err.message);
  }
}
```

## Key Files

| File                        | What It Does                                                          |
| --------------------------- | --------------------------------------------------------------------- |
| `src/core/veto.ts`          | Entry point. `Veto.init()` loads config, `wrapTools()` wraps handlers |
| `src/core/interceptor.ts`   | Intercepts calls, runs validation, throws `ToolCallDeniedError`       |
| `src/core/validator.ts`     | Evaluates rules against tool call arguments                           |
| `src/kernel/client.ts`      | Calls local Ollama model for semantic validation                      |
| `src/providers/adapters.ts` | Converts tool definitions for OpenAI/Anthropic/Google                 |

## Release

Releases are automated via Changesets. To release:

1. Add changeset: `pnpm changeset` (select veto-sdk, choose bump type)
2. Merge PR → "Version Packages" PR created
3. Merge that → published to npm automatically
