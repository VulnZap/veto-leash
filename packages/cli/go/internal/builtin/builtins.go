// Package builtin provides predefined policies for common restrictions.
package builtin

import "github.com/VulnZap/veto/internal/policy"

// Builtin is a predefined policy template.
type Builtin struct {
	Include      []string
	Exclude      []string
	Description  string
	CommandRules []policy.CommandRule
	ContentRules []policy.ContentRule
}

// Registry maps builtin names to their definitions.
var Registry = map[string]Builtin{
	// ═══════════════════════════════════════════════════════════════════════
	// FILE PROTECTION BUILTINS
	// ═══════════════════════════════════════════════════════════════════════

	"test files": {
		Include: []string{
			"*.test.*", "*.spec.*", "**/*.test.*", "**/*.spec.*",
			"__tests__/**", "test/**/*.ts", "test/**/*.js",
			"test/**/*.tsx", "test/**/*.jsx",
		},
		Exclude:     []string{"test-results.*", "test-output.*", "**/coverage/**", "*.log", "*.xml"},
		Description: "Test source files (not artifacts)",
	},

	"config": {
		Include: []string{
			"*.config.*", "**/*.config.*", "tsconfig*",
			".eslintrc*", ".prettierrc*", "vite.config.*",
			"webpack.config.*", "jest.config.*", "vitest.config.*",
			"next.config.*",
		},
		Exclude:     []string{},
		Description: "Configuration files",
	},

	".env": {
		Include:     []string{".env", ".env.*", "**/.env", "**/.env.*"},
		Exclude:     []string{".env.example", ".env.template", ".env.sample"},
		Description: "Environment files (secrets)",
	},
	"env": {
		Include:     []string{".env", ".env.*", "**/.env", "**/.env.*"},
		Exclude:     []string{".env.example", ".env.template", ".env.sample"},
		Description: "Environment files (secrets)",
	},

	"migrations": {
		Include: []string{
			"**/migrations/**", "*migrate*", "prisma/migrations/**",
			"db/migrate/**", "**/db/**/*.sql", "drizzle/**",
		},
		Exclude:     []string{},
		Description: "Database migrations",
	},

	"lock files": {
		Include: []string{
			"package-lock.json", "yarn.lock", "pnpm-lock.yaml",
			"Gemfile.lock", "Cargo.lock", "poetry.lock", "*.lock",
		},
		Exclude:     []string{},
		Description: "Dependency lock files",
	},

	"node_modules": {
		Include:     []string{"node_modules/**", "**/node_modules/**"},
		Exclude:     []string{},
		Description: "Node modules directory",
	},

	".md files": {
		Include:     []string{"*.md", "**/*.md"},
		Exclude:     []string{},
		Description: "Markdown files",
	},

	// ═══════════════════════════════════════════════════════════════════════
	// COMMAND-AWARE BUILTINS
	// ═══════════════════════════════════════════════════════════════════════

	"prefer pnpm": {
		Include:     []string{},
		Exclude:     []string{},
		Description: "Use pnpm instead of npm/yarn",
		CommandRules: []policy.CommandRule{
			{
				Block:   []string{"npm install*", "npm i *", "npm i", "npm ci", "npm add*"},
				Suggest: "pnpm install",
				Reason:  "Project uses pnpm",
			},
			{
				Block:   []string{"yarn", "yarn install", "yarn add*"},
				Suggest: "pnpm add",
				Reason:  "Project uses pnpm",
			},
		},
	},
	"use pnpm": {
		Include:     []string{},
		Exclude:     []string{},
		Description: "Use pnpm instead of npm/yarn",
		CommandRules: []policy.CommandRule{
			{
				Block:   []string{"npm install*", "npm i *", "npm i", "npm ci", "npm add*"},
				Suggest: "pnpm install",
				Reason:  "Project uses pnpm",
			},
			{
				Block:   []string{"yarn", "yarn install", "yarn add*"},
				Suggest: "pnpm add",
				Reason:  "Project uses pnpm",
			},
		},
	},

	"prefer bun": {
		Include:     []string{},
		Exclude:     []string{},
		Description: "Use bun instead of npm/pnpm/yarn",
		CommandRules: []policy.CommandRule{
			{
				Block:   []string{"npm install*", "npm i *", "npm i", "npm ci", "npm add*", "npm run*"},
				Suggest: "bun",
				Reason:  "Project uses bun",
			},
			{
				Block:   []string{"pnpm install*", "pnpm i *", "pnpm add*", "pnpm run*"},
				Suggest: "bun",
				Reason:  "Project uses bun",
			},
			{
				Block:   []string{"yarn", "yarn install", "yarn add*", "yarn run*"},
				Suggest: "bun",
				Reason:  "Project uses bun",
			},
		},
	},
	"use bun": {
		Include:     []string{},
		Exclude:     []string{},
		Description: "Use bun instead of npm/pnpm/yarn",
		CommandRules: []policy.CommandRule{
			{
				Block:   []string{"npm install*", "npm i *", "npm i", "npm ci", "npm add*", "npm run*"},
				Suggest: "bun",
				Reason:  "Project uses bun",
			},
			{
				Block:   []string{"pnpm install*", "pnpm i *", "pnpm add*", "pnpm run*"},
				Suggest: "bun",
				Reason:  "Project uses bun",
			},
			{
				Block:   []string{"yarn", "yarn install", "yarn add*", "yarn run*"},
				Suggest: "bun",
				Reason:  "Project uses bun",
			},
		},
	},

	"prefer yarn": {
		Include:     []string{},
		Exclude:     []string{},
		Description: "Use yarn instead of npm",
		CommandRules: []policy.CommandRule{
			{
				Block:   []string{"npm install*", "npm i *", "npm i", "npm ci", "npm add*"},
				Suggest: "yarn add",
				Reason:  "Project uses yarn",
			},
		},
	},

	"no sudo": {
		Include:     []string{},
		Exclude:     []string{},
		Description: "Prevent sudo commands",
		CommandRules: []policy.CommandRule{
			{
				Block:  []string{"sudo *"},
				Reason: "sudo not allowed in this project",
			},
		},
	},

	"no force push": {
		Include:     []string{},
		Exclude:     []string{},
		Description: "Prevent git force push",
		CommandRules: []policy.CommandRule{
			{
				Block:  []string{"git push --force*", "git push -f*", "git push * --force*", "git push * -f*"},
				Reason: "Force push not allowed - could overwrite team changes",
			},
		},
	},

	"no hard reset": {
		Include:     []string{},
		Exclude:     []string{},
		Description: "Prevent git hard reset",
		CommandRules: []policy.CommandRule{
			{
				Block:   []string{"git reset --hard*"},
				Suggest: "git reset --soft or git stash",
				Reason:  "Hard reset can lose uncommitted work",
			},
		},
	},

	"use vitest": {
		Include:     []string{},
		Exclude:     []string{},
		Description: "Use vitest instead of jest",
		CommandRules: []policy.CommandRule{
			{
				Block:   []string{"jest*", "npx jest*", "npm run jest*", "pnpm jest*"},
				Suggest: "vitest",
				Reason:  "Project uses vitest",
			},
		},
	},
	"vitest not jest": {
		Include:     []string{},
		Exclude:     []string{},
		Description: "Use vitest instead of jest",
		CommandRules: []policy.CommandRule{
			{
				Block:   []string{"jest*", "npx jest*", "npm run jest*", "pnpm jest*"},
				Suggest: "vitest or pnpm test",
				Reason:  "Project uses vitest",
			},
		},
	},

	"use pytest": {
		Include:     []string{},
		Exclude:     []string{},
		Description: "Use pytest instead of unittest",
		CommandRules: []policy.CommandRule{
			{
				Block:   []string{"python -m unittest*", "python3 -m unittest*"},
				Suggest: "pytest",
				Reason:  "Project uses pytest",
			},
		},
	},

	"no curl pipe bash": {
		Include:     []string{},
		Exclude:     []string{},
		Description: "Prevent piping curl output to bash",
		CommandRules: []policy.CommandRule{
			{
				Block:  []string{"curl * | bash*", "curl * | sh*", "wget * | bash*", "wget * | sh*"},
				Reason: "Piping remote scripts to shell is dangerous",
			},
		},
	},

	"use docker compose": {
		Include:     []string{},
		Exclude:     []string{},
		Description: "Use docker compose v2 instead of docker-compose",
		CommandRules: []policy.CommandRule{
			{
				Block:   []string{"docker-compose *"},
				Suggest: "docker compose",
				Reason:  "Use docker compose v2 syntax",
			},
		},
	},

	// ═══════════════════════════════════════════════════════════════════════
	// CONTENT-AWARE BUILTINS
	// ═══════════════════════════════════════════════════════════════════════

	"no lodash": {
		Include:     []string{"**/*.ts", "**/*.js", "**/*.tsx", "**/*.jsx", "**/*.mts", "**/*.mjs"},
		Exclude:     []string{},
		Description: "Prefer native methods over lodash",
		CommandRules: []policy.CommandRule{
			{
				Block: []string{
					"npm install lodash*", "npm i lodash*",
					"pnpm add lodash*", "pnpm i lodash*",
					"bun add lodash*", "bun i lodash*",
					"yarn add lodash*",
				},
				Reason: "Use native array/object methods instead of lodash",
			},
		},
		ContentRules: []policy.ContentRule{
			{
				Pattern:   `(?:import\s+.*\s+from\s+['"]lodash|require\s*\(\s*['"]lodash|from\s+['"]lodash)`,
				FileTypes: []string{"*.ts", "*.js", "*.tsx", "*.jsx", "*.mts", "*.mjs"},
				Reason:    "Use native array/object methods instead of lodash",
				Suggest:   "Use Array.map(), Array.filter(), Object.keys(), etc.",
				Mode:      "strict",
			},
		},
	},

	"no moment": {
		Include:     []string{"**/*.ts", "**/*.js", "**/*.tsx", "**/*.jsx"},
		Exclude:     []string{},
		Description: "Use date-fns or native Date instead of moment.js",
		CommandRules: []policy.CommandRule{
			{
				Block:   []string{"npm install moment*", "npm i moment", "pnpm add moment*", "bun add moment*", "yarn add moment*"},
				Suggest: "date-fns or native Date",
				Reason:  "moment.js is deprecated and heavy",
			},
		},
		ContentRules: []policy.ContentRule{
			{
				Pattern:   `(?:import\s+.*\s+from\s+['"]moment|require\s*\(\s*['"]moment)`,
				FileTypes: []string{"*.ts", "*.js", "*.tsx", "*.jsx"},
				Reason:    "moment.js is deprecated; use date-fns or native Date",
				Suggest:   `import { format } from "date-fns"`,
				Mode:      "strict",
			},
		},
	},

	"no jquery": {
		Include:     []string{"**/*.ts", "**/*.js", "**/*.tsx", "**/*.jsx"},
		Exclude:     []string{},
		Description: "Use modern DOM APIs instead of jQuery",
		CommandRules: []policy.CommandRule{
			{
				Block:  []string{"npm install jquery*", "pnpm add jquery*", "bun add jquery*", "yarn add jquery*"},
				Reason: "Use native DOM APIs instead of jQuery",
			},
		},
		ContentRules: []policy.ContentRule{
			{
				Pattern:   `(?:import\s+.*\s+from\s+['"]jquery|require\s*\(\s*['"]jquery|\$\s*\()`,
				FileTypes: []string{"*.ts", "*.js", "*.tsx", "*.jsx"},
				Reason:    "Use native DOM APIs instead of jQuery",
				Suggest:   "document.querySelector(), fetch(), etc.",
				Mode:      "strict",
			},
		},
	},

	"no console.log": {
		Include:     []string{"src/**/*.ts", "src/**/*.js", "src/**/*.tsx", "src/**/*.jsx"},
		Exclude:     []string{"**/*.test.*", "**/*.spec.*", "**/test/**", "**/tests/**", "**/__tests__/**"},
		Description: "No console.log in production code",
		ContentRules: []policy.ContentRule{
			{
				Pattern:   `console\.log\s*\(`,
				FileTypes: []string{"*.ts", "*.js", "*.tsx", "*.jsx"},
				Reason:    "Use proper logging instead of console.log",
				Suggest:   "Use a logging library like pino or winston",
				Mode:      "strict",
			},
		},
	},

	"no console": {
		Include:     []string{"src/**/*.ts", "src/**/*.js", "src/**/*.tsx", "src/**/*.jsx"},
		Exclude:     []string{"**/*.test.*", "**/*.spec.*", "**/test/**", "**/tests/**"},
		Description: "No console statements in production code",
		ContentRules: []policy.ContentRule{
			{
				Pattern:   `console\.\w+\s*\(`,
				FileTypes: []string{"*.ts", "*.js", "*.tsx", "*.jsx"},
				Reason:    "Use proper logging instead of console statements",
				Suggest:   "Use a logging library",
				Mode:      "strict",
			},
		},
	},

	"no debugger": {
		Include:     []string{"**/*.ts", "**/*.js", "**/*.tsx", "**/*.jsx"},
		Exclude:     []string{},
		Description: "No debugger statements",
		ContentRules: []policy.ContentRule{
			{
				Pattern:   `\bdebugger\b`,
				FileTypes: []string{"*.ts", "*.js", "*.tsx", "*.jsx"},
				Reason:    "Remove debugger statements before committing",
				Mode:      "strict",
			},
		},
	},

	"no class components": {
		Include:     []string{"**/*.tsx", "**/*.jsx"},
		Exclude:     []string{},
		Description: "Use functional React components with hooks",
		ContentRules: []policy.ContentRule{
			{
				Pattern:   `class\s+\w+\s+extends\s+(?:React\.)?(?:Component|PureComponent)`,
				FileTypes: []string{"*.tsx", "*.jsx"},
				Reason:    "Use functional components with hooks instead of class components",
				Suggest:   "Convert to: const Component = () => { ... }",
				Mode:      "strict",
			},
		},
	},
	"functional components only": {
		Include:     []string{"**/*.tsx", "**/*.jsx"},
		Exclude:     []string{},
		Description: "Use functional React components",
		ContentRules: []policy.ContentRule{
			{
				Pattern:   `class\s+\w+\s+extends\s+(?:React\.)?(?:Component|PureComponent)`,
				FileTypes: []string{"*.tsx", "*.jsx"},
				Reason:    "Use functional components with hooks",
				Suggest:   "const Component: FC = () => { ... }",
				Mode:      "strict",
			},
		},
	},

	"no any": {
		Include:     []string{"**/*.ts", "**/*.tsx"},
		Exclude:     []string{"**/*.d.ts", "**/types/**", "**/@types/**"},
		Description: "Avoid any type in TypeScript",
		ContentRules: []policy.ContentRule{
			{
				Pattern:   `:\s*any\b`,
				FileTypes: []string{"*.ts", "*.tsx"},
				Reason:    "Use proper TypeScript types instead of any",
				Suggest:   "Use unknown, specific types, or generics",
				Mode:      "strict",
			},
			{
				Pattern:   `as\s+any\b`,
				FileTypes: []string{"*.ts", "*.tsx"},
				Reason:    "Avoid casting to any",
				Suggest:   "Use proper type narrowing or as unknown",
				Mode:      "strict",
			},
			{
				Pattern:   `<any>`,
				FileTypes: []string{"*.ts", "*.tsx"},
				Reason:    "Avoid any in generic parameters",
				Suggest:   "Use specific type or unknown",
				Mode:      "strict",
			},
		},
	},
	"no any types": {
		Include:     []string{"**/*.ts", "**/*.tsx"},
		Exclude:     []string{"**/*.d.ts"},
		Description: "Comprehensive any type detection",
		ContentRules: []policy.ContentRule{
			{
				Pattern:   `:\s*any\b|as\s+any\b|<any>|Array<any>|Record<\w+,\s*any>`,
				FileTypes: []string{"*.ts", "*.tsx"},
				Reason:    "Use proper TypeScript types instead of any",
				Suggest:   "Use unknown or specific types",
				Mode:      "strict",
			},
		},
	},
	"strict types": {
		Include:     []string{"**/*.ts", "**/*.tsx"},
		Exclude:     []string{"**/*.d.ts"},
		Description: "Enforce strict TypeScript typing",
		ContentRules: []policy.ContentRule{
			{
				Pattern:   `:\s*any\b|as\s+any\b|<any>|\|\s*any\b|&\s*any\b`,
				FileTypes: []string{"*.ts", "*.tsx"},
				Reason:    "Strict typing: avoid any",
				Mode:      "strict",
			},
		},
	},

	"no eval": {
		Include:     []string{"**/*.ts", "**/*.js", "**/*.tsx", "**/*.jsx"},
		Exclude:     []string{},
		Description: "Prevent use of eval() and similar unsafe constructs",
		ContentRules: []policy.ContentRule{
			{
				Pattern:   `\beval\s*\(`,
				FileTypes: []string{"*.ts", "*.js", "*.tsx", "*.jsx"},
				Reason:    "eval() is a security risk",
				Suggest:   "Use JSON.parse() or safer alternatives",
				Mode:      "strict",
			},
			{
				Pattern:   `new\s+Function\s*\(`,
				FileTypes: []string{"*.ts", "*.js", "*.tsx", "*.jsx"},
				Reason:    "new Function() is equivalent to eval()",
				Suggest:   "Use a safer approach",
				Mode:      "strict",
			},
		},
	},

	"no innerHTML": {
		Include:     []string{"**/*.ts", "**/*.js", "**/*.tsx", "**/*.jsx"},
		Exclude:     []string{},
		Description: "Prevent direct innerHTML assignment (XSS risk)",
		ContentRules: []policy.ContentRule{
			{
				Pattern:   `\.innerHTML\s*=`,
				FileTypes: []string{"*.ts", "*.js", "*.tsx", "*.jsx"},
				Reason:    "innerHTML is an XSS risk",
				Suggest:   "Use textContent or DOM methods",
				Mode:      "strict",
			},
			{
				Pattern:   `dangerouslySetInnerHTML`,
				FileTypes: []string{"*.tsx", "*.jsx"},
				Reason:    "dangerouslySetInnerHTML should be avoided",
				Suggest:   "Use proper React rendering",
				Mode:      "strict",
			},
		},
	},

	"no todos": {
		Include:     []string{"**/*.ts", "**/*.js", "**/*.tsx", "**/*.jsx"},
		Exclude:     []string{},
		Description: "No TODO comments in committed code",
		ContentRules: []policy.ContentRule{
			{
				Pattern:   `//\s*TODO\b|/\*\s*TODO\b`,
				FileTypes: []string{"*.ts", "*.js", "*.tsx", "*.jsx"},
				Reason:    "Resolve TODO comments before committing",
			},
			{
				Pattern:   `//\s*FIXME\b|/\*\s*FIXME\b`,
				FileTypes: []string{"*.ts", "*.js", "*.tsx", "*.jsx"},
				Reason:    "Resolve FIXME comments before committing",
			},
		},
	},
}

