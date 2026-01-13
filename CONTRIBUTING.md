# Contributing to Veto

Thanks for your interest in contributing! This guide will get you up and running quickly.

## Quick Start

```bash
git clone https://github.com/VulnZap/veto.git
cd veto
pnpm install
pnpm build
pnpm test
```

## Project Structure

```
veto/
├── packages/
│   ├── sdk/           # TypeScript SDK (npm: veto-sdk)
│   ├── sdk-python/    # Python SDK (pip: veto)
│   └── cli/           # CLI + TUI (npm: veto-cli)
├── apps/
│   └── web/           # Landing page (veto.run)
└── .changeset/        # Version management
```

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feat/sdk/your-feature   # SDK feature
git checkout -b feat/cli/your-feature   # CLI feature
git checkout -b fix/sdk/your-fix        # SDK bugfix
```

### 2. Make Changes

```bash
pnpm dev:sdk    # Watch SDK
pnpm dev:cli    # Watch CLI
pnpm dev:web    # Landing page dev server
```

Code style:

- **TypeScript**: Use `.js` extensions in imports
- **Types**: Explicit param/return types, use `type` imports
- **Errors**: Throw typed errors, never `process.exit()` in libraries
- **Tests**: Add tests for new functionality

### 3. Add a Changeset

Every PR that affects published packages needs a changeset:

```bash
pnpm changeset
```

This prompts you to:

1. Select changed packages
2. Choose bump type (patch/minor/major)
3. Write a change summary

**Bump Guidelines:**

- `patch`: Bug fixes, dependency updates
- `minor`: New features, non-breaking additions
- `major`: Breaking changes

### 4. Run Checks

```bash
pnpm build      # Build all packages
pnpm test       # Run all tests
pnpm typecheck  # Type check (if available)
```

### 5. Submit PR

- Use descriptive title: `feat(sdk): add kernel validation mode`
- Reference issues: `Fixes #123`
- Ensure CI passes

## Testing

```bash
pnpm test                           # All tests
pnpm --filter veto-sdk test         # SDK only
pnpm --filter veto-cli test         # CLI only
pnpm --filter veto-sdk test:watch   # Watch mode
```

### Python SDK

```bash
cd packages/sdk-python
pip install -e ".[dev]"
pytest -v
ruff check src
mypy src
```

## Release Process

Releases are fully automated:

1. PRs with changesets merge to `master`
2. A "Version Packages" PR is automatically created
3. Merging that PR:
   - Bumps versions
   - Generates changelogs
   - Publishes to npm (SDK, CLI)
   - Publishes to PyPI (Python SDK)
   - Creates GitHub releases

Manual release (maintainers only):

```bash
gh workflow run release.yml -f force=true
```

## Commands Reference

| Command          | Description              |
| ---------------- | ------------------------ |
| `pnpm install`   | Install all dependencies |
| `pnpm build`     | Build all packages       |
| `pnpm test`      | Run all tests            |
| `pnpm typecheck` | Type check all packages  |
| `pnpm changeset` | Add a changeset          |
| `pnpm dev:sdk`   | Watch SDK                |
| `pnpm dev:cli`   | Watch CLI                |
| `pnpm dev:web`   | Start web dev server     |

## Getting Help

- [GitHub Issues](https://github.com/VulnZap/veto/issues) - Bug reports, feature requests
- [GitHub Discussions](https://github.com/VulnZap/veto/discussions) - Questions, ideas

## License

By contributing, you agree that your contributions will be licensed under the Apache-2.0 License.
