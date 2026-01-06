# Python SDK AGENTS.md

> **veto-sdk (Python)** is the Python implementation of the Veto guardrail system. Same concepts as the TypeScript SDK, Pythonic API.

## Commands

```bash
pip install -e ".[dev]"           # Install in dev mode
pytest                            # Run tests
pytest -v tests/test_core.py      # Run specific test file
ruff check src                    # Lint
mypy src                          # Type check
```

## Architecture

```
src/veto_sdk/
├── __init__.py          # Public exports
├── core.py              # Veto class: init(), wrap_tools(), validate_tool_call()
├── types.py             # Rule, RuleSet, ToolDefinition, ToolCall, ValidationResult
├── errors.py            # ToolCallDeniedError, RuleSchemaError
├── rules/               # Rule loading and validation
│   ├── loader.py        # Load YAML rules
│   └── validator.py     # Evaluate rules against calls
└── providers/           # AI provider adapters
    ├── openai.py        # OpenAI integration
    └── anthropic.py     # Anthropic integration
```

## Key Concepts

1. **`Veto.init()`** - Async factory method. Loads config and rules from `./veto` directory.

2. **`wrap_tools()`** - Returns `(definitions, implementations)`. Implementations have validation baked in.

3. **Rules** - Same YAML format as TypeScript SDK. Conditions with operators: `equals`, `contains`, `matches`, `starts_with`, etc.

4. **Errors** - `ToolCallDeniedError` when validation fails, `RuleSchemaError` for invalid rule YAML.

## Code Style

```python
from veto_sdk import Veto, ToolCallDeniedError
from veto_sdk.types import Rule, ToolDefinition

async def main():
    veto = await Veto.init()
    definitions, implementations = veto.wrap_tools(tools)
    
    try:
        result = await implementations["read_file"]({"path": "/etc/passwd"})
    except ToolCallDeniedError as e:
        print(f"Blocked: {e.validation_result.reason}")
```

## Testing

```bash
pytest tests/                     # All tests
pytest tests/test_core.py -v      # Verbose output
pytest -k "test_block"            # Pattern matching
pytest --cov=veto_sdk             # Coverage
```

## Parity with TypeScript SDK

| Feature | TypeScript | Python |
|---------|------------|--------|
| Core API | `Veto.init()`, `wrapTools()` | `Veto.init()`, `wrap_tools()` |
| Errors | `ToolCallDeniedError`, `RuleSchemaError` | Same |
| Rules | YAML in `veto/rules/` | Same |
| Providers | OpenAI, Anthropic, Google | OpenAI, Anthropic, LangChain |
