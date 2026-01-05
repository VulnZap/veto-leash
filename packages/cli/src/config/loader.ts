// src/config/loader.ts
// Load and parse .veto configuration files

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { parse as parseYaml } from 'yaml';
import {
  validateConfig,
  generateSimpleVeto,
  DEFAULT_SETTINGS,
  DEFAULT_SIMPLE_POLICIES,
  type VetoConfig,
  type CompiledVetoConfig,
} from './schema.js';
import { compile } from '../compiler/index.js';
import { COLORS, SYMBOLS, createSpinner } from '../ui/colors.js';
import { parseVetoFile, isSimpleVetoFormat, policiesToConfig } from './veto-parser.js';

const VETO_FILE = '.veto';
const VETO_YAML = '.veto.yaml';
const VETO_YML = '.veto.yml';
const VETO_JSON = '.veto.json';

/**
 * Find .veto config file in current directory
 */
export function findVetoConfig(dir: string = process.cwd()): string | null {
  const candidates = [VETO_FILE, VETO_YAML, VETO_YML, VETO_JSON];
  
  for (const name of candidates) {
    const path = join(dir, name);
    if (existsSync(path)) {
      return path;
    }
  }
  
  return null;
}

/**
 * Load and parse .veto config
 * Supports both simple plain-text format and YAML format.
 */
export function loadVetoConfig(path: string): VetoConfig | null {
  if (!existsSync(path)) {
    return null;
  }

  try {
    const content = readFileSync(path, 'utf-8');
    
    // Handle JSON explicitly
    if (path.endsWith('.json')) {
      const config = JSON.parse(content);
      if (!validateConfig(config)) {
        console.error(`${COLORS.error}${SYMBOLS.error} Invalid .veto config${COLORS.reset}`);
        return null;
      }
      return config;
    }
    
    // Check for simple plain-text format (one rule per line)
    if (isSimpleVetoFormat(content)) {
      const policies = parseVetoFile(content);
      return policiesToConfig(policies);
    }
    
    // Fall back to YAML parsing
    const config = parseYaml(content);
    if (!validateConfig(config)) {
      console.error(`${COLORS.error}${SYMBOLS.error} Invalid .veto config${COLORS.reset}`);
      return null;
    }
    return config;
  } catch (err) {
    console.error(`${COLORS.error}${SYMBOLS.error} Failed to parse .veto: ${(err as Error).message}${COLORS.reset}`);
    return null;
  }
}

/**
 * Compile all policies in a .veto config (parallel for performance)
 */
export async function compileVetoConfig(
  config: VetoConfig
): Promise<CompiledVetoConfig> {
  const compiled: CompiledVetoConfig = {
    version: 1,
    policies: [],
    settings: { ...DEFAULT_SETTINGS, ...config.settings },
    cloud: config.cloud,
  };

  if (config.policies.length === 0) {
    return compiled;
  }

  const spinner = createSpinner(`Compiling ${config.policies.length} policies...`);

  // Compile all policies in parallel for performance
  const results = await Promise.allSettled(
    config.policies.map(async (restriction) => {
      const policy = await compile(restriction);
      return { restriction, policy };
    })
  );

  spinner.stop();

  // Process results, collecting errors
  const errors: string[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      compiled.policies.push(result.value);
    } else {
      errors.push(result.reason?.message || 'Unknown error');
    }
  }

  if (errors.length > 0) {
    console.error(`${COLORS.error}${SYMBOLS.error} Failed to compile ${errors.length} policies:${COLORS.reset}`);
    for (const err of errors) {
      console.error(`  ${err}`);
    }
    if (compiled.policies.length === 0) {
      throw new Error('All policies failed to compile');
    }
    console.log(`${COLORS.warning}${SYMBOLS.warning} Continuing with ${compiled.policies.length} successful policies${COLORS.reset}`);
  }

  return compiled;
}

/**
 * Create a new .veto config file (simple plain-text format)
 */
export function createVetoConfig(dir: string = process.cwd()): string {
  const path = join(dir, VETO_FILE);
  
  if (existsSync(path)) {
    console.log(`${COLORS.warning}${SYMBOLS.warning} .veto already exists${COLORS.reset}`);
    return path;
  }

  const content = generateSimpleVeto(DEFAULT_SIMPLE_POLICIES);
  
  writeFileSync(path, content);
  console.log(`${COLORS.success}${SYMBOLS.success} Created ${path}${COLORS.reset}`);
  
  return path;
}

/**
 * Check if current directory has a .veto config
 */
export function hasVetoConfig(dir: string = process.cwd()): boolean {
  return findVetoConfig(dir) !== null;
}
