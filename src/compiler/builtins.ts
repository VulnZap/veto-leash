// src/compiler/builtins.ts

import type { Policy } from '../types.js';

type PartialPolicy = Omit<Policy, 'action'>;

export const BUILTINS: Record<string, PartialPolicy> = {
  'test files': {
    include: [
      '*.test.*',
      '*.spec.*',
      '**/*.test.*',
      '**/*.spec.*',
      '__tests__/**',
      'test/**/*.ts',
      'test/**/*.js',
      'test/**/*.tsx',
      'test/**/*.jsx',
    ],
    exclude: [
      'test-results.*',
      'test-output.*',
      '**/coverage/**',
      '*.log',
      '*.xml',
    ],
    description: 'Test source files (not artifacts)',
  },
  'test source files': {
    include: [
      '*.test.*',
      '*.spec.*',
      '**/*.test.*',
      '**/*.spec.*',
      '__tests__/**',
      'test/**/*.ts',
      'test/**/*.js',
    ],
    exclude: ['test-results.*', 'test-output.*', '**/coverage/**', '*.log'],
    description: 'Test source files (not artifacts)',
  },
  config: {
    include: [
      '*.config.*',
      '**/*.config.*',
      'tsconfig*',
      '.eslintrc*',
      '.prettierrc*',
      'vite.config.*',
      'webpack.config.*',
      'jest.config.*',
      'vitest.config.*',
      'next.config.*',
    ],
    exclude: [],
    description: 'Configuration files',
  },
  env: {
    include: ['.env', '.env.*', '**/.env', '**/.env.*'],
    exclude: ['.env.example', '.env.template', '.env.sample'],
    description: 'Environment files (secrets)',
  },
  '.env': {
    include: ['.env', '.env.*', '**/.env', '**/.env.*'],
    exclude: ['.env.example', '.env.template', '.env.sample'],
    description: 'Environment files (secrets)',
  },
  migrations: {
    include: [
      '**/migrations/**',
      '*migrate*',
      'prisma/migrations/**',
      'db/migrate/**',
      '**/db/**/*.sql',
      'drizzle/**',
    ],
    exclude: [],
    description: 'Database migrations',
  },
  'database migrations': {
    include: [
      '**/migrations/**',
      '*migrate*',
      'prisma/migrations/**',
      'db/migrate/**',
      'drizzle/**',
    ],
    exclude: [],
    description: 'Database migrations',
  },
  'lock files': {
    include: [
      'package-lock.json',
      'yarn.lock',
      'pnpm-lock.yaml',
      'Gemfile.lock',
      'Cargo.lock',
      'poetry.lock',
      '*.lock',
    ],
    exclude: [],
    description: 'Dependency lock files',
  },
  node_modules: {
    include: ['node_modules/**', '**/node_modules/**'],
    exclude: [],
    description: 'Node modules directory',
  },
  '.md files': {
    include: ['*.md', '**/*.md'],
    exclude: [],
    description: 'Markdown files',
  },
  'src/core': {
    include: ['src/core/**'],
    exclude: ['src/core/**/*.log', 'src/core/**/*.tmp'],
    description: 'Core source directory',
  },
};

export function findBuiltin(phrase: string): PartialPolicy | null {
  const normalized = phrase.toLowerCase().trim();

  // Direct match
  if (BUILTINS[normalized]) {
    return BUILTINS[normalized];
  }

  // Partial match
  for (const [key, value] of Object.entries(BUILTINS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }

  return null;
}
