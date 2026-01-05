// Package policy defines core domain types for veto-leash policies.
package policy

// Action represents what type of operation a policy applies to.
type Action string

const (
	ActionDelete  Action = "delete"
	ActionModify  Action = "modify"
	ActionExecute Action = "execute"
	ActionRead    Action = "read"
)

// CommandRule blocks specific shell commands.
type CommandRule struct {
	// Glob patterns for commands to block (e.g., "npm install*")
	Block []string `json:"block" yaml:"block"`
	// Suggestion to show user
	Suggest string `json:"suggest,omitempty" yaml:"suggest,omitempty"`
	// Human-readable reason
	Reason string `json:"reason" yaml:"reason"`
}

// ContentRule matches patterns within file contents.
type ContentRule struct {
	// Regex pattern to match
	Pattern string `json:"pattern" yaml:"pattern"`
	// File patterns where this applies (e.g., "*.ts")
	FileTypes []string `json:"fileTypes" yaml:"fileTypes"`
	// Human-readable reason
	Reason string `json:"reason" yaml:"reason"`
	// Suggestion for alternative
	Suggest string `json:"suggest,omitempty" yaml:"suggest,omitempty"`
	// Validation mode: fast, strict, semantic
	Mode string `json:"mode,omitempty" yaml:"mode,omitempty"`
	// Negative patterns that indicate false positives
	Exceptions []string `json:"exceptions,omitempty" yaml:"exceptions,omitempty"`
}

// ASTRule uses tree-sitter queries for precise pattern matching.
type ASTRule struct {
	// Unique identifier
	ID string `json:"id" yaml:"id"`
	// Tree-sitter S-expression query
	Query string `json:"query" yaml:"query"`
	// Languages this applies to
	Languages []string `json:"languages" yaml:"languages"`
	// Human-readable reason
	Reason string `json:"reason" yaml:"reason"`
	// Suggestion for alternative
	Suggest string `json:"suggest,omitempty" yaml:"suggest,omitempty"`
	// Regex for fast pre-filtering
	RegexPreFilter string `json:"regexPreFilter,omitempty" yaml:"regexPreFilter,omitempty"`
}

// Policy is a compiled restriction ready for enforcement.
type Policy struct {
	// What action this policy applies to
	Action Action `json:"action" yaml:"action"`
	// File patterns to protect (glob)
	Include []string `json:"include" yaml:"include"`
	// File patterns to allow (exceptions)
	Exclude []string `json:"exclude" yaml:"exclude"`
	// Human-readable description
	Description string `json:"description" yaml:"description"`
	// Command-level rules
	CommandRules []CommandRule `json:"commandRules,omitempty" yaml:"commandRules,omitempty"`
	// Content-level rules (regex-based)
	ContentRules []ContentRule `json:"contentRules,omitempty" yaml:"contentRules,omitempty"`
	// AST-based rules (tree-sitter)
	ASTRules []ASTRule `json:"astRules,omitempty" yaml:"astRules,omitempty"`
}

// CheckRequest represents an action to validate.
type CheckRequest struct {
	Action  string `json:"action"`
	Target  string `json:"target"`
	Command string `json:"command,omitempty"`
	Content string `json:"content,omitempty"`
}

// CheckResult is the outcome of policy validation.
type CheckResult struct {
	Allowed bool   `json:"allowed"`
	Reason  string `json:"reason,omitempty"`
	Suggest string `json:"suggest,omitempty"`
}
