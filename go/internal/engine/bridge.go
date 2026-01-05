// Package engine bridges to the TypeScript engine for complex operations.
package engine

import (
	"bytes"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

// CompileResult is the result of compiling a policy.
type CompileResult struct {
	Success     bool   `json:"success"`
	Policy      string `json:"policy,omitempty"`
	Description string `json:"description,omitempty"`
	Error       string `json:"error,omitempty"`
	IsBuiltin   bool   `json:"isBuiltin,omitempty"`
}

// SyncResult is the result of syncing policies to an agent.
type SyncResult struct {
	Success bool   `json:"success"`
	Agent   string `json:"agent,omitempty"`
	Count   int    `json:"count,omitempty"`
	Error   string `json:"error,omitempty"`
}

// InstallResult is the result of installing hooks for an agent.
type InstallResult struct {
	Success bool   `json:"success"`
	Agent   string `json:"agent,omitempty"`
	Error   string `json:"error,omitempty"`
}

// Bridge handles communication with the TypeScript engine.
type Bridge struct {
	distDir string
	nodeCmd string
}

// NewBridge creates a new TypeScript bridge.
func NewBridge() (*Bridge, error) {
	// Find the dist directory relative to the executable
	exePath, err := os.Executable()
	if err != nil {
		return nil, err
	}

	// Try multiple locations for dist
	candidates := []string{
		filepath.Join(filepath.Dir(exePath), "dist"),
		filepath.Join(filepath.Dir(exePath), "..", "dist"),
		filepath.Join(filepath.Dir(exePath), "..", "lib", "node_modules", "veto-leash", "dist"),
		"dist", // Current directory
	}

	var distDir string
	for _, candidate := range candidates {
		cliPath := filepath.Join(candidate, "cli.js")
		if _, err := os.Stat(cliPath); err == nil {
			distDir = candidate
			break
		}
	}

	if distDir == "" {
		return nil, fmt.Errorf("TypeScript engine not found. Run from project root or ensure dist/ exists")
	}

	// Find node
	nodeCmd := "node"
	if _, err := exec.LookPath("node"); err != nil {
		return nil, fmt.Errorf("Node.js required for policy compilation. Install from https://nodejs.org")
	}

	return &Bridge{
		distDir: distDir,
		nodeCmd: nodeCmd,
	}, nil
}

// Compile compiles a policy restriction using the TypeScript engine.
func (b *Bridge) Compile(restriction string) (*CompileResult, error) {
	// Create a small Node script that compiles and outputs JSON
	script := fmt.Sprintf(`
		const { compile } = require('%s/compiler/index.js');
		(async () => {
			try {
				const policy = await compile(%s);
				console.log(JSON.stringify({
					success: true,
					policy: %s,
					description: policy.description,
					isBuiltin: policy._builtin || false
				}));
			} catch (err) {
				console.log(JSON.stringify({
					success: false,
					error: err.message
				}));
			}
		})();
	`, b.distDir, jsonString(restriction), jsonString(restriction))

	cmd := exec.Command(b.nodeCmd, "-e", script)
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		// Check if it's a missing API key error
		if strings.Contains(stderr.String(), "GEMINI_API_KEY") {
			return &CompileResult{
				Success: false,
				Error:   "GEMINI_API_KEY not set. Get a free key at https://aistudio.google.com/apikey",
			}, nil
		}
		return nil, fmt.Errorf("compilation failed: %s", stderr.String())
	}

	var result CompileResult
	if err := json.Unmarshal(stdout.Bytes(), &result); err != nil {
		return nil, fmt.Errorf("failed to parse result: %v", err)
	}

	return &result, nil
}

// Add adds a policy using the TypeScript CLI.
func (b *Bridge) Add(restriction string) error {
	cmd := exec.Command(b.nodeCmd, filepath.Join(b.distDir, "cli.js"), "add", restriction)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

// Sync syncs policies to agents using the TypeScript CLI.
func (b *Bridge) Sync(agent string) error {
	args := []string{filepath.Join(b.distDir, "cli.js"), "sync"}
	if agent != "" {
		args = append(args, agent)
	}
	cmd := exec.Command(b.nodeCmd, args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

// Install installs hooks for an agent using the TypeScript CLI.
func (b *Bridge) Install(agent string) error {
	cmd := exec.Command(b.nodeCmd, filepath.Join(b.distDir, "cli.js"), "install", agent)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

// Uninstall removes hooks for an agent using the TypeScript CLI.
func (b *Bridge) Uninstall(agent string) error {
	cmd := exec.Command(b.nodeCmd, filepath.Join(b.distDir, "cli.js"), "uninstall", agent)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

// Init runs the TypeScript init wizard.
func (b *Bridge) Init() error {
	cmd := exec.Command(b.nodeCmd, filepath.Join(b.distDir, "cli.js"), "init")
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

// Explain explains a policy.
func (b *Bridge) Explain(restriction string) error {
	cmd := exec.Command(b.nodeCmd, filepath.Join(b.distDir, "cli.js"), "explain", restriction)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

// CheckAvailable returns true if the TypeScript engine is available.
func CheckAvailable() bool {
	_, err := NewBridge()
	return err == nil
}

// DistDir returns the path to the TypeScript dist directory.
func (b *Bridge) DistDir() string {
	return b.distDir
}

// Audit runs the audit command.
func (b *Bridge) Audit(args []string) error {
	cmdArgs := append([]string{filepath.Join(b.distDir, "cli.js"), "audit"}, args...)
	cmd := exec.Command(b.nodeCmd, cmdArgs...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

// jsonString escapes a string for use in JavaScript.
func jsonString(s string) string {
	b, _ := json.Marshal(s)
	return string(b)
}
