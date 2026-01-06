/**
 * OpenRouter provider adapter for custom validation.
 *
 * OpenRouter uses OpenAI-compatible API, so we reuse the OpenAI implementation.
 *
 * @module custom/providers/openrouter
 */

import type { Logger } from '../../utils/logger.js';
import type { ResolvedCustomConfig } from '../types.js';
import type { ProviderMessages } from '../prompt.js';
import { callOpenAI } from './openai.js';

/**
 * Call OpenRouter API with the given prompt.
 */
export async function callOpenRouter(
  messages: ProviderMessages,
  config: ResolvedCustomConfig,
  logger: Logger
): Promise<string> {
  return callOpenAI(messages, config, logger);
}