// Aliases maps common phrases to builtin names.
var Aliases = map[string]string{
	// Package managers
	"pnpm over npm":             "prefer pnpm",
	"pnpm instead of npm":       "prefer pnpm",
	"use pnpm not npm":          "prefer pnpm",
	"bun over npm":              "prefer bun",
	"bun instead of npm":        "prefer bun",
	"use bun not npm":           "prefer bun",
	"bun over pnpm":             "prefer bun",
	"yarn over npm":             "prefer yarn",
	"vitest over jest":          "vitest not jest",
	"vitest instead of jest":    "vitest not jest",
	"pytest over unittest":      "use pytest",
	"no force pushing":          "no force push",
	"prevent force push":        "no force push",
	"block force push":          "no force push",
	"no git force push":         "no force push",
	"docker compose v2":         "use docker compose",
	"avoid lodash":              "no lodash",
	"ban lodash":                "no lodash",
	"native methods":            "no lodash",
	"avoid moment":              "no moment",
	"ban moment":                "no moment",
	"no moment.js":              "no moment",
	"avoid jquery":              "no jquery",
	"ban jquery":                "no jquery",
	"no console statements":     "no console",
	"no logging":                "no console",
	"remove console.log":        "no console.log",
	"clean console":             "no console.log",
	"use functional components": "no class components",
	"hooks only":                "no class components",
	"no react classes":          "no class components",
	"modern react":              "no class components",
	"avoid any":                 "no any",
	"ban any type":              "no any",
	"strict typescript":         "strict types",
	"no any keyword":            "no any",
	"no eval usage":             "no eval",
	"ban eval":                  "no eval",
	"no xss":                    "no innerHTML",
	"safe dom":                  "no innerHTML",
	"no todo comments":          "no todos",
	"clean todos":               "no todos",
	"resolve todos":             "no todos",
}

