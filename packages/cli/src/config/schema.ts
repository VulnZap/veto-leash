// src/config/schema.ts
// .veto file schema and validation

import type { Policy } from '../types.js';

export interface VetoConfig {
  version: 1;
  policies: string[];
  settings?: VetoSettings;
  cloud?: VetoCloudConfig;
}

export interface VetoSettings {
  fail_closed?: boolean;
  audit_log?: boolean;
  verbose?: boolean;
}

export interface VetoCloudConfig {
  team_id?: string;
  sync?: boolean;
}

export interface CompiledVetoConfig {
  version: 1;
  policies: Array<{
    restriction: string;
    policy: Policy;
  }>;
  settings: VetoSettings;
  cloud?: VetoCloudConfig;
}

/**
 * Default settings
 */
export const DEFAULT_SETTINGS: VetoSettings = {
  fail_closed: true,
  audit_log: false,
  verbose: false,
};

/**
 * Validate a .veto config object
 */
export function validateConfig(config: unknown): config is VetoConfig {
  if (typeof config !== 'object' || config === null) {
    return false;
  }

  const c = config as Record<string, unknown>;

  // Version check
  if (c.version !== 1) {
    return false;
  }

  // Policies must be array of strings
  if (!Array.isArray(c.policies)) {
    return false;
  }

  for (const policy of c.policies) {
    if (typeof policy !== 'string') {
      return false;
    }
  }

  // Settings are optional
  if (c.settings !== undefined) {
    if (typeof c.settings !== 'object' || c.settings === null) {
      return false;
    }
  }

  return true;
}

/**
 * Generate a default .veto config
 */
export function generateDefaultConfig(): VetoConfig {
  return {
    version: 1,
    policies: [
      "don't delete test files",
      "protect .env",
    ],
    settings: {
      fail_closed: true,
      audit_log: false,
    },
  };
}

/**
 * Generate YAML content for a .veto file
 */
export function generateVetoYaml(config: VetoConfig): string {
  const lines: string[] = [
    '# .veto - Veto project configuration',
    '# Commit this file to version control',
    '',
    'version: 1',
    '',
    '# Natural language restrictions',
    'policies:',
  ];

  for (const policy of config.policies) {
    lines.push(`  - "${policy}"`);
  }

  if (config.settings) {
    lines.push('');
    lines.push('# Optional settings');
    lines.push('settings:');
    if (config.settings.fail_closed !== undefined) {
      lines.push(`  fail_closed: ${config.settings.fail_closed}`);
    }
    if (config.settings.audit_log !== undefined) {
      lines.push(`  audit_log: ${config.settings.audit_log}`);
    }
  }

  if (config.cloud) {
    lines.push('');
    lines.push('# Veto Cloud (coming soon)');
    lines.push('# cloud:');
    lines.push('#   team_id: "team_xxx"');
    lines.push('#   sync: true');
  }

  lines.push('');
  return lines.join('\n');
}

/**
 * Default policies for simple .veto format
 * These are universal and work across all projects/languages
 */
export const DEFAULT_SIMPLE_POLICIES = [
  "protect .env",
  "don't delete test files",
];

/**
 * Generate simple plain-text .veto content
 */
export function generateSimpleVeto(policies: string[]): string {
  return [
    '# .veto - Policies for AI coding agents',
    '# One policy per line. Lines starting with # are comments.',
    '',
    ...policies,
    '',
  ].join('\n');
}
