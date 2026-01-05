// src/ast/builtins.ts
import type { ASTRule } from '../types.js';

/**
 * Pre-compiled AST queries for common restrictions.
 * These replace regex-based content rules with precise structural queries.
 *
 * Key advantages over regex:
 * - Zero false positives (AST ignores comments and strings)
 * - Catches all variants (destructuring, bracket notation, dynamic imports)
 * - Can express structural constraints regex cannot
 *
 * Query syntax: tree-sitter S-expressions
 * - (node_type) matches any node of that type
 * - (node_type field: (child)) matches with specific field
 * - @name captures the node
 * - (#eq? @name "value") exact string match on node text
 * - (#match? @name "regex") regex match on node text
 */
export const AST_BUILTINS: Record<string, ASTRule[]> = {
  // ═══════════════════════════════════════════════════════════════════════════
  // IMPORT RESTRICTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  'no lodash': [
    {
      id: 'no-lodash-import',
      // Matches: import _ from 'lodash', import { map } from 'lodash', import 'lodash/map'
      query: `(import_statement source: (string) @source (#match? @source "lodash"))`,
      languages: ['typescript', 'javascript'],
      reason: 'Use native Array/Object methods instead of lodash',
      suggest: 'Use Array.map(), filter(), reduce(), Object.keys(), etc.',
      regexPreFilter: 'lodash',
    },
    {
      id: 'no-lodash-require',
      // Matches: require('lodash'), require('lodash/map')
      query: `
        (call_expression
          function: (identifier) @fn (#eq? @fn "require")
          arguments: (arguments (string) @source (#match? @source "lodash")))
      `,
      languages: ['typescript', 'javascript'],
      reason: 'Use native Array/Object methods instead of lodash',
      regexPreFilter: 'lodash',
    },
    {
      id: 'no-lodash-dynamic-import',
      // Matches: import('lodash'), import('lodash/map')
      query: `
        (call_expression
          function: (import)
          arguments: (arguments (string) @source (#match? @source "lodash")))
      `,
      languages: ['typescript', 'javascript'],
      reason: 'Dynamic import of lodash detected',
      regexPreFilter: 'lodash',
    },
  ],

  'no moment': [
    {
      id: 'no-moment-import',
      query: `(import_statement source: (string) @source (#match? @source "^['\"]moment['\"]$"))`,
      languages: ['typescript', 'javascript'],
      reason: 'moment.js is deprecated and heavy (330KB+)',
      suggest: 'Use date-fns, dayjs, or native Date/Intl APIs',
      regexPreFilter: 'moment',
    },
    {
      id: 'no-moment-require',
      query: `
        (call_expression
          function: (identifier) @fn (#eq? @fn "require")
          arguments: (arguments (string) @source (#match? @source "^['\"]moment['\"]$")))
      `,
      languages: ['typescript', 'javascript'],
      reason: 'moment.js is deprecated and heavy',
      regexPreFilter: 'moment',
    },
  ],

  'no jquery': [
    {
      id: 'no-jquery-import',
      query: `(import_statement source: (string) @source (#match? @source "jquery"))`,
      languages: ['typescript', 'javascript'],
      reason: 'jQuery is unnecessary in modern browsers',
      suggest: 'Use native DOM APIs: querySelector, fetch, classList',
      regexPreFilter: 'jquery',
    },
  ],

  'no axios': [
    {
      id: 'no-axios-import',
      query: `(import_statement source: (string) @source (#match? @source "^['\"]axios"))`,
      languages: ['typescript', 'javascript'],
      reason: 'Use native fetch API instead of axios',
      suggest: 'Use fetch() with optional wrapper for convenience',
      regexPreFilter: 'axios',
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // TYPESCRIPT STRICTNESS
  // ═══════════════════════════════════════════════════════════════════════════

  'no any': [
    {
      id: 'no-any-type-annotation',
      // Matches: x: any, (): any, function(): any
      query: `(type_annotation (predefined_type) @type (#eq? @type "any"))`,
      languages: ['typescript'],
      reason: 'Use proper TypeScript types instead of any',
      suggest: 'Use unknown, specific types, or generics',
      regexPreFilter: 'any',
    },
    {
      id: 'no-any-type-argument',
      // Matches: Array<any>, Map<string, any>, Promise<any>
      query: `(type_arguments (predefined_type) @type (#eq? @type "any"))`,
      languages: ['typescript'],
      reason: 'Avoid any in generic type arguments',
      suggest: 'Use specific types: Array<string>, Map<string, User>',
      regexPreFilter: 'any',
    },
    {
      id: 'no-as-any',
      // Matches: value as any, (x as any)
      query: `(as_expression (predefined_type) @type (#eq? @type "any"))`,
      languages: ['typescript'],
      reason: 'Avoid type assertions to any',
      suggest: 'Use proper type narrowing or as unknown',
      regexPreFilter: 'as any',
    },
  ],

  'no any types': [
    // All 'no any' rules plus type alias
    {
      id: 'no-any-type-annotation',
      query: `(type_annotation (predefined_type) @type (#eq? @type "any"))`,
      languages: ['typescript'],
      reason: 'Use proper TypeScript types instead of any',
      suggest: 'Use unknown, specific types, or generics',
      regexPreFilter: 'any',
    },
    {
      id: 'no-any-type-argument',
      query: `(type_arguments (predefined_type) @type (#eq? @type "any"))`,
      languages: ['typescript'],
      reason: 'Avoid any in generic type arguments',
      suggest: 'Use specific types: Array<string>, Map<string, User>',
      regexPreFilter: 'any',
    },
    {
      id: 'no-as-any',
      query: `(as_expression (predefined_type) @type (#eq? @type "any"))`,
      languages: ['typescript'],
      reason: 'Avoid type assertions to any',
      suggest: 'Use proper type narrowing or as unknown',
      regexPreFilter: 'as any',
    },
    {
      id: 'no-any-type-alias',
      // Matches: type Foo = any
      query: `(type_alias_declaration value: (predefined_type) @type (#eq? @type "any"))`,
      languages: ['typescript'],
      reason: 'Avoid type aliases to any',
      regexPreFilter: 'any',
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // CONSOLE RESTRICTIONS
  // ═══════════════════════════════════════════════════════════════════════════

  'no console.log': [
    {
      id: 'no-console-log-call',
      // Matches: console.log(...)
      query: `
        (call_expression
          function: (member_expression
            object: (identifier) @obj (#eq? @obj "console")
            property: (property_identifier) @prop (#eq? @prop "log")))
      `,
      languages: ['typescript', 'javascript'],
      reason: 'Use proper logging instead of console.log',
      suggest: 'Use a logging library like pino or winston',
      regexPreFilter: 'console',
    },
    {
      id: 'no-console-log-bracket',
      // Matches: console["log"](...)
      query: `
        (call_expression
          function: (subscript_expression
            object: (identifier) @obj (#eq? @obj "console")
            index: (string) @idx (#match? @idx "log")))
      `,
      languages: ['typescript', 'javascript'],
      reason: 'Console accessed via bracket notation',
      regexPreFilter: 'console',
    },
  ],

  'no console': [
    {
      id: 'no-console-any-method',
      // Matches: console.log(...), console.error(...), console.warn(...), etc.
      query: `
        (call_expression
          function: (member_expression
            object: (identifier) @obj (#eq? @obj "console")))
      `,
      languages: ['typescript', 'javascript'],
      reason: 'Use proper logging instead of console methods',
      suggest: 'Use a logging library like pino or winston',
      regexPreFilter: 'console',
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // REACT PATTERNS
  // ═══════════════════════════════════════════════════════════════════════════

  'no react': [
    {
      id: 'no-react-import',
      // Matches: import React from 'react', import { useState } from 'react'
      query: `(import_statement source: (string) @source (#match? @source "^['\"]react['\"]$"))`,
      languages: ['typescript', 'javascript'],
      reason: 'React is not allowed in this project',
      suggest: 'Use vanilla JS, Vue, Svelte, or another framework',
      regexPreFilter: 'react',
    },
    {
      id: 'no-react-dom-import',
      // Matches: import ReactDOM from 'react-dom'
      query: `(import_statement source: (string) @source (#match? @source "react-dom"))`,
      languages: ['typescript', 'javascript'],
      reason: 'React DOM is not allowed',
      regexPreFilter: 'react-dom',
    },
    {
      id: 'no-react-require',
      // Matches: require('react')
      query: `
        (call_expression
          function: (identifier) @fn (#eq? @fn "require")
          arguments: (arguments (string) @source (#match? @source "^['\"]react")))
      `,
      languages: ['typescript', 'javascript'],
      reason: 'React require() is not allowed',
      regexPreFilter: 'require',
    },
    {
      id: 'no-jsx-element',
      // Matches: <Component>, <div>, etc. (opening tags)
      query: `(jsx_element) @jsx`,
      languages: ['typescript', 'javascript'],
      reason: 'JSX syntax is not allowed (React is banned)',
      suggest: 'Use vanilla DOM APIs or another framework',
      regexPreFilter: '<',
    },
    {
      id: 'no-jsx-self-closing',
      // Matches: <Component />, <input />, etc.
      query: `(jsx_self_closing_element) @jsx`,
      languages: ['typescript', 'javascript'],
      reason: 'JSX syntax is not allowed (React is banned)',
      regexPreFilter: '/>',
    },
    {
      id: 'no-jsx-fragment',
      // Matches: <>, </>
      query: `(jsx_fragment) @jsx`,
      languages: ['typescript', 'javascript'],
      reason: 'JSX fragments are not allowed (React is banned)',
      regexPreFilter: '<>',
    },
  ],

  // Aliases for 'no react'
  'react is not allowed': [
    {
      id: 'no-react-import',
      query: `(import_statement source: (string) @source (#match? @source "^['\"]react['\"]$"))`,
      languages: ['typescript', 'javascript'],
      reason: 'React is not allowed in this project',
      suggest: 'Use vanilla JS, Vue, Svelte, or another framework',
      regexPreFilter: 'react',
    },
    {
      id: 'no-jsx-element',
      query: `(jsx_element) @jsx`,
      languages: ['typescript', 'javascript'],
      reason: 'JSX syntax is not allowed (React is banned)',
      regexPreFilter: '<',
    },
    {
      id: 'no-jsx-self-closing',
      query: `(jsx_self_closing_element) @jsx`,
      languages: ['typescript', 'javascript'],
      reason: 'JSX syntax is not allowed (React is banned)',
      regexPreFilter: '/>',
    },
  ],

  'no class components': [
    {
      id: 'no-react-class-extends',
      // Matches: class Foo extends React.Component
      query: `
        (class_declaration
          (class_heritage
            (extends_clause
              value: (member_expression
                object: (identifier) @react (#eq? @react "React")
                property: (property_identifier) @comp (#match? @comp "^(Pure)?Component$")))))
      `,
      languages: ['typescript', 'javascript'],
      reason: 'Use functional components with hooks instead of class components',
      suggest: 'Convert to: const Component = () => { ... }',
      regexPreFilter: 'extends',
    },
    {
      id: 'no-class-extends-component',
      // Matches: class Foo extends Component (imported)
      query: `
        (class_declaration
          (class_heritage
            (extends_clause
              value: (identifier) @comp (#match? @comp "^(Pure)?Component$"))))
      `,
      languages: ['typescript', 'javascript'],
      reason: 'Use functional components with hooks',
      regexPreFilter: 'extends',
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // SECURITY PATTERNS
  // ═══════════════════════════════════════════════════════════════════════════

  'no eval': [
    {
      id: 'no-eval-call',
      // Matches: eval(...)
      query: `(call_expression function: (identifier) @fn (#eq? @fn "eval"))`,
      languages: ['typescript', 'javascript'],
      reason: 'eval() is a security risk and performance problem',
      suggest: 'Use JSON.parse() for data, or refactor to avoid dynamic code',
      regexPreFilter: 'eval',
    },
    {
      id: 'no-function-constructor',
      // Matches: new Function(...)
      query: `(new_expression constructor: (identifier) @fn (#eq? @fn "Function"))`,
      languages: ['typescript', 'javascript'],
      reason: 'new Function() is equivalent to eval()',
      suggest: 'Use regular functions or arrow functions',
      regexPreFilter: 'Function',
    },
  ],

  'no innerhtml': [
    {
      id: 'no-innerhtml-assignment',
      // Matches: el.innerHTML = ...
      query: `
        (assignment_expression
          left: (member_expression
            property: (property_identifier) @prop (#eq? @prop "innerHTML")))
      `,
      languages: ['typescript', 'javascript'],
      reason: 'innerHTML is an XSS risk',
      suggest: 'Use textContent, or sanitize with DOMPurify',
      regexPreFilter: 'innerHTML',
    },
    {
      id: 'no-dangerously-set-innerHTML',
      // Matches: dangerouslySetInnerHTML={...}
      query: `(jsx_attribute (property_identifier) @prop (#eq? @prop "dangerouslySetInnerHTML"))`,
      languages: ['typescript', 'javascript'],
      reason: 'dangerouslySetInnerHTML is an XSS risk',
      suggest: 'Use proper React rendering or sanitize content',
      regexPreFilter: 'dangerouslySetInnerHTML',
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // CODE QUALITY
  // ═══════════════════════════════════════════════════════════════════════════

  'no debugger': [
    {
      id: 'no-debugger-statement',
      query: `(debugger_statement) @stmt`,
      languages: ['typescript', 'javascript'],
      reason: 'Remove debugger statements before committing',
      regexPreFilter: 'debugger',
    },
  ],

  'no var': [
    {
      id: 'no-var-declaration',
      // Matches: var x = ...
      // Note: tree-sitter uses 'variable_declaration' exclusively for var,
      // while let/const use 'lexical_declaration'. No predicate needed.
      query: `(variable_declaration) @decl`,
      languages: ['typescript', 'javascript'],
      reason: 'Use let or const instead of var',
      suggest: 'Replace var with let (mutable) or const (immutable)',
      regexPreFilter: 'var',
    },
  ],

  'no alert': [
    {
      id: 'no-alert-call',
      query: `(call_expression function: (identifier) @fn (#eq? @fn "alert"))`,
      languages: ['typescript', 'javascript'],
      reason: 'alert() blocks the UI thread',
      suggest: 'Use a proper notification system or modal',
      regexPreFilter: 'alert',
    },
  ],

  'no settimeout': [
    {
      id: 'no-settimeout',
      query: `(call_expression function: (identifier) @fn (#eq? @fn "setTimeout"))`,
      languages: ['typescript', 'javascript'],
      reason: 'setTimeout can lead to race conditions and hard-to-test code',
      suggest: 'Use debounce/throttle utilities or proper async patterns',
      regexPreFilter: 'setTimeout',
    },
    {
      id: 'no-setinterval',
      query: `(call_expression function: (identifier) @fn (#eq? @fn "setInterval"))`,
      languages: ['typescript', 'javascript'],
      reason: 'setInterval can cause memory leaks and timing issues',
      suggest: 'Use requestAnimationFrame or proper scheduling',
      regexPreFilter: 'setInterval',
    },
  ],

  'no sync fs': [
    {
      id: 'no-sync-fs-read',
      query: `(call_expression function: (member_expression property: (property_identifier) @fn (#match? @fn "^(readFileSync|writeFileSync|existsSync|mkdirSync|readdirSync)$")))`,
      languages: ['typescript', 'javascript'],
      reason: 'Synchronous file operations block the event loop',
      suggest: 'Use async variants: fs.promises.readFile, fs.promises.writeFile',
      regexPreFilter: 'Sync',
    },
  ],

  'no document': [
    {
      id: 'no-document-getelementbyid',
      query: `(call_expression function: (member_expression object: (identifier) @obj (#eq? @obj "document") property: (property_identifier) @prop (#match? @prop "^(getElementById|querySelector|querySelectorAll|getElementsByClassName|getElementsByTagName)$")))`,
      languages: ['typescript', 'javascript'],
      reason: 'Direct DOM manipulation bypasses React/Vue virtual DOM',
      suggest: 'Use refs (useRef in React) or component state',
      regexPreFilter: 'document',
    },
    {
      id: 'no-document-create',
      query: `(call_expression function: (member_expression object: (identifier) @obj (#eq? @obj "document") property: (property_identifier) @prop (#match? @prop "^(createElement|createTextNode|write|writeln)$")))`,
      languages: ['typescript', 'javascript'],
      reason: 'Direct DOM creation bypasses framework rendering',
      suggest: 'Use JSX or template syntax',
      regexPreFilter: 'document',
    },
  ],

  'no throw string': [
    {
      id: 'no-throw-string-literal',
      query: `(throw_statement (string) @str)`,
      languages: ['typescript', 'javascript'],
      reason: 'Throwing strings loses stack trace information',
      suggest: 'throw new Error("message") or custom error class',
      regexPreFilter: 'throw',
    },
  ],

  'no ts-ignore': [
    {
      id: 'no-ts-ignore-comment',
      // Note: This checks for the comment as a node - works in TypeScript parser
      query: `(comment) @c (#match? @c "ts-ignore|ts-nocheck|ts-expect-error")`,
      languages: ['typescript'],
      reason: 'TypeScript suppression comments hide type errors',
      suggest: 'Fix the underlying type error instead',
      regexPreFilter: 'ts-',
    },
  ],

  'no eslint-disable': [
    {
      id: 'no-eslint-disable-comment',
      query: `(comment) @c (#match? @c "eslint-disable")`,
      languages: ['typescript', 'javascript'],
      reason: 'eslint-disable comments hide potential issues',
      suggest: 'Fix the underlying issue or configure .eslintrc',
      regexPreFilter: 'eslint-disable',
    },
  ],

  'no window': [
    {
      id: 'no-window-location',
      query: `(member_expression object: (identifier) @obj (#eq? @obj "window") property: (property_identifier) @prop (#match? @prop "^(location|history|localStorage|sessionStorage)$"))`,
      languages: ['typescript', 'javascript'],
      reason: 'Direct window access is not SSR-safe',
      suggest: 'Use framework navigation (next/router, react-router)',
      regexPreFilter: 'window',
    },
  ],

  'no process.env': [
    {
      id: 'no-process-env-direct',
      query: `(member_expression object: (member_expression object: (identifier) @obj (#eq? @obj "process") property: (property_identifier) @prop1 (#eq? @prop1 "env")))`,
      languages: ['typescript', 'javascript'],
      reason: 'Direct process.env access should be centralized',
      suggest: 'Use a config module that validates and types env vars',
      regexPreFilter: 'process.env',
    },
  ],

  'no require': [
    {
      id: 'no-commonjs-require',
      query: `(call_expression function: (identifier) @fn (#eq? @fn "require") arguments: (arguments (string)))`,
      languages: ['typescript', 'javascript'],
      reason: 'Use ES modules (import) instead of CommonJS require',
      suggest: 'import x from "module" or import { x } from "module"',
      regexPreFilter: 'require',
    },
  ],

  'no this': [
    {
      id: 'no-this-keyword',
      query: `(this) @this`,
      languages: ['typescript', 'javascript'],
      reason: 'Avoid this in favor of explicit parameters/closures',
      suggest: 'Use arrow functions or pass context explicitly',
      regexPreFilter: 'this',
    },
  ],

  'no class': [
    {
      id: 'no-class-declaration',
      query: `(class_declaration) @class`,
      languages: ['typescript', 'javascript'],
      reason: 'Prefer functions and composition over classes',
      suggest: 'Use functions, closures, and plain objects',
      regexPreFilter: 'class',
    },
  ],

  'no mutation': [
    {
      id: 'no-array-push',
      query: `(call_expression function: (member_expression property: (property_identifier) @fn (#match? @fn "^(push|pop|shift|unshift|splice|sort|reverse)$")))`,
      languages: ['typescript', 'javascript'],
      reason: 'Array mutation can cause unexpected side effects',
      suggest: 'Use immutable methods: concat, slice, filter, map, toSorted',
      regexPreFilter: 'push',
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // PYTHON PATTERNS
  // ═══════════════════════════════════════════════════════════════════════════

  'no python eval': [
    {
      id: 'no-python-eval',
      query: `(call function: (identifier) @fn (#eq? @fn "eval"))`,
      languages: ['python'],
      reason: 'eval() is a security risk',
      suggest: 'Use ast.literal_eval() for safe evaluation or refactor',
      regexPreFilter: 'eval',
    },
    {
      id: 'no-python-exec',
      query: `(call function: (identifier) @fn (#eq? @fn "exec"))`,
      languages: ['python'],
      reason: 'exec() is a security risk',
      suggest: 'Refactor to avoid dynamic code execution',
      regexPreFilter: 'exec',
    },
  ],

  'no python print': [
    {
      id: 'no-python-print',
      query: `(call function: (identifier) @fn (#eq? @fn "print"))`,
      languages: ['python'],
      reason: 'Use proper logging instead of print()',
      suggest: 'Use logging module: logging.info(), logging.debug()',
      regexPreFilter: 'print',
    },
  ],

  'no requests': [
    {
      id: 'no-requests-import',
      query: `(import_statement name: (dotted_name) @name (#eq? @name "requests"))`,
      languages: ['python'],
      reason: 'Use httpx or aiohttp instead of requests',
      suggest: 'Use httpx for sync/async HTTP or aiohttp for async',
      regexPreFilter: 'requests',
    },
    {
      id: 'no-requests-from-import',
      query: `(import_from_statement module_name: (dotted_name) @name (#eq? @name "requests"))`,
      languages: ['python'],
      reason: 'Use httpx or aiohttp instead of requests',
      regexPreFilter: 'requests',
    },
  ],

  'no pandas': [
    {
      id: 'no-pandas-import',
      query: `(import_statement name: (dotted_name) @name (#match? @name "pandas"))`,
      languages: ['python'],
      reason: 'Use polars for better performance',
      suggest: 'Use polars instead of pandas',
      regexPreFilter: 'pandas',
    },
  ],

  'no python global': [
    {
      id: 'no-python-global',
      query: `(global_statement) @global`,
      languages: ['python'],
      reason: 'Global statements make code hard to test and reason about',
      suggest: 'Pass state explicitly or use a class',
      regexPreFilter: 'global',
    },
  ],

  'no python assert': [
    {
      id: 'no-python-assert',
      query: `(assert_statement) @assert`,
      languages: ['python'],
      reason: 'assert is stripped in production (-O flag)',
      suggest: 'Use explicit if/raise for validation',
      regexPreFilter: 'assert',
    },
  ],

  'no python bare except': [
    {
      id: 'no-python-bare-except',
      // Matches: except: (without exception type)
      query: `(except_clause) @exc`,
      languages: ['python'],
      reason: 'Bare except catches all exceptions including SystemExit',
      suggest: 'Use except Exception: or specific exception types',
      regexPreFilter: 'except',
    },
  ],

  'no python pickle': [
    {
      id: 'no-python-pickle-import',
      query: `(import_statement name: (dotted_name) @name (#eq? @name "pickle"))`,
      languages: ['python'],
      reason: 'pickle can execute arbitrary code during deserialization',
      suggest: 'Use JSON, MessagePack, or Protocol Buffers',
      regexPreFilter: 'pickle',
    },
    {
      id: 'no-python-pickle-from',
      query: `(import_from_statement module_name: (dotted_name) @name (#eq? @name "pickle"))`,
      languages: ['python'],
      reason: 'pickle can execute arbitrary code during deserialization',
      suggest: 'Use JSON, MessagePack, or Protocol Buffers',
      regexPreFilter: 'pickle',
    },
  ],

  'no python subprocess shell': [
    {
      id: 'no-python-subprocess-shell',
      // This catches subprocess calls with shell=True
      query: `(call function: (attribute object: (identifier) @mod (#eq? @mod "subprocess")) arguments: (argument_list (keyword_argument name: (identifier) @key (#eq? @key "shell") value: (true))))`,
      languages: ['python'],
      reason: 'subprocess with shell=True is vulnerable to injection',
      suggest: 'Use subprocess.run(["cmd", "arg"], shell=False)',
      regexPreFilter: 'shell',
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // GO PATTERNS
  // ═══════════════════════════════════════════════════════════════════════════

  'no go fmt print': [
    {
      id: 'no-go-println',
      query: `(call_expression function: (selector_expression operand: (identifier) @pkg (#eq? @pkg "fmt") field: (field_identifier) @fn (#match? @fn "^Print")))`,
      languages: ['go'],
      reason: 'Use structured logging instead of fmt.Print*',
      suggest: 'Use log/slog or zerolog for structured logging',
      regexPreFilter: 'fmt',
    },
  ],

  'no go panic': [
    {
      id: 'no-go-panic',
      query: `(call_expression function: (identifier) @fn (#eq? @fn "panic"))`,
      languages: ['go'],
      reason: 'Avoid panic in production code',
      suggest: 'Return errors instead of panicking',
      regexPreFilter: 'panic',
    },
  ],

  'no go log.fatal': [
    {
      id: 'no-go-log-fatal',
      query: `(call_expression function: (selector_expression operand: (identifier) @pkg (#eq? @pkg "log") field: (field_identifier) @fn (#match? @fn "^(Fatal|Fatalf|Fatalln)$")))`,
      languages: ['go'],
      reason: 'log.Fatal calls os.Exit, skipping deferred functions',
      suggest: 'Return error and let main() decide exit behavior',
      regexPreFilter: 'Fatal',
    },
  ],

  'no go os.exit': [
    {
      id: 'no-go-os-exit',
      query: `(call_expression function: (selector_expression operand: (identifier) @pkg (#eq? @pkg "os") field: (field_identifier) @fn (#eq? @fn "Exit")))`,
      languages: ['go'],
      reason: 'os.Exit skips deferred functions and cleanup',
      suggest: 'Return from main() instead, or use runtime.Goexit()',
      regexPreFilter: 'Exit',
    },
  ],

  'no go init': [
    {
      id: 'no-go-init-function',
      query: `(function_declaration name: (identifier) @fn (#eq? @fn "init"))`,
      languages: ['go'],
      reason: 'init() functions run implicitly and complicate testing',
      suggest: 'Use explicit initialization functions',
      regexPreFilter: 'func init',
    },
  ],

  'no go interface{}': [
    {
      id: 'no-go-empty-interface',
      query: `(interface_type) @iface`,
      languages: ['go'],
      reason: 'Empty interface (any) loses type safety',
      suggest: 'Use generics or specific interface types',
      regexPreFilter: 'interface{}',
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // RUST PATTERNS
  // ═══════════════════════════════════════════════════════════════════════════

  'no rust unwrap': [
    {
      id: 'no-rust-unwrap',
      query: `(call_expression function: (field_expression field: (field_identifier) @fn (#eq? @fn "unwrap")))`,
      languages: ['rust'],
      reason: 'unwrap() can panic at runtime',
      suggest: 'Use ? operator, expect(), or match for error handling',
      regexPreFilter: 'unwrap',
    },
  ],

  'no rust println': [
    {
      id: 'no-rust-println',
      query: `(macro_invocation macro: (identifier) @name (#match? @name "^(println|print|dbg|eprintln|eprint)$"))`,
      languages: ['rust'],
      reason: 'Use proper logging instead of println!',
      suggest: 'Use tracing or log crate for production logging',
      regexPreFilter: 'print',
    },
  ],

  'no rust unsafe': [
    {
      id: 'no-rust-unsafe',
      query: `(unsafe_block) @unsafe`,
      languages: ['rust'],
      reason: 'Avoid unsafe blocks unless absolutely necessary',
      suggest: 'Use safe Rust abstractions',
      regexPreFilter: 'unsafe',
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // JAVA PATTERNS
  // ═══════════════════════════════════════════════════════════════════════════

  'no java sout': [
    {
      id: 'no-java-sout',
      query: `(method_invocation object: (field_access object: (identifier) @sys (#eq? @sys "System") field: (identifier) @out (#eq? @out "out")) name: (identifier) @fn (#match? @fn "^print"))`,
      languages: ['java'],
      reason: 'Use proper logging instead of System.out',
      suggest: 'Use SLF4J, Log4j, or java.util.logging',
      regexPreFilter: 'System.out',
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // C/C++ PATTERNS
  // ═══════════════════════════════════════════════════════════════════════════

  'no c printf': [
    {
      id: 'no-c-printf',
      query: `(call_expression function: (identifier) @fn (#match? @fn "^(printf|fprintf|sprintf|snprintf)$"))`,
      languages: ['c', 'cpp'],
      reason: 'printf can be vulnerable to format string attacks',
      suggest: 'Use safer alternatives like puts, fputs, or C++ streams',
      regexPreFilter: 'printf',
    },
  ],

  'no cpp cout': [
    {
      id: 'no-cpp-cout',
      query: `(expression_statement (binary_expression left: (identifier) @cout (#eq? @cout "cout")))`,
      languages: ['cpp'],
      reason: 'Use proper logging instead of std::cout',
      suggest: 'Use spdlog or another logging library',
      regexPreFilter: 'cout',
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // CROSS-LANGUAGE SECURITY PATTERNS
  // ═══════════════════════════════════════════════════════════════════════════

  'no hardcoded secrets': [
    // JavaScript/TypeScript - common secret variable patterns
    {
      id: 'no-js-hardcoded-key',
      // Matches: api_key, apiKey, API_KEY, secret, password, token, credential (case variations via alternation)
      query: `(variable_declarator name: (identifier) @name (#match? @name "(api_?[kK]ey|API_?KEY|[sS]ecret|SECRET|[pP]assword|PASSWORD|[tT]oken|TOKEN|[cC]redential|CREDENTIAL)") value: (string) @value)`,
      languages: ['typescript', 'javascript'],
      reason: 'Hardcoded secrets detected',
      suggest: 'Use environment variables or a secrets manager',
      regexPreFilter: '=',
    },
    // Python - common secret variable patterns
    {
      id: 'no-python-hardcoded-key',
      query: `(assignment left: (identifier) @name (#match? @name "(api_?[kK]ey|API_?KEY|[sS]ecret|SECRET|[pP]assword|PASSWORD|[tT]oken|TOKEN|[cC]redential|CREDENTIAL)") right: (string) @value)`,
      languages: ['python'],
      reason: 'Hardcoded secrets detected',
      suggest: 'Use environment variables or a secrets manager',
      regexPreFilter: '=',
    },
    // Go - common secret variable patterns
    {
      id: 'no-go-hardcoded-key',
      query: `(var_declaration (var_spec name: (identifier) @name (#match? @name "(api[kK]ey|API_?KEY|[sS]ecret|SECRET|[pP]assword|PASSWORD|[tT]oken|TOKEN|[cC]redential|CREDENTIAL)") value: (expression_list (interpreted_string_literal))))`,
      languages: ['go'],
      reason: 'Hardcoded secrets detected',
      suggest: 'Use environment variables or a secrets manager',
      regexPreFilter: '=',
    },
  ],

  'no sql injection': [
    // JavaScript/TypeScript - string concatenation in SQL
    {
      id: 'no-js-sql-concat',
      query: `(call_expression function: (member_expression property: (property_identifier) @fn (#match? @fn "^(query|execute|exec|run)$")) arguments: (arguments (template_string)))`,
      languages: ['typescript', 'javascript'],
      reason: 'Potential SQL injection via template literals',
      suggest: 'Use parameterized queries with placeholders',
      regexPreFilter: 'query',
    },
    // Python
    {
      id: 'no-python-sql-format',
      query: `(call function: (attribute attribute: (identifier) @fn (#match? @fn "^(execute|executemany)$")) arguments: (argument_list (binary_expression operator: "%")))`,
      languages: ['python'],
      reason: 'Potential SQL injection via string formatting',
      suggest: 'Use parameterized queries with placeholders',
      regexPreFilter: 'execute',
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // RUBY PATTERNS
  // ═══════════════════════════════════════════════════════════════════════════

  'no ruby puts': [
    {
      id: 'no-ruby-puts',
      query: `(call method: (identifier) @fn (#match? @fn "^(puts|p|pp|print)$"))`,
      languages: ['ruby'],
      reason: 'Use Rails.logger or structured logging instead of puts/print',
      suggest: 'Rails.logger.info(), Rails.logger.debug()',
      regexPreFilter: 'puts',
    },
  ],

  'no ruby eval': [
    {
      id: 'no-ruby-eval',
      query: `(call method: (identifier) @fn (#eq? @fn "eval"))`,
      languages: ['ruby'],
      reason: 'eval() is a security risk - arbitrary code execution',
      suggest: 'Refactor to avoid dynamic code execution',
      regexPreFilter: 'eval',
    },
    {
      id: 'no-ruby-instance-eval',
      query: `(call method: (identifier) @fn (#match? @fn "^(instance_eval|class_eval|module_eval)$"))`,
      languages: ['ruby'],
      reason: 'instance_eval/class_eval can execute arbitrary code',
      suggest: 'Use define_method or explicit method definitions',
      regexPreFilter: 'eval',
    },
  ],

  'no ruby system': [
    {
      id: 'no-ruby-system-exec',
      query: `(call method: (identifier) @fn (#match? @fn "^(system|exec|spawn)$"))`,
      languages: ['ruby'],
      reason: 'Shell command execution can lead to injection vulnerabilities',
      suggest: 'Use Open3.capture3 with explicit arguments array',
      regexPreFilter: 'system',
    },
    {
      id: 'no-ruby-backticks',
      query: `(subshell) @cmd`,
      languages: ['ruby'],
      reason: 'Backtick shell execution is vulnerable to injection',
      suggest: 'Use Open3.capture3 with explicit arguments',
      regexPreFilter: '`',
    },
  ],

  'no ruby binding.pry': [
    {
      id: 'no-ruby-pry',
      query: `(call receiver: (identifier) @recv (#eq? @recv "binding") method: (identifier) @method (#eq? @method "pry"))`,
      languages: ['ruby'],
      reason: 'Remove debug statements before committing',
      suggest: 'Remove binding.pry',
      regexPreFilter: 'pry',
    },
    {
      id: 'no-ruby-byebug',
      query: `(call method: (identifier) @fn (#eq? @fn "byebug"))`,
      languages: ['ruby'],
      reason: 'Remove debug statements before committing',
      suggest: 'Remove byebug',
      regexPreFilter: 'byebug',
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // PHP PATTERNS
  // ═══════════════════════════════════════════════════════════════════════════

  'no php echo': [
    {
      id: 'no-php-echo',
      query: `(echo_statement) @echo`,
      languages: ['php'],
      reason: 'Use template engine or proper response methods instead of echo',
      suggest: 'Use Blade, Twig, or return response objects',
      regexPreFilter: 'echo',
    },
    {
      id: 'no-php-print',
      query: `(print_intrinsic) @print`,
      languages: ['php'],
      reason: 'Use template engine instead of print',
      suggest: 'Use Blade, Twig, or return response objects',
      regexPreFilter: 'print',
    },
  ],

  'no php eval': [
    {
      id: 'no-php-eval',
      query: `(function_call_expression function: (name) @fn (#eq? @fn "eval"))`,
      languages: ['php'],
      reason: 'eval() is a critical security vulnerability',
      suggest: 'Refactor to avoid dynamic code execution',
      regexPreFilter: 'eval',
    },
    {
      id: 'no-php-create-function',
      query: `(function_call_expression function: (name) @fn (#eq? @fn "create_function"))`,
      languages: ['php'],
      reason: 'create_function is deprecated and vulnerable',
      suggest: 'Use anonymous functions (closures) instead',
      regexPreFilter: 'create_function',
    },
  ],

  'no php shell': [
    {
      id: 'no-php-exec',
      query: `(function_call_expression function: (name) @fn (#match? @fn "^(exec|shell_exec|system|passthru|popen|proc_open)$"))`,
      languages: ['php'],
      reason: 'Shell command execution can lead to command injection',
      suggest: 'Use escapeshellarg() and escapeshellcmd() if absolutely necessary',
      regexPreFilter: 'exec',
    },
    {
      id: 'no-php-backtick',
      query: `(shell_command_expression) @cmd`,
      languages: ['php'],
      reason: 'Backtick shell execution is vulnerable to injection',
      suggest: 'Avoid shell commands; use PHP libraries instead',
      regexPreFilter: '`',
    },
  ],

  'no php mysql': [
    {
      id: 'no-php-mysql-connect',
      query: `(function_call_expression function: (name) @fn (#match? @fn "^mysql_(connect|query|fetch|select_db|close)"))`,
      languages: ['php'],
      reason: 'mysql_* functions are deprecated and removed in PHP 7+',
      suggest: 'Use PDO or mysqli with prepared statements',
      regexPreFilter: 'mysql_',
    },
  ],

  'no php die': [
    {
      id: 'no-php-die',
      query: `(exit_statement) @exit`,
      languages: ['php'],
      reason: 'die/exit abruptly terminates execution without cleanup',
      suggest: 'Throw exceptions for error handling',
      regexPreFilter: 'die',
    },
  ],

  'no php var_dump': [
    {
      id: 'no-php-var-dump',
      query: `(function_call_expression function: (name) @fn (#match? @fn "^(var_dump|print_r|var_export)$"))`,
      languages: ['php'],
      reason: 'Remove debug output before committing',
      suggest: 'Use proper logging (Monolog) or remove debug code',
      regexPreFilter: 'var_dump',
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // BASH PATTERNS
  // ═══════════════════════════════════════════════════════════════════════════

  'no bash eval': [
    {
      id: 'no-bash-eval',
      query: `(command name: (command_name) @cmd (#eq? @cmd "eval"))`,
      languages: ['bash'],
      reason: 'eval is a security risk - arbitrary command execution',
      suggest: 'Refactor to avoid eval; use arrays for complex commands',
      regexPreFilter: 'eval',
    },
  ],

  'no bash rm rf root': [
    {
      id: 'no-bash-rm-rf-root',
      // This is hard to catch precisely in AST, using simple command check
      query: `(command name: (command_name) @cmd (#eq? @cmd "rm") argument: (word) @arg (#match? @arg "^(-rf|-r|-f)$"))`,
      languages: ['bash'],
      reason: 'rm -rf with root paths can be catastrophic',
      suggest: 'Use more specific paths and add safety checks',
      regexPreFilter: 'rm',
    },
  ],

  'no bash curl pipe': [
    {
      id: 'no-bash-curl-pipe-bash',
      // Pipeline where curl output goes to bash/sh
      query: `(pipeline (command name: (command_name) @curl (#match? @curl "^(curl|wget)$")) (command name: (command_name) @shell (#match? @shell "^(bash|sh|zsh)$")))`,
      languages: ['bash'],
      reason: 'Piping downloaded scripts to shell is a security risk',
      suggest: 'Download first, review, then execute: curl -o script.sh URL && bash script.sh',
      regexPreFilter: 'curl',
    },
  ],

  'no bash sudo': [
    {
      id: 'no-bash-sudo',
      query: `(command name: (command_name) @cmd (#eq? @cmd "sudo"))`,
      languages: ['bash'],
      reason: 'Avoid sudo in scripts; use proper permissions instead',
      suggest: 'Configure proper file permissions or use a service account',
      regexPreFilter: 'sudo',
    },
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // KOTLIN PATTERNS
  // ═══════════════════════════════════════════════════════════════════════════

  'no kotlin println': [
    {
      id: 'no-kotlin-println',
      query: `(call_expression (simple_identifier) @fn (#match? @fn "^(println|print)$"))`,
      languages: ['kotlin'],
      reason: 'Use proper logging instead of println',
      suggest: 'Use SLF4J, Logback, or Timber for logging',
      regexPreFilter: 'print',
    },
  ],

  'no kotlin bang operator': [
    {
      id: 'no-kotlin-not-null-assertion',
      query: `(postfix_expression (postfix_unary_operator) @op (#eq? @op "!!"))`,
      languages: ['kotlin'],
      reason: '!! can throw NullPointerException at runtime',
      suggest: 'Use safe calls (?.) or null checks instead',
      regexPreFilter: '!!',
    },
  ],
};

/**
 * Get all AST rules for a restriction
 * Normalizes common variations (e.g., "no any" vs "no any types")
 */
export function getASTRules(restriction: string): ASTRule[] | null {
  const normalized = restriction.toLowerCase().trim();

  // Direct match
  if (AST_BUILTINS[normalized]) {
    return AST_BUILTINS[normalized];
  }

  // Try variations
  const variations = [
    normalized,
    normalized.replace(/^don't /, 'no '),
    normalized.replace(/^do not /, 'no '),
    normalized.replace(/^avoid /, 'no '),
    normalized.replace(/^ban /, 'no '),
    normalized.replace(/^block /, 'no '),
    normalized.replace(/^disallow /, 'no '),
    normalized.replace(/^never use /, 'no '),
  ];

  for (const variant of variations) {
    if (AST_BUILTINS[variant]) {
      return AST_BUILTINS[variant];
    }
  }

  // Special handling for library/pattern restrictions across languages
  const libraryPatterns = [
    // JavaScript/TypeScript
    { match: /\breact\b/i, key: 'no react' },
    { match: /\blodash\b/i, key: 'no lodash' },
    { match: /\bmoment\b/i, key: 'no moment' },
    { match: /\bjquery\b/i, key: 'no jquery' },
    { match: /\baxios\b/i, key: 'no axios' },
    { match: /\bconsole\.log\b/i, key: 'no console.log' },
    { match: /\bany\s*type/i, key: 'no any types' },
    // Python
    { match: /\brequests\b/i, key: 'no requests' },
    { match: /\bpandas\b/i, key: 'no pandas' },
    { match: /\bprint\b.*python/i, key: 'no python print' },
    { match: /\beval\b.*python/i, key: 'no python eval' },
    // Go
    { match: /\bfmt\.print/i, key: 'no go fmt print' },
    { match: /\bpanic\b.*go/i, key: 'no go panic' },
    // Rust
    { match: /\bunwrap\b.*rust/i, key: 'no rust unwrap' },
    { match: /\bprintln\b.*rust/i, key: 'no rust println' },
    { match: /\bunsafe\b.*rust/i, key: 'no rust unsafe' },
    // Cross-language
    { match: /\bhardcoded\s*(secret|key|password|token)/i, key: 'no hardcoded secrets' },
    { match: /\bsql\s*injection/i, key: 'no sql injection' },
  ];

  // Check if this looks like a restriction (contains negative keywords)
  const isRestriction = /\b(no|don't|do not|avoid|ban|block|disallow|never|not allowed|banned|forbidden|prohibited)\b/i.test(normalized);

  if (isRestriction) {
    for (const { match, key } of libraryPatterns) {
      if (match.test(normalized) && AST_BUILTINS[key]) {
        return AST_BUILTINS[key];
      }
    }
  }

  return null;
}

/**
 * List all available AST builtin keys
 */
export function listASTBuiltins(): string[] {
  return Object.keys(AST_BUILTINS);
}
