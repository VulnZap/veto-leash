// Package agent handles detection and configuration of AI coding assistants.
package agent

import (
	"os"
	"path/filepath"
	"runtime"
)

// Agent represents a supported AI coding assistant.
type Agent struct {
	ID          string
	Name        string
	Aliases     []string
	Description string
	HasNative   bool // Whether native hook integration is supported
	ConfigPath  string
	Installed   bool
}

// All supported agents
var All = []Agent{
	{
		ID:          "claude-code",
		Name:        "Claude Code",
		Aliases:     []string{"cc", "claude", "claude-code"},
		Description: "Anthropic's Claude Code assistant",
		HasNative:   true,
	},
	{
		ID:          "opencode",
		Name:        "OpenCode",
		Aliases:     []string{"oc", "opencode"},
		Description: "OpenCode AI assistant",
		HasNative:   true,
	},
	{
		ID:          "windsurf",
		Name:        "Windsurf",
		Aliases:     []string{"ws", "windsurf"},
		Description: "Codeium Windsurf IDE",
		HasNative:   true,
	},
	{
		ID:          "cursor",
		Name:        "Cursor",
		Aliases:     []string{"cursor"},
		Description: "Cursor AI-powered editor",
		HasNative:   true,
	},
	{
		ID:          "aider",
		Name:        "Aider",
		Aliases:     []string{"aider"},
		Description: "Aider CLI coding assistant",
		HasNative:   true,
	},
}

// Find looks up an agent by ID or alias.
func Find(idOrAlias string) *Agent {
	for i := range All {
		if All[i].ID == idOrAlias {
			return &All[i]
		}
		for _, alias := range All[i].Aliases {
			if alias == idOrAlias {
				return &All[i]
			}
		}
	}
	return nil
}

// DetectInstalled finds agents that are installed on the system.
func DetectInstalled() []Agent {
	var installed []Agent
	for _, agent := range All {
		if isInstalled(agent) {
			agent.Installed = true
			installed = append(installed, agent)
		}
	}
	return installed
}

// isInstalled checks if an agent is installed by looking for its config.
func isInstalled(agent Agent) bool {
	home, err := os.UserHomeDir()
	if err != nil {
		return false
	}

	var paths []string

	switch agent.ID {
	case "claude-code":
		// Check for Claude Code config
		if runtime.GOOS == "darwin" {
			paths = append(paths,
				filepath.Join(home, "Library", "Application Support", "Claude"),
				filepath.Join(home, ".claude"),
			)
		} else {
			paths = append(paths,
				filepath.Join(home, ".config", "claude"),
				filepath.Join(home, ".claude"),
			)
		}

	case "opencode":
		paths = append(paths,
			filepath.Join(home, ".config", "opencode"),
		)

	case "windsurf":
		if runtime.GOOS == "darwin" {
			paths = append(paths,
				filepath.Join(home, "Library", "Application Support", "Windsurf"),
				filepath.Join(home, ".windsurf"),
			)
		} else {
			paths = append(paths,
				filepath.Join(home, ".config", "Windsurf"),
				filepath.Join(home, ".windsurf"),
			)
		}

	case "cursor":
		if runtime.GOOS == "darwin" {
			paths = append(paths,
				filepath.Join(home, "Library", "Application Support", "Cursor"),
				filepath.Join(home, ".cursor"),
			)
		} else {
			paths = append(paths,
				filepath.Join(home, ".config", "Cursor"),
				filepath.Join(home, ".cursor"),
			)
		}

	case "aider":
		// Check for aider config or if aider command exists
		paths = append(paths,
			filepath.Join(home, ".aider.conf.yml"),
		)
		// Also check if aider is in PATH - simplified check
		if _, err := os.Stat("/usr/local/bin/aider"); err == nil {
			return true
		}
		if _, err := os.Stat(filepath.Join(home, ".local", "bin", "aider")); err == nil {
			return true
		}
	}

	for _, path := range paths {
		if _, err := os.Stat(path); err == nil {
			return true
		}
	}

	return false
}

// GetConfigDir returns the configuration directory for an agent.
func GetConfigDir(agent *Agent) string {
	home, _ := os.UserHomeDir()

	switch agent.ID {
	case "claude-code":
		if runtime.GOOS == "darwin" {
			return filepath.Join(home, "Library", "Application Support", "Claude")
		}
		return filepath.Join(home, ".config", "claude")

	case "opencode":
		return filepath.Join(home, ".config", "opencode")

	case "windsurf":
		if runtime.GOOS == "darwin" {
			return filepath.Join(home, "Library", "Application Support", "Windsurf")
		}
		return filepath.Join(home, ".config", "Windsurf")

	case "cursor":
		if runtime.GOOS == "darwin" {
			return filepath.Join(home, "Library", "Application Support", "Cursor")
		}
		return filepath.Join(home, ".config", "Cursor")

	case "aider":
		return home // .aider.conf.yml in home

	default:
		return home
	}
}
