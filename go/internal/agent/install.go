package agent

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"github.com/vulnzap/leash/internal/builtin"
	"github.com/vulnzap/leash/internal/config"
	"github.com/vulnzap/leash/internal/policy"
)

// Install installs leash hooks for an agent.
func Install(agentID string) error {
	agent := Find(agentID)
	if agent == nil {
		return fmt.Errorf("unknown agent: %s", agentID)
	}

	switch agent.ID {
	case "claude-code":
		return installClaudeCode(agent)
	case "opencode":
		return installOpenCode(agent)
	case "windsurf":
		return installWindsurf(agent)
	case "cursor":
		return installCursor(agent)
	case "aider":
		return installAider(agent)
	default:
		return fmt.Errorf("agent %s not yet supported for installation", agent.ID)
	}
}

// Uninstall removes leash hooks for an agent.
func Uninstall(agentID string) error {
	agent := Find(agentID)
	if agent == nil {
		return fmt.Errorf("unknown agent: %s", agentID)
	}

	switch agent.ID {
	case "claude-code":
		return uninstallClaudeCode(agent)
	case "opencode":
		return uninstallOpenCode(agent)
	default:
		return fmt.Errorf("uninstall not yet implemented for %s", agent.ID)
	}
}

// loadPolicies loads and compiles policies from .leash config.
func loadPolicies() ([]*policy.Policy, error) {
	if !config.Exists() {
		return nil, nil
	}

	path, err := config.Find()
	if err != nil {
		return nil, err
	}

	cfg, err := config.Load(path)
	if err != nil {
		return nil, err
	}

	var policies []*policy.Policy
	for _, policyStr := range cfg.Policies {
		// Try builtins first
		if b := builtin.Find(policyStr); b != nil {
			policies = append(policies, b.ToPolicy(policy.ActionDelete))
		} else {
			// TODO: LLM compilation for non-builtins
			// For now, create a basic policy
			policies = append(policies, &policy.Policy{
				Action:      policy.ActionDelete,
				Description: policyStr,
			})
		}
	}

	return policies, nil
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLAUDE CODE
// ═══════════════════════════════════════════════════════════════════════════════

func installClaudeCode(agent *Agent) error {
	policies, err := loadPolicies()
	if err != nil {
		return err
	}

	configDir := GetConfigDir(agent)
	if err := os.MkdirAll(configDir, 0755); err != nil {
		return err
	}

	// Generate CLAUDE.md with policy rules
	claudeMD := generateClaudeMD(policies)
	claudePath := filepath.Join(configDir, "CLAUDE.md")
	if err := os.WriteFile(claudePath, []byte(claudeMD), 0644); err != nil {
		return err
	}

	// Generate settings.json with permission rules
	settingsPath := filepath.Join(configDir, "settings.json")
	settings := generateClaudeSettings(policies)
	settingsJSON, err := json.MarshalIndent(settings, "", "  ")
	if err != nil {
		return err
	}
	if err := os.WriteFile(settingsPath, settingsJSON, 0644); err != nil {
		return err
	}

	return nil
}

func uninstallClaudeCode(agent *Agent) error {
	configDir := GetConfigDir(agent)

	// Remove leash-generated files
	os.Remove(filepath.Join(configDir, "CLAUDE.md"))

	return nil
}

func generateClaudeMD(policies []*policy.Policy) string {
	md := `# Project Policies (managed by leash)

The following restrictions are enforced by veto-leash:

`
	for _, p := range policies {
		md += fmt.Sprintf("- %s\n", p.Description)

		// Add command rules
		for _, rule := range p.CommandRules {
			md += fmt.Sprintf("  - BLOCKED commands: %v\n", rule.Block)
			if rule.Suggest != "" {
				md += fmt.Sprintf("    Use instead: %s\n", rule.Suggest)
			}
		}

		// Add file patterns
		if len(p.Include) > 0 {
			md += fmt.Sprintf("  - Protected files: %v\n", p.Include)
		}
	}

	md += `
IMPORTANT: Before executing any command or modifying any file, check if it violates these policies.
If a command is blocked, suggest the alternative instead.
`
	return md
}

func generateClaudeSettings(policies []*policy.Policy) map[string]interface{} {
	var denyPatterns []string

	for _, p := range policies {
		// Add command patterns to deny
		for _, rule := range p.CommandRules {
			denyPatterns = append(denyPatterns, rule.Block...)
		}
	}

	return map[string]interface{}{
		"permissions": map[string]interface{}{
			"bash": map[string]interface{}{
				"deny": denyPatterns,
			},
		},
	}
}

// ═══════════════════════════════════════════════════════════════════════════════
// OPENCODE
// ═══════════════════════════════════════════════════════════════════════════════

func installOpenCode(agent *Agent) error {
	policies, err := loadPolicies()
	if err != nil {
		return err
	}

	configDir := GetConfigDir(agent)
	if err := os.MkdirAll(configDir, 0755); err != nil {
		return err
	}

	// Generate opencode.json config
	configPath := filepath.Join(configDir, "opencode.json")
	ocConfig := generateOpenCodeConfig(policies)
	configJSON, err := json.MarshalIndent(ocConfig, "", "  ")
	if err != nil {
		return err
	}
	if err := os.WriteFile(configPath, configJSON, 0644); err != nil {
		return err
	}

	// Generate AGENTS.md
	agentsMD := generateAgentsMD(policies)
	agentsPath := filepath.Join(configDir, "AGENTS.md")
	if err := os.WriteFile(agentsPath, []byte(agentsMD), 0644); err != nil {
		return err
	}

	return nil
}

func uninstallOpenCode(agent *Agent) error {
	configDir := GetConfigDir(agent)
	os.Remove(filepath.Join(configDir, "opencode.json"))
	os.Remove(filepath.Join(configDir, "AGENTS.md"))
	return nil
}

func generateOpenCodeConfig(policies []*policy.Policy) map[string]interface{} {
	var denyPatterns []string

	for _, p := range policies {
		for _, rule := range p.CommandRules {
			denyPatterns = append(denyPatterns, rule.Block...)
		}
	}

	return map[string]interface{}{
		"permission": map[string]interface{}{
			"bash": map[string]interface{}{
				"deny": denyPatterns,
			},
		},
	}
}

func generateAgentsMD(policies []*policy.Policy) string {
	md := `# AGENTS.md (managed by leash)

## Enforced Policies

`
	for _, p := range policies {
		md += fmt.Sprintf("- %s\n", p.Description)
	}

	md += `
## Rules

Before executing commands or modifying files, verify they don't violate the above policies.
`
	return md
}

// ═══════════════════════════════════════════════════════════════════════════════
// WINDSURF
// ═══════════════════════════════════════════════════════════════════════════════

func installWindsurf(agent *Agent) error {
	policies, err := loadPolicies()
	if err != nil {
		return err
	}

	configDir := GetConfigDir(agent)
	cascadeDir := filepath.Join(configDir, "cascade")
	if err := os.MkdirAll(cascadeDir, 0755); err != nil {
		return err
	}

	// Generate cascade hooks
	hooksPath := filepath.Join(cascadeDir, "hooks.json")
	hooks := generateWindsurfHooks(policies)
	hooksJSON, err := json.MarshalIndent(hooks, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(hooksPath, hooksJSON, 0644)
}

func generateWindsurfHooks(policies []*policy.Policy) map[string]interface{} {
	var denyPatterns []string

	for _, p := range policies {
		for _, rule := range p.CommandRules {
			denyPatterns = append(denyPatterns, rule.Block...)
		}
	}

	return map[string]interface{}{
		"pre_run_command": map[string]interface{}{
			"deny_patterns": denyPatterns,
		},
	}
}

// ═══════════════════════════════════════════════════════════════════════════════
// CURSOR
// ═══════════════════════════════════════════════════════════════════════════════

func installCursor(agent *Agent) error {
	policies, err := loadPolicies()
	if err != nil {
		return err
	}

	configDir := GetConfigDir(agent)
	if err := os.MkdirAll(configDir, 0755); err != nil {
		return err
	}

	// Generate hooks.json
	hooksPath := filepath.Join(configDir, "hooks.json")
	hooks := generateCursorHooks(policies)
	hooksJSON, err := json.MarshalIndent(hooks, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(hooksPath, hooksJSON, 0644)
}

func generateCursorHooks(policies []*policy.Policy) map[string]interface{} {
	var denyPatterns []string

	for _, p := range policies {
		for _, rule := range p.CommandRules {
			denyPatterns = append(denyPatterns, rule.Block...)
		}
	}

	return map[string]interface{}{
		"beforeShellExecution": map[string]interface{}{
			"deny": denyPatterns,
		},
	}
}

// ═══════════════════════════════════════════════════════════════════════════════
// AIDER
// ═══════════════════════════════════════════════════════════════════════════════

func installAider(agent *Agent) error {
	policies, err := loadPolicies()
	if err != nil {
		return err
	}

	home, _ := os.UserHomeDir()
	configPath := filepath.Join(home, ".aider.conf.yml")

	// Generate read-only patterns
	var readOnlyPatterns []string
	for _, p := range policies {
		readOnlyPatterns = append(readOnlyPatterns, p.Include...)
	}

	// Simple YAML generation
	content := "# Managed by leash\nread-only:\n"
	for _, pattern := range readOnlyPatterns {
		content += fmt.Sprintf("  - %s\n", pattern)
	}

	return os.WriteFile(configPath, []byte(content), 0644)
}