// Find looks up a builtin by name, handling aliases and variations.
func Find(phrase string) *Builtin {
	// Normalize
	normalized := normalize(phrase)

	// Check aliases first
	if aliased, ok := Aliases[normalized]; ok {
		if b, ok := Registry[aliased]; ok {
			return &b
		}
	}

	// Direct match
	if b, ok := Registry[normalized]; ok {
		return &b
	}

	// Check with common prefix/suffix variations
	variations := []string{
		normalized,
		stripPrefix(normalized, "use "),
		stripPrefix(normalized, "prefer "),
		stripPrefix(normalized, "no "),
		"use " + normalized,
		"prefer " + normalized,
		"no " + normalized,
	}

	for _, v := range variations {
		if b, ok := Registry[v]; ok {
			return &b
		}
	}

	// Partial match
	for key, b := range Registry {
		if contains(normalized, key) || contains(key, normalized) {
			return &b
		}
	}

	return nil
}

// ToPolicy converts a Builtin to a Policy.
func (b *Builtin) ToPolicy(action policy.Action) *policy.Policy {
	return &policy.Policy{
		Action:       action,
		Include:      b.Include,
		Exclude:      b.Exclude,
		Description:  b.Description,
		CommandRules: b.CommandRules,
		ContentRules: b.ContentRules,
	}
}

// normalize cleans up input for matching.
func normalize(s string) string {
	// Convert to lowercase, remove don't/do not variations
	result := s
	// Simple normalization - a real implementation would be more thorough
	return result
}

func stripPrefix(s, prefix string) string {
	if len(s) >= len(prefix) && s[:len(prefix)] == prefix {
		return s[len(prefix):]
	}
	return s
}

func contains(haystack, needle string) bool {
	return len(haystack) >= len(needle) &&
		(haystack == needle ||
			len(needle) > 0 && findSubstring(haystack, needle) >= 0)
}

func findSubstring(s, substr string) int {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return i
		}
	}
	return -1
}
