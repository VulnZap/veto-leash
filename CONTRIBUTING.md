# Contributing to Veto

Welcome! This guide will get you shipping fast.

## Quick Start

```bash
git clone https://github.com/VulnZap/veto.git
cd veto
pnpm install
pnpm build
pnpm test
```

## Monorepo Structure

```
veto/
├── packages/
│   ├── sdk/          # veto-sdk - Core guardrail system
│   └── cli/          # veto-cli - Terminal interface
├── apps/
│   └── web/          # veto.run landing page
└── docs/
```

## Branch Naming

Use this format: `<type>/<package>/<description>`

| Type | Use for |
|------|---------|
| `feat` | New features |
| `fix` | Bug fixes |
| `refactor` | Code improvements |
| `docs` | Documentation |
| `test` | Test additions |
| `chore` | Maintenance |

### Examples

```bash
# SDK feature
git checkout -b feat/sdk/add-anthropic-provider

# CLI bug fix
git checkout -b fix/cli/tui-crash-on-empty-config

# Web update
git checkout -b feat/web/add-pricing-section

# Cross-package refactor
git checkout -b refactor/core/rename-interceptor

# Docs only
git checkout -b docs/readme-update
```

### Quick Reference

```bash
# Working on SDK
feat/sdk/*
fix/sdk/*

# Working on CLI
feat/cli/*
fix/cli/*

# Working on Web
feat/web/*
fix/web/*

# Infrastructure/CI
chore/infra/*
```

## Development Workflow

### 1. Create your branch

```bash
git checkout master
git pull origin master
git checkout -b feat/sdk/my-feature
```

### 2. Make changes

```bash
# Work on SDK
pnpm --filter veto-sdk dev

# Work on CLI
pnpm --filter veto-cli dev

# Work on Web
pnpm --filter @veto/web dev
```

### 3. Test your changes

```bash
# Test specific package
pnpm --filter veto-sdk test
pnpm --filter veto-cli test

# Test all
pnpm test
```

### 4. Commit and push

```bash
git add .
git commit -m "feat(sdk): add anthropic provider support"
git push -u origin feat/sdk/my-feature
```

### 5. Open PR

PRs to `master` trigger CI for affected packages only.

## Commit Messages

Format: `type(scope): description`

```bash
feat(sdk): add tool validation middleware
fix(cli): handle empty policy files gracefully
docs(readme): update installation instructions
test(sdk): add kernel edge case tests
chore(deps): bump typescript to 5.4
```

## CI Pipeline

CI automatically detects what changed:

| You change... | CI runs... |
|--------------|------------|
| `packages/sdk/**` | SDK tests |
| `packages/cli/**` | CLI tests + Go build |
| `apps/web/**` | Web build |
| Multiple | All affected |

## Releasing

Releases are tag-based:

```bash
# Release SDK v1.1.0
git tag sdk@1.1.0
git push origin sdk@1.1.0

# Release CLI v3.2.0
git tag cli@3.2.0
git push origin cli@3.2.0
```

This triggers automated npm publish.

## Package Dependencies

```
veto-cli ──depends on──> veto-sdk
@veto/web (standalone)
```

When changing SDK, also test CLI:
```bash
pnpm build && pnpm --filter veto-cli test
```

## Commands Reference

| Command | Description |
|---------|-------------|
| `pnpm install` | Install all dependencies |
| `pnpm build` | Build SDK + CLI |
| `pnpm test` | Run all tests |
| `pnpm dev:sdk` | Watch SDK |
| `pnpm dev:cli` | Watch CLI |
| `pnpm dev:web` | Start web dev server |

## Getting Help

- Open an issue for bugs
- Discussions for questions
- PRs always welcome

Happy hacking!
