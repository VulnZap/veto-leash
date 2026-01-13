# Veto

**The permission layer for AI agents.**

Veto gives you control over what AI agents can and cannot do. Whether you're building agentic applications or using AI coding assistants, Veto ensures they operate within boundaries you define.

## Packages

| Package                       | Language   | Description                           | Documentation                                        |
| ----------------------------- | ---------- | ------------------------------------- | ---------------------------------------------------- |
| [veto-sdk](./packages/sdk)    | TypeScript | SDK for building guarded agentic apps | [**Read the docs**](./packages/sdk/README.md)        |
| [veto](./packages/sdk-python) | Python     | SDK for building guarded agentic apps | [**Read the docs**](./packages/sdk-python/README.md) |
| [veto-cli](./packages/cli)    | TypeScript | CLI for AI coding assistants          | [**Read the docs**](./packages/cli/README.md)        |

## Install

```bash
# TypeScript SDK
npm install veto-sdk

# Python SDK
pip install veto

# CLI for AI coding assistants
npm install -g veto-cli
```

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
2. Veto intercepts and validates against your rules
3. Allowed → execute. Blocked → deny. Ask → prompt user.
4. Result returned to agent (unaware of guardrail)

## Why Veto?

- **Zero-config defaults** — Sensible security rules out of the box
- **Multi-language** — TypeScript and Python SDKs
- **Provider agnostic** — OpenAI, Anthropic, Google, LangChain
- **Local-first** — No cloud required, optional custom LLM validation
- **Real-time monitoring** — TUI dashboard for coding assistants

## License

Apache-2.0
