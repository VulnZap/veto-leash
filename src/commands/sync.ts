import {
  findLeashConfig,
  loadLeashConfig,
  compileLeashConfig,
} from '../config/loader.js';
import {
  installAgent,
  addPolicyToAgents,
} from '../native/index.js';
import { COLORS, SYMBOLS } from '../ui/colors.js';

export async function runSync(agent?: string) {
  const configPath = findLeashConfig();
  
  if (!configPath) {
    console.error(`${COLORS.error}${SYMBOLS.error} No .leash config found${COLORS.reset}`);
    console.log(`Run: ${COLORS.dim}leash init${COLORS.reset}`);
    process.exit(1);
  }

  const config = loadLeashConfig(configPath);
  if (!config) {
    process.exit(1);
  }

  console.log(`\n${COLORS.info}Loading ${configPath}...${COLORS.reset}`);

  // Compile all policies
  const compiled = await compileLeashConfig(config);

  console.log(`${COLORS.success}${SYMBOLS.success} Compiled ${compiled.policies.length} policies${COLORS.reset}\n`);

  // Save each policy
  for (const { restriction, policy } of compiled.policies) {
    const policyName = restriction
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50);
    
    await addPolicyToAgents(policy, policyName);
  }

  // If agent specified, install for that agent
  if (agent) {
    console.log('');
    await installAgent(agent);
  } else {
    console.log(`To install for an agent:`);
    console.log(`  ${COLORS.dim}leash install cc${COLORS.reset}        Claude Code`);
    console.log(`  ${COLORS.dim}leash install windsurf${COLORS.reset}  Windsurf`);
    console.log(`  ${COLORS.dim}leash install oc${COLORS.reset}        OpenCode\n`);
  }
}
