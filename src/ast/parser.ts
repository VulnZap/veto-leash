// src/ast/parser.ts
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as os from 'os';

// Type definitions for tree-sitter (defined locally to avoid import issues)
export interface Language {
  query(source: string): Query;
}

export interface Tree {
  rootNode: SyntaxNode;
}

export interface Query {
  matches(node: SyntaxNode): QueryMatch[];
  captures(node: SyntaxNode): QueryCapture[];
}

export interface SyntaxNode {
  type: string;
  text: string;
  startPosition: { row: number; column: number };
  endPosition: { row: number; column: number };
  children: SyntaxNode[];
}

export interface QueryMatch {
  pattern: number;
  captures: QueryCapture[];
}

export interface QueryCapture {
  name: string;
  node: SyntaxNode;
}

// Supported languages - grouped by ecosystem
export type LanguageType = 
  // JavaScript ecosystem
  | 'typescript' | 'javascript' | 'tsx' | 'jsx'
  // Python
  | 'python'
  // Systems languages
  | 'go' | 'rust' | 'c' | 'cpp'
  // JVM
  | 'java' | 'kotlin'
  // Web/scripting
  | 'ruby' | 'php'
  // Shell
  | 'bash';

export interface ParseResult {
  tree: Tree;
  language: LanguageType;
  parseTimeMs: number;
}

// Dynamic tree-sitter module reference
let TreeSitter: any = null;

// Module state
let initialized = false;
let initPromise: Promise<void> | null = null;
const languages = new Map<LanguageType, Language>();
const parsers = new Map<LanguageType, any>();
const treeCache = new Map<string, { tree: Tree; hash: string }>();

// Cache directory for downloaded WASM files
const WASM_CACHE_DIR = path.join(os.homedir(), '.cache', 'veto-leash', 'languages');

// Language WASM file URLs - tree-sitter grammars compiled to WASM
// These are downloaded on-demand and cached locally
const LANGUAGE_WASM_URLS: Partial<Record<LanguageType, string>> = {
  // JavaScript ecosystem
  typescript: 'https://github.com/AdeAttwood/tree-sitter-typescript-wasm/releases/download/0.23.0/tree-sitter-typescript.wasm',
  tsx: 'https://github.com/AdeAttwood/tree-sitter-typescript-wasm/releases/download/0.23.0/tree-sitter-tsx.wasm',
  javascript: 'https://github.com/AdeAttwood/tree-sitter-javascript-wasm/releases/download/0.21.0/tree-sitter-javascript.wasm',
  jsx: 'https://github.com/AdeAttwood/tree-sitter-javascript-wasm/releases/download/0.21.0/tree-sitter-javascript.wasm',
  // Python
  python: 'https://github.com/AdeAttwood/tree-sitter-python-wasm/releases/download/0.23.0/tree-sitter-python.wasm',
  // Go
  go: 'https://github.com/AdeAttwood/tree-sitter-go-wasm/releases/download/0.23.0/tree-sitter-go.wasm',
  // Rust
  rust: 'https://github.com/AdeAttwood/tree-sitter-rust-wasm/releases/download/0.23.0/tree-sitter-rust.wasm',
  // C/C++
  c: 'https://github.com/AdeAttwood/tree-sitter-c-wasm/releases/download/0.23.0/tree-sitter-c.wasm',
  cpp: 'https://github.com/AdeAttwood/tree-sitter-cpp-wasm/releases/download/0.23.0/tree-sitter-cpp.wasm',
  // JVM
  java: 'https://github.com/AdeAttwood/tree-sitter-java-wasm/releases/download/0.23.0/tree-sitter-java.wasm',
  kotlin: 'https://github.com/AdeAttwood/tree-sitter-kotlin-wasm/releases/download/0.1.0/tree-sitter-kotlin.wasm',
  // Scripting
  ruby: 'https://github.com/AdeAttwood/tree-sitter-ruby-wasm/releases/download/0.23.0/tree-sitter-ruby.wasm',
  php: 'https://github.com/AdeAttwood/tree-sitter-php-wasm/releases/download/0.23.0/tree-sitter-php.wasm',
  bash: 'https://github.com/AdeAttwood/tree-sitter-bash-wasm/releases/download/0.23.0/tree-sitter-bash.wasm',
};

