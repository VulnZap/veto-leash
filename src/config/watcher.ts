// src/config/watcher.ts
// Background file watcher for automatic .veto recompilation

import { watch, FSWatcher } from 'chokidar';
import { writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { findVetoConfig, loadVetoConfig, compileVetoConfig } from './loader.js';
import { COLORS, SYMBOLS } from '../ui/colors.js';

let watcher: FSWatcher | null = null;
let isCompiling = false;

/**
 * Compiled cache file path (sibling to .veto)
 */
function getCompiledPath(vetoPath: string): string {
  return join(dirname(vetoPath), '.veto.compiled.json');
}

/**
 * Compile the .veto file and write to cache.
 * Called on file change and on initial startup.
 */
async function recompile(vetoPath: string): Promise<boolean> {
  if (isCompiling) return false;
  isCompiling = true;

  try {
    const config = loadVetoConfig(vetoPath);
    if (!config) {
      isCompiling = false;
      return false;
    }

    if (config.policies.length === 0) {
      console.log(`  ${COLORS.dim}No policies to compile${COLORS.reset}`);
      isCompiling = false;
      return true;
    }

    const compiled = await compileVetoConfig(config);
    const outPath = getCompiledPath(vetoPath);
    writeFileSync(outPath, JSON.stringify(compiled, null, 2));
    
    console.log(`  ${COLORS.success}${SYMBOLS.success} Compiled ${compiled.policies.length} policies${COLORS.reset}`);
    isCompiling = false;
    return true;
  } catch (err) {
    console.error(`  ${COLORS.error}${SYMBOLS.error} Compilation failed: ${(err as Error).message}${COLORS.reset}`);
    isCompiling = false;
    return false;
  }
}

/**
 * Start watching the .veto file for changes.
 * Automatically recompiles on every save.
 */
export async function startVetoWatcher(dir: string = process.cwd()): Promise<boolean> {
  const vetoPath = findVetoConfig(dir);
  if (!vetoPath) {
    console.log(`${COLORS.warning}${SYMBOLS.warning} No .veto file found${COLORS.reset}`);
    return false;
  }

  console.log(`\n${COLORS.info}Watching ${vetoPath} for changes...${COLORS.reset}`);
  
  // Initial compile
  await recompile(vetoPath);

  // Watch for changes
  watcher = watch(vetoPath, {
    persistent: true,
    ignoreInitial: true,
  });

  watcher.on('change', async () => {
    console.log(`\n${COLORS.dim}[${new Date().toLocaleTimeString()}] .veto changed${COLORS.reset}`);
    await recompile(vetoPath);
  });

  watcher.on('unlink', () => {
    console.log(`\n${COLORS.warning}${SYMBOLS.warning} .veto file deleted${COLORS.reset}`);
  });

  return true;
}

/**
 * Stop watching the .veto file.
 */
export async function stopVetoWatcher(): Promise<void> {
  if (watcher) {
    await watcher.close();
    watcher = null;
  }
}

/**
 * Check if compiled cache exists and is up-to-date.
 */
export function hasCompiledCache(dir: string = process.cwd()): boolean {
  const vetoPath = findVetoConfig(dir);
  if (!vetoPath) return false;
  return existsSync(getCompiledPath(vetoPath));
}

/**
 * Force recompile the .veto file.
 */
export async function forceRecompile(dir: string = process.cwd()): Promise<boolean> {
  const vetoPath = findVetoConfig(dir);
  if (!vetoPath) return false;
  return recompile(vetoPath);
}
