'use client'

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatPage() {
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

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          model: 'qwen3:8b',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());

          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              if (data.role === 'assistant' && data.content) {
                assistantMessage += data.content;
                setMessages((prev) => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  
                  if (lastMessage && lastMessage.role === 'assistant') {
                    lastMessage.content = assistantMessage;
                  } else {
                    newMessages.push({ role: 'assistant', content: assistantMessage });
                  }
                  
                  return newMessages;
                });
              }
            } catch (e) {
              console.error('Error parsing JSON:', e);
            }
          }
        }
      }
    } catch (err) {
      setError('Gagal mengirim pesan. Pastikan server API berjalan di http://localhost:8000');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = async () => {
    try {
      await fetch('http://localhost:8000/api/chat', {
        method: 'DELETE',
      });
      setMessages([]);
      setError('');
    } catch (err) {
      console.error('Error clearing chat:', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex min-h-screen gradient-bg">
      {/* Sidebar */}
      <div className="w-64 bg-white/10 backdrop-blur-sm border-r border-white/20 p-4">
        <div className="flex flex-col h-full">
          <Link href="/" className="text-white hover:text-white/80 mb-6 flex items-center gap-2">
            <span>←</span> Kembali ke Home
          </Link>
          
          <h2 className="text-xl font-bold text-white mb-4">
            Ollama MCP Chat
          </h2>
          
          <Button
            onClick={clearChat}
            variant="destructive"
            className="w-full mb-4"
          >
            Clear Chat
          </Button>

          <Card className="text-sm mt-auto bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="pt-4">
              <p className="mb-2 text-white/80">Status API:</p>
              <div className={`px-3 py-2 rounded ${error ? 'bg-red-500/20 text-red-200' : 'bg-green-500/20 text-green-200'}`}>
                {error ? '❌ Offline' : '✓ Online'}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Card className="rounded-none border-b border-white/20 bg-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-white">
              Chat dengan Ollama + MCP Tools
            </CardTitle>
            <CardDescription className="text-white/70">
              Chatbot dengan akses ke MCP tools (random numbers, power calculations, dll)
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Messages */}
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-white/70 mt-10">
                <p className="text-lg mb-2">Mulai percakapan dengan mengetik pesan di bawah</p>
                <p className="text-sm">Bot ini dapat menggunakan MCP tools untuk membantu Anda</p>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <Card
                  className={`max-w-3xl ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white border-blue-700'
                      : 'bg-white/10 backdrop-blur-sm text-white border-white/20'
                  }`}
                >
                  <CardContent className="pt-4">
                    <div className="text-xs font-semibold mb-1 opacity-75">
                      {message.role === 'user' ? 'You' : 'Assistant'}
                    </div>
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </CardContent>
                </Card>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <Card className="max-w-3xl bg-white/10 backdrop-blur-sm border-white/20">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-white">
                      <div className="animate-pulse">Thinking...</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {error && (
              <div className="flex justify-center">
                <Card className="max-w-3xl bg-red-500/20 text-red-200 border-red-500/30">
                  <CardContent className="pt-4">
                    {error}
                  </CardContent>
                </Card>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <Card className="rounded-none border-t border-white/20 bg-white/10 backdrop-blur-sm">
          <CardContent className="pt-4">
            <div className="max-w-4xl mx-auto flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ketik pesan Anda... (Enter untuk kirim, Shift+Enter untuk baris baru)"
                className="flex-1 bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:ring-blue-500 resize-none"
                rows={3}
                disabled={loading}
              />
              <Button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold self-end"
              >
                {loading ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
