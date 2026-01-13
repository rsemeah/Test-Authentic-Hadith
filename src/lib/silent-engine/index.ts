/**
 * SilentEngine Integration for Authentic Hadith
 * Intelligent AI routing with cost optimization
 * Routes requests to cheapest/fastest available model
 */

import OpenAI from 'openai';

// Model configurations with cost and latency profiles
export const MODEL_CONFIGS = {
  'gpt-4-turbo': {
    provider: 'openai',
    costPer1kTokens: 0.01,
    latencyMs: 2000,
    capabilities: ['high_quality', 'complex_reasoning'],
  },
  'gpt-4': {
    provider: 'openai',
    costPer1kTokens: 0.03,
    latencyMs: 3000,
    capabilities: ['high_quality', 'complex_reasoning'],
  },
  'gpt-3.5-turbo': {
    provider: 'openai',
    costPer1kTokens: 0.001,
    latencyMs: 800,
    capabilities: ['low_cost', 'fast_latency'],
  },
} as const;

export type ModelName = keyof typeof MODEL_CONFIGS;

export interface GenerateRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  maxCost?: number;
  preferredCapabilities?: Array<'low_cost' | 'fast_latency' | 'high_quality' | 'complex_reasoning'>;
  temperature?: number;
  maxTokens?: number;
}

export interface GenerateResponse {
  text: string;
  tokensUsed: number;
  actualCost: number;
  provider: string;
  model: string;
  latencyMs: number;
}

/**
 * SilentEngine - Cost-optimized AI routing
 */
export class SilentEngine {
  private static openai: OpenAI;

  /**
   * Initialize OpenAI client
   */
  private static getOpenAI(): OpenAI {
    if (!this.openai) {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY environment variable is required');
      }
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
    return this.openai;
  }

  /**
   * Select best model based on cost and capability preferences
   */
  private static selectModel(
    preferredCapabilities: string[] = ['low_cost', 'fast_latency']
  ): ModelName {
    // Score each model based on capabilities
    const scores: Record<ModelName, number> = {
      'gpt-4-turbo': 0,
      'gpt-4': 0,
      'gpt-3.5-turbo': 0,
    };

    for (const [modelName, config] of Object.entries(MODEL_CONFIGS)) {
      for (const capability of preferredCapabilities) {
        if (config.capabilities.includes(capability as any)) {
          scores[modelName as ModelName] += 1;
        }
      }
    }

    // For hadith explanations, GPT-3.5-turbo is sufficient and cost-effective
    // Only use GPT-4 if explicitly requested high quality
    if (preferredCapabilities.includes('low_cost') || preferredCapabilities.includes('fast_latency')) {
      return 'gpt-3.5-turbo';
    }

    // If high quality requested, use GPT-4 Turbo (cheaper than GPT-4)
    if (preferredCapabilities.includes('high_quality')) {
      return 'gpt-4-turbo';
    }

    // Default to cost-optimized
    return 'gpt-3.5-turbo';
  }

  /**
   * Generate AI response with intelligent routing
   */
  static async generate(request: GenerateRequest): Promise<GenerateResponse> {
    const startTime = Date.now();
    const openai = this.getOpenAI();

    // Select optimal model
    const selectedModel = this.selectModel(request.preferredCapabilities);
    const modelConfig = MODEL_CONFIGS[selectedModel];

    try {
      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: selectedModel,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 500,
      });

      const latencyMs = Date.now() - startTime;
      const tokensUsed = completion.usage?.total_tokens ?? 0;
      const actualCost = (tokensUsed / 1000) * modelConfig.costPer1kTokens;

      // Check if we exceeded max cost
      if (request.maxCost && actualCost > request.maxCost) {
        console.warn(
          `Cost ${actualCost} exceeded maxCost ${request.maxCost} for model ${selectedModel}`
        );
      }

      return {
        text: completion.choices[0]?.message?.content ?? '',
        tokensUsed,
        actualCost,
        provider: 'openai',
        model: selectedModel,
        latencyMs,
      };
    } catch (error: any) {
      console.error('SilentEngine generation error:', error);
      throw new Error(`AI generation failed: ${error.message}`);
    }
  }

  /**
   * Get estimated cost for a request
   */
  static estimateCost(
    inputLength: number,
    outputLength: number,
    preferredCapabilities?: string[]
  ): number {
    const model = this.selectModel(preferredCapabilities);
    const config = MODEL_CONFIGS[model];
    const totalTokens = inputLength + outputLength;
    return (totalTokens / 1000) * config.costPer1kTokens;
  }

  /**
   * Health check
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const openai = this.getOpenAI();
      await openai.models.list();
      return true;
    } catch (error) {
      console.error('SilentEngine health check failed:', error);
      return false;
    }
  }
}

export default SilentEngine;
