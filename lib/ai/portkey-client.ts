import Portkey from 'portkey-ai';
import OpenAI from 'openai';

/**
 * AI Client Configuration
 * 
 * Priority order:
 * 1. Portkey + OpenRouter (if PORTKEY_API_KEY and OPENROUTER_API_KEY are set)
 * 2. Direct OpenAI (if OPENAI_API_KEY is set)
 */

// Check which services are available
const hasPortkey = !!process.env.PORTKEY_API_KEY;
const hasOpenRouter = !!process.env.OPENROUTER_API_KEY;
const hasOpenAI = !!process.env.OPENAI_API_KEY;

export type AIClientType = 'portkey' | 'openai' | 'none';

export const AI_CONFIG = {
  type: (hasPortkey && hasOpenRouter ? 'portkey' : hasOpenAI ? 'openai' : 'none') as AIClientType,
  models: {
    // Primary model for chat
    chat: hasPortkey && hasOpenRouter 
      ? 'openai/gpt-4-turbo-preview' 
      : 'gpt-4-turbo-preview',
    // Faster model for suggestions
    suggestions: hasPortkey && hasOpenRouter
      ? 'openai/gpt-3.5-turbo'
      : 'gpt-3.5-turbo',
  },
  maxTokens: {
    chat: 4000,
    suggestions: 150,
  },
  temperature: {
    chat: 0.7,
    suggestions: 0.5,
  },
};

/**
 * Get Portkey client (if configured)
 */
export function getPortkeyClient(): Portkey | null {
  if (!hasPortkey || !hasOpenRouter) {
    return null;
  }

  return new Portkey({
    apiKey: process.env.PORTKEY_API_KEY!,
    virtualKey: process.env.OPENROUTER_API_KEY!,
  });
}

/**
 * Get OpenAI client (fallback)
 */
export function getOpenAIClient(): OpenAI | null {
  if (!hasOpenAI) {
    return null;
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
  });
}

/**
 * Get the active AI client
 */
export function getAIClient(): Portkey | OpenAI | null {
  const portkeyClient = getPortkeyClient();
  if (portkeyClient) {
    return portkeyClient;
  }

  const openaiClient = getOpenAIClient();
  if (openaiClient) {
    return openaiClient;
  }

  console.error('No AI client configured. Please set OPENAI_API_KEY or (PORTKEY_API_KEY + OPENROUTER_API_KEY)');
  return null;
}

/**
 * Check if AI is available
 */
export function isAIAvailable(): boolean {
  return AI_CONFIG.type !== 'none';
}

/**
 * Get AI status message
 */
export function getAIStatus(): string {
  switch (AI_CONFIG.type) {
    case 'portkey':
      return 'Using Portkey with OpenRouter';
    case 'openai':
      return 'Using OpenAI directly';
    case 'none':
      return 'No AI service configured';
  }
}
