// src/matcher.ts

import micromatch from 'micromatch';
import type { Policy } from './types.js';

const { isMatch } = micromatch;

const MATCH_OPTIONS = {
  basename: true, // *.test.ts matches src/foo.test.ts
  dot: true, // Match dotfiles
  nocase: true, // Case insensitive (important for Windows)
};

/**
 * Normalize a path for cross-platform pattern matching.
 * - Converts backslashes to forward slashes (Windows paths)
 * - Removes trailing slashes
 * - Normalizes . and .. segments
 */
export function normalizePath(p: string): string {
  // Convert Windows backslashes to forward slashes
  let normalized = p.replace(/\\/g, '/');
  
  // Remove trailing slash
  if (normalized.endsWith('/') && normalized.length > 1) {
    normalized = normalized.slice(0, -1);
  }
  
  // Simple normalization of . and ..
  const parts = normalized.split('/');
  const result: string[] = [];
  
  for (const part of parts) {
    if (part === '..') {
      result.pop();
    } else if (part !== '.' && part !== '') {
      result.push(part);
    }
  }
  
  // Preserve leading slash for absolute paths
  if (normalized.startsWith('/')) {
    return '/' + result.join('/');
  }
  
  return result.join('/') || '.';
}

/**
 * Check if a target path is protected by the policy.
 * Returns true if the target matches include patterns and doesn't match exclude patterns.
 */
export function isProtected(target: string, policy: Policy): boolean {
  // Normalize the target path for cross-platform matching
  const normalizedTarget = normalizePath(target);
  
  const matchesInclude = policy.include.some((p) =>
    isMatch(normalizedTarget, p, MATCH_OPTIONS)
  );

  if (!matchesInclude) return false;

  const matchesExclude = policy.exclude.some((p) =>
    isMatch(normalizedTarget, p, MATCH_OPTIONS)
  );

  return !matchesExclude;
}

/**
 * Get all files in a list that would be protected by the policy.
 */
export function getProtectedFiles(files: string[], policy: Policy): string[] {
  return files.filter((f) => isProtected(f, policy));
}

/**
 * Get all files in a list that would be excluded (allowed) by the policy.
 */
export function getExcludedFiles(files: string[], policy: Policy): string[] {
  return files.filter((f) => {
    const matchesInclude = policy.include.some((p) =>
      isMatch(f, p, MATCH_OPTIONS)
    );
    if (!matchesInclude) return false;

    return policy.exclude.some((p) => isMatch(f, p, MATCH_OPTIONS));
  });
}
