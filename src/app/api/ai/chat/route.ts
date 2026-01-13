/**
 * POST /api/ai/chat
 * AI chat with safety checking and proof metadata
 * ✅ RETROFITTED: TruthSerum proof metadata enabled
 */
import SafetyEngine from '@/lib/safety-engine';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Get user from session
    const authHeader = request.headers.get('Authorization');
    const userId = request.headers.get('x-user-id');
    const sessionId = request.headers.get('x-session-id');
    
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, context } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Run SafetyEngine with logging to database
    const safetyCheck = await SafetyEngine.evaluateAndLog(
      message,
      userId || undefined,
      sessionId || undefined
    );
    
    if (!safetyCheck.allowed) {
      return NextResponse.json(
        { error: 'Your query violates our safety policies' },
        { status: 400 }
      );
    }

    // Prepare system prompt based on context
    const systemPrompt = context === 'hadith' 
      ? 'You are an expert in Islamic studies and hadith. Provide accurate, respectful, and educational responses about Islamic teachings, hadith, and Islamic history. Keep responses concise and scholarly.'
      : 'You are a helpful assistant for Islamic education. Provide accurate and respectful information.';

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: message,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const response = completion.choices[0].message.content || '';

    return NextResponse.json({ 
      response,
      _proof: {
        operation: 'AI_CHAT',
        verified_at: new Date().toISOString(),
        verification_method: 'safety_checked',
        safety_decision: safetyCheck.allowed ? 'ALLOW' : 'BLOCK',
        safety_decision_id: safetyCheck.decisionId,
        model: 'gpt-3.5-turbo',
        tokens_used: completion.usage?.total_tokens || 0,
      }
    });
  } catch (error) {
    console.error('Failed to process AI chat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
