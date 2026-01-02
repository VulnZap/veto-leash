// src/compiler/cache.ts

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { createHash } from 'crypto';
import type { Policy } from '../types.js';

const CACHE_DIR = join(homedir(), '.config', 'veto-leash');
const CACHE_FILE = join(CACHE_DIR, 'cache.json');

export function hashInput(input: string): string {
  return createHash('sha256')
    .update(input.toLowerCase().trim())
    .digest('hex')
    .slice(0, 16);
}

export function getFromCache(input: string): Policy | null {
  try {
    if (!existsSync(CACHE_FILE)) return null;
    const cache = JSON.parse(readFileSync(CACHE_FILE, 'utf-8'));
    const key = hashInput(input);
    return cache[key] ?? null;
  } catch {
    return null;
  }
}

export function saveToCache(input: string, policy: Policy): void {
  try {
    mkdirSync(CACHE_DIR, { recursive: true });
    const cache = existsSync(CACHE_FILE)
      ? JSON.parse(readFileSync(CACHE_FILE, 'utf-8'))
      : {};
    cache[hashInput(input)] = policy;
    writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch {
    // Ignore cache write failures
  }
}

export function clearCache(): void {
  try {
    if (existsSync(CACHE_FILE)) {
      writeFileSync(CACHE_FILE, '{}');
    }
  } catch {
    // Ignore
  }
}
