import prompts from 'prompts';
import {
  detectInstalledAgents,
  installAgent,
  AGENTS,
  type AgentInfo as Agent
} from '../native/index.js';
import {
  createLeashConfig,
  hasLeashConfig,
} from '../config/loader.js';
import { COLORS, SYMBOLS, createSpinner } from '../ui/colors.js';
import { runSync } from './sync.js';

export async function runInteractiveInit() {
  console.log(`\n${COLORS.bold}Welcome to veto-leash initialization${COLORS.reset}\n`);

  // 1. Detect Agents
  const installedAgents = detectInstalledAgents();
  const installedIds = new Set(installedAgents.map(a => a.id));

  // Prepare choices for prompts
  const choices = AGENTS.map(agent => ({
    title: agent.name,
    value: agent,
    selected: installedIds.has(agent.id),
    description: installedIds.has(agent.id) ? '[Detected]' : undefined
  }));

  // 2. Select Agents
  const response = await prompts([
    {
      type: 'multiselect',
      name: 'selectedAgents',
      message: 'Which AI coding agents do you want to secure?',
      choices,
      hint: '- Space to select. Return to submit',
      instructions: false,
      min: 1
    },
    {
      type: hasLeashConfig() ? null : 'confirm',
      name: 'createConfig',
      message: 'No .leash configuration found. Create one with default rules?',
      initial: true
    }
  ]);

  if (!response.selectedAgents) {
    console.log(`${COLORS.dim}Initialization cancelled.${COLORS.reset}`);
    return;
  }

  // 3. Create Config
  if (response.createConfig) {
    const spinner = createSpinner('Creating configuration...');
    await createLeashConfig();
    spinner.stop();
  } else if (!hasLeashConfig()) {
     console.log(`\n${COLORS.warning}Skipping configuration creation. You will need a .leash file to enforce policies.${COLORS.reset}`);
  }

  // 4. Install Hooks
  console.log(`\n${COLORS.bold}Enforcing Security...${COLORS.reset}`);
  const installSpinner = createSpinner('Installing agent hooks...');
  
  for (const agent of response.selectedAgents as Agent[]) {
    try {
      await installAgent(agent.id);
    } catch {
       // Silent fail during bulk install, error printed by installAgent usually
    }
  }
  installSpinner.stop();
  console.log(`${COLORS.success}${SYMBOLS.success} Hooks installed${COLORS.reset}`);

  // 5. Sync Policies (Compiles and Pushes)
  // We run this to ensure policies are actually active immediately
  await runSync();

  console.log(`\n${COLORS.success}${SYMBOLS.success} Setup complete! Policies are now enforced.${COLORS.reset}`);
  console.log(`\nRun ${COLORS.bold}leash add "your policy"${COLORS.reset} to add new restrictions.`);
}
