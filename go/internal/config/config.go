// Package config handles .leash configuration files.
package config

import (
	"os"
	"path/filepath"

	"gopkg.in/yaml.v3"
)

// LeashConfig represents a .leash configuration file.
type LeashConfig struct {
	// Policies is a list of policy restrictions
	Policies []string `yaml:"policies"`
	// Agents to apply policies to (optional, defaults to all detected)
	Agents []string `yaml:"agents,omitempty"`
}

// DefaultPolicies are the universal defaults for new .leash files.
var DefaultPolicies = []string{
	"protect .env",
	"don't delete test files",
}

// Find locates a .leash file in the current directory or parents.
func Find() (string, error) {
	cwd, err := os.Getwd()
	if err != nil {
		return "", err
	}

	dir := cwd
	for {
		leashPath := filepath.Join(dir, ".leash")
		if _, err := os.Stat(leashPath); err == nil {
			return leashPath, nil
		}

		parent := filepath.Dir(dir)
		if parent == dir {
			// Reached root
			break
		}
		dir = parent
	}

	return "", os.ErrNotExist
}

// Exists checks if a .leash file exists in the current directory.
func Exists() bool {
	cwd, _ := os.Getwd()
	_, err := os.Stat(filepath.Join(cwd, ".leash"))
	return err == nil
}

// Load reads and parses a .leash file.
func Load(path string) (*LeashConfig, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	var config LeashConfig
	if err := yaml.Unmarshal(data, &config); err != nil {
		return nil, err
	}

	return &config, nil
}

// Create creates a new .leash file with default policies.
func Create() error {
	config := LeashConfig{
		Policies: DefaultPolicies,
	}

	data, err := yaml.Marshal(&config)
	if err != nil {
		return err
	}

	cwd, err := os.Getwd()
	if err != nil {
		return err
	}

	return os.WriteFile(filepath.Join(cwd, ".leash"), data, 0644)
}

// Save writes a config to the .leash file.
func Save(config *LeashConfig) error {
	data, err := yaml.Marshal(config)
	if err != nil {
		return err
	}

	cwd, err := os.Getwd()
	if err != nil {
		return err
	}

	return os.WriteFile(filepath.Join(cwd, ".leash"), data, 0644)
}

// AddPolicy adds a policy to the config and saves it.
func AddPolicy(policy string) error {
	var config *LeashConfig

	if Exists() {
		path, _ := Find()
		var err error
		config, err = Load(path)
		if err != nil {
			return err
		}
	} else {
		config = &LeashConfig{Policies: []string{}}
	}

	// Check if policy already exists
	for _, p := range config.Policies {
		if p == policy {
			return nil // Already exists
		}
	}

	config.Policies = append(config.Policies, policy)
	return Save(config)
}

// RemovePolicy removes a policy from the config.
func RemovePolicy(policy string) error {
	if !Exists() {
		return os.ErrNotExist
	}

	path, _ := Find()
	config, err := Load(path)
	if err != nil {
		return err
	}

	var newPolicies []string
	for _, p := range config.Policies {
		if p != policy {
			newPolicies = append(newPolicies, p)
		}
	}

	config.Policies = newPolicies
	return Save(config)
}
