#!/usr/bin/env node
// bin/veto.js - Wrapper that uses native binary or falls back to Node.js

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// Try native binary first
const nativeBinary = process.platform === 'win32' 
  ? join(__dirname, 'veto.exe')
  : join(__dirname, 'veto');

if (existsSync(nativeBinary)) {
  // Use native binary
  const child = spawn(nativeBinary, process.argv.slice(2), {
    stdio: 'inherit',
    env: process.env,
  });
  
  child.on('exit', (code) => {
    process.exit(code || 0);
  });
} else {
  // Fall back to Node.js CLI
  const nodeCLI = join(rootDir, 'dist', 'cli.js');
  
  if (!existsSync(nodeCLI)) {
    console.error('veto: Neither native binary nor Node.js CLI found.');
    console.error('Run "pnpm build" to build the CLI.');
    process.exit(1);
  }
  
  const child = spawn('node', [nodeCLI, ...process.argv.slice(2)], {
    stdio: 'inherit',
    env: process.env,
  });
  
  child.on('exit', (code) => {
    process.exit(code || 0);
  });
}
