#!/usr/bin/env node
// postinstall.js - Copies the appropriate Go binary for the user's platform

import { copyFileSync, chmodSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const binDir = join(rootDir, 'bin');

// Determine platform and architecture
const platform = process.platform;
const arch = process.arch;

// Map to Go binary names
const binaryMap = {
  'darwin-arm64': 'leash-darwin-arm64',
  'darwin-x64': 'leash-darwin-amd64',
  'linux-x64': 'leash-linux-amd64',
  'linux-arm64': 'leash-linux-arm64',
  'win32-x64': 'leash-windows-amd64.exe',
};

const key = `${platform}-${arch}`;
const binaryName = binaryMap[key];

if (!binaryName) {
  console.log(`Platform ${platform}-${arch} not supported for native binary.`);
  console.log('Falling back to Node.js CLI.');
  process.exit(0);
}

const sourcePath = join(rootDir, 'go', binaryName);
const destPath = join(binDir, platform === 'win32' ? 'leash.exe' : 'leash');

// Check if Go binary exists
if (!existsSync(sourcePath)) {
  console.log(`Native binary not found: ${sourcePath}`);
  console.log('Using Node.js CLI. Run "cd go && make build-all" to build native binaries.');
  process.exit(0);
}

// Create bin directory
if (!existsSync(binDir)) {
  mkdirSync(binDir, { recursive: true });
}

// Copy binary
try {
  copyFileSync(sourcePath, destPath);
  chmodSync(destPath, 0o755);
  console.log(`Installed native leash binary for ${platform}-${arch}`);
} catch (err) {
  console.error(`Failed to install binary: ${err.message}`);
  console.log('Falling back to Node.js CLI.');
}