/**
 * Load web-tree-sitter module dynamically to handle different versions.
 * Supports both named exports (modern) and default export (older).
 * Note: Language class may not be available until after Parser.init()
 */
async function loadTreeSitter(): Promise<any> {
  if (TreeSitter) return TreeSitter;
  
  const mod: any = await import('web-tree-sitter');
  
  // Modern versions use named exports
  if (mod.Parser && typeof mod.Parser.init === 'function') {
    TreeSitter = { Parser: mod.Parser, _mod: mod };
    return TreeSitter;
  }
  
  // Older versions use default export (Parser class directly)
  if (mod.default && typeof mod.default.init === 'function') {
    TreeSitter = { Parser: mod.default, _mod: mod };
    return TreeSitter;
  }
  
  // Fallback: module itself is Parser class
  if (typeof mod.init === 'function') {
    TreeSitter = { Parser: mod, _mod: mod };
    return TreeSitter;
  }
  
  throw new Error('Failed to load web-tree-sitter: unknown export format');
}

/**
 * Get Language class after initialization
 * In older versions, Language is available as Parser.Language after init
 */
function getLanguageClass(): any {
  if (!TreeSitter) throw new Error('TreeSitter not loaded');
  
  // Check various locations for Language class
  if (TreeSitter._mod?.Language) return TreeSitter._mod.Language;
  if (TreeSitter.Parser?.Language) return TreeSitter.Parser.Language;
  if (TreeSitter.Language) return TreeSitter.Language;
  
  throw new Error('Cannot find Language class in web-tree-sitter');
}

/**
 * Initialize the tree-sitter WASM runtime.
 * Must be called before any parsing operations.
 */
export async function initParser(): Promise<void> {
  if (initialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const ts = await loadTreeSitter();
      await ts.Parser.init();
      initialized = true;
    } catch (error) {
      console.warn('Failed to initialize tree-sitter:', error);
      throw error;
    }
  })();

  return initPromise;
}

/**
 * Check if the parser is initialized
 */
export function isInitialized(): boolean {
  return initialized;
}

/**
 * Download a WASM file from URL and cache it locally
 */
async function downloadWasmFile(url: string, destPath: string): Promise<void> {
  // Ensure cache directory exists
  const dir = path.dirname(destPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Download with fetch
  const response = await fetch(url, {
    redirect: 'follow',
    headers: { 'Accept': 'application/octet-stream' },
  });

  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(buffer));
}

/**
 * Get the cached WASM file path
 */
function getCachedWasmPath(languageType: LanguageType): string {
  const wasmFile = getWasmFileName(languageType);
  return path.join(WASM_CACHE_DIR, wasmFile);
}

/**
 * Load a language from a WASM file.
 * Downloads on first use and caches locally for subsequent uses.
 */
export async function loadLanguage(languageType: LanguageType): Promise<Language> {
  if (languages.has(languageType)) {
    return languages.get(languageType)!;
  }

  await initParser();
  const LanguageClass = getLanguageClass();

  // Priority order:
  // 1. Local project WASM file (./languages/)
  // 2. Cached WASM file (~/.cache/veto-leash/languages/)
  // 3. Download from URL and cache

  const localWasmPath = getLocalWasmPath(languageType);
  const cachedWasmPath = getCachedWasmPath(languageType);
  
  let wasmPath: string | null = null;

  // Check local project first
  if (localWasmPath && fs.existsSync(localWasmPath)) {
    wasmPath = localWasmPath;
  }
  // Check cache
  else if (fs.existsSync(cachedWasmPath)) {
    wasmPath = cachedWasmPath;
  }
  // Download and cache
  else {
    const url = LANGUAGE_WASM_URLS[languageType];
    if (!url) {
      throw new Error(
        `Language ${languageType} is not yet supported. ` +
        `Supported languages: ${Object.keys(LANGUAGE_WASM_URLS).join(', ')}`
      );
    }

    try {
      await downloadWasmFile(url, cachedWasmPath);
      wasmPath = cachedWasmPath;
    } catch (error: any) {
      throw new Error(
        `Failed to download ${languageType} parser: ${error.message}\n` +
        `URL: ${url}\n` +
        `You can manually download and place in: ${cachedWasmPath}`
      );
    }
  }

  const language = await LanguageClass.load(wasmPath);
  languages.set(languageType, language);
  return language;
}

