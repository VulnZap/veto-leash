// src/compiler/index.ts

import type { Policy } from '../types.js';
import { findBuiltin } from './builtins.js';
import { getFromCache, saveToCache } from './cache.js';
import { compileWithLLM } from './llm.js';

export async function compile(restriction: string): Promise<Policy> {
  const normalized = restriction.toLowerCase().trim();

  // Extract action from input
  let action: Policy['action'] = 'modify';
  let targetPhrase = normalized;

  const actionPatterns: Array<[RegExp, Policy['action']]> = [
    [/^(don'?t\s+)?(delete|remove|rm)\s+/, 'delete'],
    [/^(don'?t\s+)?(modify|edit|change|update|write|touch)\s+/, 'modify'],
    [/^(don'?t\s+)?(run|execute|running|executing)\s+/, 'execute'],
    [/^(don'?t\s+)?(read|view|access)\s+/, 'read'],
    [/^(protect|preserve|keep|save)\s+/, 'modify'],
    // "no running X" → execute, "no X" (files) → modify
    [/^no\s+(running|executing)\s+/, 'execute'],
    [/^no\s+/, 'modify'], // Default "no X" to modify (protects files)
  ];

  for (const [pattern, act] of actionPatterns) {
    if (pattern.test(normalized)) {
      action = act;
      targetPhrase = normalized.replace(pattern, '').trim();
      break;
    }
  }

  // Strip filler words
  targetPhrase = targetPhrase
    .replace(/^(any|all|the)\s+/g, '')
    .replace(/\s+(files?|directories?|folders?)$/g, '')
    .trim();

  // Layer 1: Builtins (instant)
  const builtin = findBuiltin(targetPhrase);
  if (builtin) {
    return { action, ...builtin };
  }

  // Layer 2: Cache (instant)
  const cached = getFromCache(normalized);
  if (cached) {
    return cached;
  }

  // Layer 3: LLM compilation (~100ms)
  const policy = await compileWithLLM(restriction, action);

  // Save to cache for next time
  saveToCache(normalized, policy);

  return policy;
}
