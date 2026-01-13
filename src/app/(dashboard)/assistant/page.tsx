'use client';

import { useEffect, useRef, useState } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, context: 'hadith' }),
      });

      if (!response.ok) {
        throw new Error(response.statusText);
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError('Failed to get response from assistant');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 h-[calc(100vh-200px)] flex flex-col">
      <div className="mb-8">
        <h1 className="text-4xl font-playfair font-bold mb-2">Islamic Knowledge Assistant</h1>
        <p className="text-gray-400">
          Ask questions about hadith, Islamic teachings, and more
        </p>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto mb-8 space-y-6 pr-4">
        {messages.length === 0 && !error && (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <p className="text-5xl mb-4">✨</p>
              <p className="text-xl font-semibold text-white mb-2">
                Welcome to the Islamic Knowledge Assistant
              </p>
              <p className="text-gray-400 max-w-md">
                Ask me anything about hadith, Islamic teachings, scholars, and more. I'll provide
                detailed, accurate responses based on authentic Islamic sources.
              </p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-md lg:max-w-2xl p-4 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-gold/20 border border-gold/30 text-white'
                  : 'card bg-islamic-darker'
              }`}
            >
              <p className="text-sm">
                {msg.role === 'assistant' ? (
                  <div className="leading-relaxed">{msg.content}</div>
                ) : (
                  msg.content
                )}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                {msg.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="card bg-islamic-darker p-4 rounded-lg">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-gold rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4 text-red-400">
          {error}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about Islamic knowledge..."
          className="input-base flex-1"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="btn-gold px-8 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  );
}
