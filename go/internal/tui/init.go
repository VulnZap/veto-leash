// Package tui provides the interactive terminal interface.
package tui

import (
	"github.com/charmbracelet/huh"
	"github.com/vulnzap/leash/internal/agent"
	"github.com/vulnzap/leash/internal/config"
)

// InitResult holds the results of the init wizard.
type InitResult struct {
	Agents       []string
	CreateConfig bool
	Cancelled    bool
}

// RunInitWizard runs the interactive setup wizard.
func RunInitWizard() (*InitResult, error) {
	result := &InitResult{}

	// Detect installed agents
	installed := agent.DetectInstalled()
	installedIDs := make(map[string]bool)
	for _, a := range installed {
		installedIDs[a.ID] = true
	}

	// Build agent options
	var options []huh.Option[string]
	for _, a := range agent.All {
		title := a.Name
		if installedIDs[a.ID] {
			title += " [detected]"
		}
		options = append(options, huh.NewOption(title, a.ID).Selected(installedIDs[a.ID]))
	}

	var selectedAgents []string
	var createConfig bool

	// Check if .leash exists
	configExists := config.Exists()

	form := huh.NewForm(
		huh.NewGroup(
			huh.NewNote().
				Title("leash setup").
				Description("Configure policy enforcement for your AI coding assistants."),
		),

		huh.NewGroup(
			huh.NewMultiSelect[string]().
				Title("Select agents to secure").
				Description("Space to select, Enter to confirm").
				Options(options...).
				Value(&selectedAgents),
		),
	)

	// Add config creation question if no .leash exists
	if !configExists {
		form = huh.NewForm(
			huh.NewGroup(
				huh.NewNote().
					Title("leash setup").
					Description("Configure policy enforcement for your AI coding assistants."),
			),

			huh.NewGroup(
				huh.NewMultiSelect[string]().
					Title("Select agents to secure").
					Description("Space to select, Enter to confirm").
					Options(options...).
					Value(&selectedAgents),
			),

			huh.NewGroup(
				huh.NewConfirm().
					Title("Create .leash config?").
					Description("No .leash file found. Create one with default policies?").
					Affirmative("Yes").
					Negative("No").
					Value(&createConfig),
			),
		)
	}

	err := form.Run()
	if err != nil {
		if err == huh.ErrUserAborted {
			result.Cancelled = true
			return result, nil
		}
		return nil, err
	}

	result.Agents = selectedAgents
	result.CreateConfig = createConfig || configExists

	return result, nil
}

// RunAddPolicy runs the add policy prompt.
func RunAddPolicy() (string, error) {
	var policy string

	form := huh.NewForm(
		huh.NewGroup(
			huh.NewInput().
				Title("Add policy").
				Description("Describe what you want to restrict").
				Placeholder("protect .env").
				Value(&policy),
		),
	)

	err := form.Run()
	if err != nil {
		if err == huh.ErrUserAborted {
			return "", nil
		}
		return "", err
	}

	return policy, nil
}
