// src/compiler/llm.ts

import { GoogleGenAI } from '@google/genai';
import type { Policy } from '../types.js';
import { SYSTEM_PROMPT } from './prompt.js';

// Native JSON schema - GUARANTEES valid output from Gemini
const POLICY_SCHEMA = {
  type: 'object',
  properties: {
    action: {
      type: 'string',
      enum: ['delete', 'modify', 'execute', 'read'],
    },
    include: {
      type: 'array',
      items: { type: 'string' },
      description: 'Glob patterns for protected files',
    },
    exclude: {
      type: 'array',
      items: { type: 'string' },
      description: 'Glob patterns for safe exceptions',
    },
    description: {
      type: 'string',
      description: 'Human-readable description of what is protected',
    },
  },
  required: ['action', 'include', 'exclude', 'description'],
} as const;

let ai: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not set');
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

export async function compileWithLLM(
  restriction: string,
  suggestedAction: Policy['action']
): Promise<Policy> {
  const client = getAI();

  const prompt = `${SYSTEM_PROMPT}

The user has indicated the action should be: "${suggestedAction}"

Restriction: "${restriction}"`;

  const response = await client.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
    config: {
      temperature: 0,
      maxOutputTokens: 512,
      responseMimeType: 'application/json',
      responseSchema: POLICY_SCHEMA,
    },
  });

  // response.text is GUARANTEED valid JSON matching schema
  const text = response.text;
  if (!text) {
    throw new Error('Empty response from Gemini');
  }

  const parsed = JSON.parse(text) as Policy;

  // Override action with suggested action if not present
  if (!parsed.action) {
    parsed.action = suggestedAction;
  }

  return parsed;
}
