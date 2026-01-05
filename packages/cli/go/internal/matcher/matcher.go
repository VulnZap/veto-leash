// Package matcher provides glob and regex pattern matching for policies.
package matcher

import (
	"path/filepath"
	"regexp"
	"strings"

	"github.com/gobwas/glob"
	"github.com/vulnzap/leash/internal/policy"
)

// Matcher validates actions against a policy.
type Matcher struct {
	policy         *policy.Policy
	includeGlobs   []glob.Glob
	excludeGlobs   []glob.Glob
	commandGlobs   map[int][]glob.Glob    // index in CommandRules -> compiled globs
	contentRegexes map[int]*regexp.Regexp // index in ContentRules -> compiled regex
}

// New creates a matcher for the given policy.
func New(p *policy.Policy) (*Matcher, error) {
	m := &Matcher{
		policy:         p,
		commandGlobs:   make(map[int][]glob.Glob),
		contentRegexes: make(map[int]*regexp.Regexp),
	}

	// Compile include patterns
	for _, pattern := range p.Include {
		g, err := glob.Compile(pattern, '/')
		if err != nil {
			return nil, err
		}
		m.includeGlobs = append(m.includeGlobs, g)
	}

	// Compile exclude patterns
	for _, pattern := range p.Exclude {
		g, err := glob.Compile(pattern, '/')
		if err != nil {
			return nil, err
		}
		m.excludeGlobs = append(m.excludeGlobs, g)
	}

	// Compile command rule patterns
	for i, rule := range p.CommandRules {
		var globs []glob.Glob
		for _, pattern := range rule.Block {
			g, err := glob.Compile(pattern)
			if err != nil {
				return nil, err
			}
			globs = append(globs, g)
		}
		m.commandGlobs[i] = globs
	}

	// Compile content rule patterns
	for i, rule := range p.ContentRules {
		re, err := regexp.Compile(rule.Pattern)
		if err != nil {
			return nil, err
		}
		m.contentRegexes[i] = re
	}

	return m, nil
}

// CheckFile validates if a file operation is allowed.
func (m *Matcher) CheckFile(path string) *policy.CheckResult {
	// Check if file matches include patterns
	included := false
	for _, g := range m.includeGlobs {
		if g.Match(path) {
			included = true
			break
		}
	}

	if !included {
		return &policy.CheckResult{Allowed: true}
	}

	// Check if file is excluded
	for _, g := range m.excludeGlobs {
		if g.Match(path) {
			return &policy.CheckResult{Allowed: true}
		}
	}

	// File matches policy - block it
	return &policy.CheckResult{
		Allowed: false,
		Reason:  m.policy.Description,
	}
}

// CheckCommand validates if a command is allowed.
func (m *Matcher) CheckCommand(cmd string) *policy.CheckResult {
	cmd = strings.TrimSpace(cmd)

	for i, globs := range m.commandGlobs {
		for _, g := range globs {
			if g.Match(cmd) {
				rule := m.policy.CommandRules[i]
				return &policy.CheckResult{
					Allowed: false,
					Reason:  rule.Reason,
					Suggest: rule.Suggest,
				}
			}
		}
	}

	return &policy.CheckResult{Allowed: true}
}

// CheckContent validates if file content is allowed.
func (m *Matcher) CheckContent(path, content string) *policy.CheckResult {
	for i, rule := range m.policy.ContentRules {
		// Check if file type matches
		matched := false
		for _, ft := range rule.FileTypes {
			if matchFileType(path, ft) {
				matched = true
				break
			}
		}
		if !matched {
			continue
		}

		// Check content against pattern
		re := m.contentRegexes[i]
		if re.MatchString(content) {
			return &policy.CheckResult{
				Allowed: false,
				Reason:  rule.Reason,
				Suggest: rule.Suggest,
			}
		}
	}

	return &policy.CheckResult{Allowed: true}
}

// Check performs all relevant checks for a request.
func (m *Matcher) Check(req *policy.CheckRequest) *policy.CheckResult {
	// Check command if present
	if req.Command != "" {
		if result := m.CheckCommand(req.Command); !result.Allowed {
			return result
		}
	}

	// Check file if present
	if req.Target != "" {
		if result := m.CheckFile(req.Target); !result.Allowed {
			return result
		}
	}

	// Check content if present
	if req.Content != "" && req.Target != "" {
		if result := m.CheckContent(req.Target, req.Content); !result.Allowed {
			return result
		}
	}

	return &policy.CheckResult{Allowed: true}
}

// matchFileType checks if a file path matches a file type pattern.
func matchFileType(path, pattern string) bool {
	// Simple extension matching
	if strings.HasPrefix(pattern, "*.") {
		ext := filepath.Ext(path)
		return ext == pattern[1:] || ext == "."+pattern[2:]
	}

	// Use glob for more complex patterns
	g, err := glob.Compile(pattern, '/')
	if err != nil {
		return false
	}
	return g.Match(path) || g.Match(filepath.Base(path))
}