/**
 * Check if a language is supported (has WASM available locally or can be downloaded)
 */
export function isLanguageSupported(languageType: LanguageType): boolean {
  // Already loaded
  if (languages.has(languageType)) return true;
  // Local project WASM
  const localPath = getLocalWasmPath(languageType);
  if (localPath && fs.existsSync(localPath)) return true;
  // Cached WASM
  const cachedPath = getCachedWasmPath(languageType);
  if (fs.existsSync(cachedPath)) return true;
  // Can be downloaded
  return !!LANGUAGE_WASM_URLS[languageType];
}

/**
 * Check if a language WASM is already downloaded (no network needed)
 */
export function isLanguageAvailableOffline(languageType: LanguageType): boolean {
  if (languages.has(languageType)) return true;
  const localPath = getLocalWasmPath(languageType);
  if (localPath && fs.existsSync(localPath)) return true;
  const cachedPath = getCachedWasmPath(languageType);
  return fs.existsSync(cachedPath);
}

/**
 * Get WASM file name for a language
 */
function getWasmFileName(languageType: LanguageType): string {
  // Map language types to their WASM file names
  const mapping: Partial<Record<LanguageType, string>> = {
    jsx: 'javascript',  // JSX uses JavaScript parser
    tsx: 'tsx',         // TSX has its own parser
  };
  const base = mapping[languageType] || languageType;
  return `tree-sitter-${base}.wasm`;
}

/**
 * Get local WASM file path if it exists
 */
function getLocalWasmPath(languageType: LanguageType): string | null {
  const wasmFile = getWasmFileName(languageType);
  
  // Try multiple locations
  const candidates = [
    // From process.cwd() (most reliable)
    path.resolve(process.cwd(), 'languages', wasmFile),
    // From import.meta.url
    (() => {
      try {
        const __dirname = path.dirname(fileURLToPath(import.meta.url));
        return path.resolve(__dirname, '..', '..', 'languages', wasmFile);
      } catch {
        return null;
      }
    })(),
    // From hooks directory
    (() => {
      try {
        const __dirname = path.dirname(fileURLToPath(import.meta.url));
        return path.resolve(__dirname, '..', 'languages', wasmFile);
      } catch {
        return null;
      }
    })(),
  ].filter((p): p is string => p !== null);
  
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  
  return null;
}

/**
 * Get or create a parser for the given language
 */
export async function getParser(languageType: LanguageType): Promise<any> {
  if (parsers.has(languageType)) {
    return parsers.get(languageType)!;
  }

  const ts = await loadTreeSitter();
  const language = await loadLanguage(languageType);
  const parser = new ts.Parser();
  parser.setLanguage(language);
  parsers.set(languageType, parser);
  return parser;
}

/**
 * Get the language object for query creation
 */
export async function getLanguageObject(languageType: LanguageType): Promise<Language> {
  return loadLanguage(languageType);
}

/**
 * Parse file content into AST
 * Uses caching for performance
 */
