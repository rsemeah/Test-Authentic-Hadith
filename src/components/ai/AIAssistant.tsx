/**
 * AIAssistant Component
 * AI-powered hadith explanation with SafetyEngine protection
 */

'use client';

import { useState } from 'react';
import QueryInput from './QueryInput';
import QuotaIndicator from './QuotaIndicator';

interface AIAssistantProps {
  hadithId: string;
  hadithText: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIAssistant({ hadithId, hadithText }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quotaRemaining, setQuotaRemaining] = useState<number | null>(null);

  const handleQuery = async (query: string) => {
    setError(null);
    setIsLoading(true);

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: query,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hadithId, query }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle safety blocks
        if (data.category) {
          setError(data.safeResponse || data.error);
          // Remove user message since it was blocked
          setMessages((prev) => prev.slice(0, -1));
        } else if (response.status === 429) {
          setError(
            `Daily AI quota exceeded. You've used ${data.used}/${data.limit} queries today. Resets at ${new Date(data.resetsAt).toLocaleTimeString()}.`
          );
        } else {
          setError(data.error || 'Failed to get AI response');
        }
        setIsLoading(false);
        return;
      }

      // Add assistant message
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setQuotaRemaining(data.quotaRemaining);
    } catch (err: any) {
      setError('Failed to connect to AI service');
      console.error('AI query error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-islamic-dark border border-gray-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-islamic-darker border-b border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gold-500/10 rounded-lg flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6 text-gold-500"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-gold-500 font-medium">AI Assistant</h3>
              <p className="text-gray-400 text-xs">
                Ask questions about this hadith's context and meaning
              </p>
            </div>
          </div>
          <QuotaIndicator remaining={quotaRemaining} />
        </div>
      </div>

      {/* Messages */}
      <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm mb-4">
              Ask me anything about this hadith's context, historical background, or
              general teachings.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => handleQuery('What is the context of this hadith?')}
                className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg transition-colors"
              >
                What's the context?
              </button>
              <button
                onClick={() => handleQuery('What does this hadith teach us?')}
                className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg transition-colors"
              >
                What does it teach?
              </button>
              <button
                onClick={() =>
                  handleQuery('What are the key words in this hadith?')
                }
                className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-lg transition-colors"
              >
                Key words?
              </button>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-4 ${
                message.role === 'user'
                  ? 'bg-gold-500/10 border border-gold-500/20'
                  : 'bg-islamic-darker border border-gray-800'
              }`}
            >
              <p className="text-gray-300 text-sm whitespace-pre-wrap">
                {message.content}
              </p>
              <p className="text-gray-500 text-xs mt-2">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-islamic-darker border border-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gold-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gold-500 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gold-500 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-800 p-4">
        <QueryInput onSubmit={handleQuery} disabled={isLoading} />
      </div>

      {/* Disclaimer */}
      <div className="border-t border-gray-800 p-4 bg-islamic-darker">
        <p className="text-gray-500 text-xs">
          ⚠️ This AI provides educational explanations only. It does NOT issue
          religious rulings (fatwas) or halal/haram determinations. For personal
          guidance, consult a qualified Islamic scholar.
        </p>
      </div>
    </div>
  );
}
