/**
 * Prompt building for custom LLM providers.
 *
 * @module custom/prompt
 */

import type { Rule } from '../rules/types.js';
import type { CustomProvider, CustomToolCall } from './types.js';
import { buildPrompt } from '../kernel/prompt.js';

/**
 * System prompt for custom validation (provider-agnostic).
 */
const SYSTEM_PROMPT = `You are a security guardrail for AI agent tool calls. 

TASK: Evaluate whether the tool call violates any rules in the provided ruleset.

IMPORTANT: You MUST respond with ONLY a JSON object, no other text, no explanation, no markdown.

JSON FORMAT:
{"pass_weight": <float 0-1>, "block_weight": <float 0-1>, "decision": "<pass|block>", "reasoning": "<brief explanation>"}

RULES:
- If no rules are violated, set decision to "pass" with pass_weight >= 0.7
- If any rule is violated, set decision to "block" with block_weight >= 0.7`;

/**
 * Provider-specific message structures.
 */
export interface ProviderMessages {
  /** System prompt (for Anthropic) */
  system?: string;
  /** Messages array (for OpenAI/OpenRouter) */
  messages?: Array<{ role: string; content: string }>;
  /** Contents array (for Gemini) */
  contents?: Array<{ role: string; parts: Array<{ text: string }> }>;
}

/**
 * Build user prompt from tool call and rules.
 */
export function buildUserPrompt(toolCall: CustomToolCall, rules: Rule[]): string {
  return buildPrompt(toolCall, rules);
}

/**
 * Build provider-specific message structure.
 */
export function buildProviderMessages(
  provider: CustomProvider,
  userPrompt: string
): ProviderMessages {
  switch (provider) {
    case 'openai':
    case 'openrouter':
      return {
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
      };

    case 'anthropic':
      return {
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      };

    case 'gemini':
      return {
        contents: [
          {
            role: 'user',
            parts: [{ text: `${SYSTEM_PROMPT}\n\n${userPrompt}` }],
          },
        ],
      };

    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
