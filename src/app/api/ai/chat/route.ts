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
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, context } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Run SafetyEngine first
    const safetyCheck = SafetyEngine.checkQuery(message);
    if (!safetyCheck.isAllowed) {
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

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Failed to process AI chat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
