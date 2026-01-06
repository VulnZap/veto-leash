# veto-sdk (Python)

A guardrail system for AI agent tool calls. Veto intercepts and validates tool calls made by AI models before execution.

## Installation

```bash
pip install veto-sdk
```

With provider integrations:

```bash
pip install veto-sdk[openai]      # OpenAI support
pip install veto-sdk[anthropic]   # Anthropic support
pip install veto-sdk[langchain]   # LangChain support
```

## Quick Start

```python
from veto_sdk import Veto, ToolCallDeniedError, ToolDefinition

# Define tools
tools = [
    ToolDefinition(
        name="read_file",
        description="Read a file",
        input_schema={
            "type": "object",
            "properties": {"path": {"type": "string"}},
            "required": ["path"]
        },
        handler=lambda args: open(args["path"]).read()
    )
]

# Initialize Veto and wrap tools
veto = await Veto.init()
definitions, implementations = veto.wrap_tools(tools)

# Use implementations - validation happens automatically
try:
    content = await implementations["read_file"]({"path": "/home/user/file.txt"})
except ToolCallDeniedError as e:
    print(f"Blocked: {e.validation_result.reason}")
```

## Configuration

Create `veto/rules/defaults.yaml`:

```yaml
rules:
  - id: block-system-paths
    name: Block system path access
    enabled: true
    severity: critical
    action: block
    tools:
      - read_file
    conditions:
      - field: arguments.path
        operator: starts_with
        value: /etc
```

## API Reference

### `Veto.init(config_dir="./veto", mode=None)`

Initialize Veto asynchronously. Loads config and rules from the specified directory.

### `veto.wrap_tools(tools)`

Wrap tools and return `(definitions, implementations)`.

### `veto.validate_tool_call(call)`

Manually validate a tool call.

### `veto.get_mode()`

Get current operating mode (`"strict"` or `"log"`).

### `veto.get_loaded_rules()`

Get all loaded rules.

## License

Apache-2.0