export async function parseFile(
  content: string,
  filePath: string,
  languageType: LanguageType
): Promise<ParseResult> {
  const start = performance.now();
  const parser = await getParser(languageType);

  // Check cache
  const hash = hashContent(content);
  const cached = treeCache.get(filePath);

  let tree: Tree;
  if (cached && cached.hash === hash) {
    tree = cached.tree;
  } else {
    // Don't use incremental parsing when content changed
    const result = parser.parse(content);
    if (!result) {
      throw new Error(`Failed to parse ${filePath}`);
    }
    tree = result;
    treeCache.set(filePath, { tree, hash });
  }

  return {
    tree,
    language: languageType,
    parseTimeMs: performance.now() - start,
  };
}

/**
 * Detect language from file extension
 */
export function detectLanguage(filePath: string): LanguageType | null {
  const ext = filePath.split('.').pop()?.toLowerCase();
  switch (ext) {
    // JavaScript ecosystem
    case 'ts':
    case 'mts':
    case 'cts':
      return 'typescript';
    case 'tsx':
      return 'tsx';
    case 'js':
    case 'mjs':
    case 'cjs':
      return 'javascript';
    case 'jsx':
      return 'jsx';
    // Python
    case 'py':
    case 'pyw':
    case 'pyi':
      return 'python';
    // Go
    case 'go':
      return 'go';
    // Rust
    case 'rs':
      return 'rust';
    // C/C++
    case 'c':
    case 'h':
      return 'c';
    case 'cpp':
    case 'cc':
    case 'cxx':
    case 'hpp':
    case 'hxx':
      return 'cpp';
    // JVM
    case 'java':
      return 'java';
    case 'kt':
    case 'kts':
      return 'kotlin';
    // Web/scripting
    case 'rb':
    case 'rake':
    case 'gemspec':
      return 'ruby';
    case 'php':
      return 'php';
    // Shell
    case 'sh':
    case 'bash':
    case 'zsh':
      return 'bash';
    default:
      return null;
  }
}

/**
 * Clear the tree cache for a specific file or all files
 */
export function clearTreeCache(filePath?: string): void {
  if (filePath) {
    treeCache.delete(filePath);
  } else {
    treeCache.clear();
  }
}

/**
 * Reset all parser state (for testing)
 */
export function resetParserState(): void {
  treeCache.clear();
  languages.clear();
  parsers.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { parserCount: number; treeCacheSize: number; languageCount: number } {
  return {
    parserCount: parsers.size,
    treeCacheSize: treeCache.size,
    languageCount: languages.size,
  };
}

/**
 * Get the WASM cache directory path
 */
export function getWasmCacheDir(): string {
  return WASM_CACHE_DIR;
}

/**
 * List all cached WASM files
 */
export function listCachedLanguages(): LanguageType[] {
  if (!fs.existsSync(WASM_CACHE_DIR)) return [];
  
  const files = fs.readdirSync(WASM_CACHE_DIR);
  const cached: LanguageType[] = [];
  
  for (const file of files) {
    if (!file.endsWith('.wasm')) continue;
    // Extract language from filename: tree-sitter-typescript.wasm -> typescript
    const match = file.match(/^tree-sitter-(.+)\.wasm$/);
    if (match) {
      const lang = match[1] as LanguageType;
      if (LANGUAGE_WASM_URLS[lang]) {
        cached.push(lang);
      }
    }
  }
  
  return cached;
}

/**
 * Pre-download all supported language WASM files
 */
export async function downloadAllLanguages(): Promise<{ success: LanguageType[]; failed: LanguageType[] }> {
  const success: LanguageType[] = [];
  const failed: LanguageType[] = [];
  
  for (const lang of Object.keys(LANGUAGE_WASM_URLS) as LanguageType[]) {
    try {
      await loadLanguage(lang);
      success.push(lang);
    } catch {
      failed.push(lang);
    }
  }
  
  return { success, failed };
}

/**
 * Fast hash function for cache invalidation
 */
function hashContent(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    hash = ((hash << 5) - hash) + content.charCodeAt(i);
    hash = hash & hash;
  }
  return hash.toString(36);
}
