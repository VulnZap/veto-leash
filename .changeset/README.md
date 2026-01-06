# Changesets

This folder is used by [Changesets](https://github.com/changesets/changesets) to manage versioning and changelogs.

## Adding a Changeset

When you make a change that needs a version bump:

```bash
pnpm changeset
```

This will prompt you to:

1. Select which packages have changed
2. Choose the bump type (major/minor/patch)
3. Write a summary of the change

A markdown file will be created in this folder describing your change.

## What Happens Next

When your PR is merged:

1. A "Version Packages" PR is automatically created/updated
2. Merging that PR publishes to npm/PyPI and creates GitHub releases

## Guidelines

- **patch**: Bug fixes, typo fixes, dependency updates
- **minor**: New features, non-breaking API additions
- **major**: Breaking changes

## Example Changeset

```markdown
---
"veto-sdk": minor
"veto-cli": patch
---

Add new `kernel` validation mode for local LLM-based rule evaluation
```
