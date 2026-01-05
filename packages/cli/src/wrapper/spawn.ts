// src/wrapper/spawn.ts

import { spawn, ChildProcess } from 'child_process';

const AGENT_ALIASES: Record<string, string> = {
  cc: 'claude',
  'claude-code': 'claude',
  oc: 'opencode',
  opencode: 'opencode',
  cursor: 'cursor',
  aider: 'aider',
  codex: 'codex',
};

export function resolveAgent(alias: string): string {
  return AGENT_ALIASES[alias.toLowerCase()] || alias;
}

export function spawnAgent(
  agent: string,
  wrapperDir: string,
  port: number,
  onExit: (code: number) => void
): ChildProcess {
  const resolvedAgent = resolveAgent(agent);

  const env = {
    ...process.env,
    PATH: `${wrapperDir}:${process.env.PATH}`,
    VETO_PORT: String(port),
    VETO_ACTIVE: '1',
  };

  const child = spawn(resolvedAgent, [], {
    env,
    stdio: 'inherit',
    shell: true,
  });

  child.on('exit', (code) => onExit(code ?? 0));
  child.on('error', (err) => {
    console.error(`Failed to start ${resolvedAgent}: ${err.message}`);
    onExit(1);
  });

  return child;
}
