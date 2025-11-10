'use client'

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { submitLocation } from '../actions';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [locationStatus, setLocationStatus] = useState<string>('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Request location on component mount
  useEffect(() => {
    const requestLocation = async () => {
      if (!navigator.geolocation) {
        setLocationStatus('Geolocation tidak didukung');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          };

          try {
            const result = await submitLocation(locationData);
            if (result.success) {
              setLocationStatus('Lokasi terdeteksi');
            }
          } catch (error) {
            setLocationStatus('Gagal mengirim lokasi');
            console.error(error);
          }
        },
        (error) => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              setLocationStatus('Izin lokasi ditolak');
              break;
            case error.POSITION_UNAVAILABLE:
              setLocationStatus('Lokasi tidak tersedia');
              break;
            case error.TIMEOUT:
              setLocationStatus('Request lokasi timeout');
              break;
            default:
              setLocationStatus('Kesalahan lokasi');
              break;
          }
        }
      );
    };

    requestLocation();
  }, []);

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
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Sidebar - Hidden on mobile */}
      <div className="hidden md:flex w-64 bg-slate-900/30 backdrop-blur-xl border-r border-white/10 flex-col">
        <div className="p-4 border-b border-white/10">
          <Link href="/" className="text-white/80 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Kembali
          </Link>
        </div>
        
        <div className="flex-1 p-4 flex flex-col">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white mb-1">
              AI Assistant
            </h2>
            <p className="text-sm text-white/60">Chat Assistant</p>
          </div>
          
          <Button
            onClick={clearChat}
            variant="outline"
            className="w-full mb-4 bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear Chat
          </Button>

          <div className="mt-auto space-y-3">
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="text-xs text-white/60 mb-2 font-medium">Status Lokasi</p>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-md ${
                locationStatus.includes('terdeteksi') ? 'bg-emerald-500/20' : 
                locationStatus.includes('ditolak') || locationStatus.includes('Gagal') ? 'bg-red-500/20' : 
                'bg-yellow-500/20'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  locationStatus.includes('terdeteksi') ? 'bg-emerald-400' : 
                  locationStatus.includes('ditolak') || locationStatus.includes('Gagal') ? 'bg-red-400' : 
                  'bg-yellow-400'
                }`}></div>
                <span className={`text-sm font-medium ${
                  locationStatus.includes('terdeteksi') ? 'text-emerald-300' : 
                  locationStatus.includes('ditolak') || locationStatus.includes('Gagal') ? 'text-red-300' : 
                  'text-yellow-300'
                }`}>
                  {locationStatus || 'Mendeteksi...'}
                </span>
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <p className="text-xs text-white/60 mb-2 font-medium">API Status</p>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-md ${error ? 'bg-red-500/20' : 'bg-emerald-500/20'}`}>
                <div className={`w-2 h-2 rounded-full ${error ? 'bg-red-400 animate-pulse' : 'bg-emerald-400'}`}></div>
                <span className={`text-sm font-medium ${error ? 'text-red-300' : 'text-emerald-300'}`}>
                  {error ? 'Offline' : 'Online'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header with Back Button */}
        <div className="md:hidden bg-slate-900/50 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-white/80 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-base font-semibold text-white">AI Assistant</h1>
            <p className="text-xs text-white/60">Chat Assistant</p>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-hidden relative flex flex-col">
          <ScrollArea className="flex-1" ref={scrollAreaRef}>
            <div className={`max-w-4xl mx-auto px-4 md:px-4 ${messages.length === 0 ? '' : 'py-6'}`}>
              {messages.length > 0 && (
                <div className="space-y-6">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.role === 'assistant' && (
                        <div className="hidden sm:flex w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 items-center justify-center flex-shrink-0 mt-1">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                      )}
                      
                      <div
                        className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 ${
                          message.role === 'user'
                            ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white ml-auto'
                            : 'bg-slate-800/50 backdrop-blur-sm text-white border border-white/10'
                        }`}
                      >
                        {message.role === 'user' ? (
                          <div className="text-sm sm:text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                            {message.content}
                          </div>
                        ) : (
                          <div className="text-sm sm:text-[15px] leading-relaxed prose prose-invert prose-sm sm:prose-base max-w-none prose-p:my-2 prose-pre:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-1 prose-code:text-purple-300 prose-code:bg-slate-900/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-slate-900/80 prose-pre:border prose-pre:border-white/10">
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm, remarkMath]}
                              rehypePlugins={[rehypeKatex]}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>

                      {message.role === 'user' && (
                        <div className="hidden sm:flex w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 items-center justify-center flex-shrink-0 mt-1">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {loading && (
                    <div className="flex gap-3 justify-start">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                      <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                          </div>
                          <span className="text-sm text-white/60">Processing</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="flex justify-center">
                      <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl px-4 py-3 max-w-2xl">
                        <div className="flex items-start gap-2">
                          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm">{error}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Area - Centered when empty, bottom when has messages */}
          <div className={`${messages.length === 0 ? 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl px-4' : ''}`}>
            <div className={`${messages.length === 0 ? 'space-y-6' : 'max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4'}`}>
              {messages.length === 0 && (
                <div className="text-center mb-6 sm:mb-8">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-3 sm:mb-4 mx-auto">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-semibold text-white mb-2">
                    Mulai Percakapan
                  </h3>
                  <p className="text-sm sm:text-base text-white/60 max-w-md mx-auto px-4">
                    Ketik pesan Anda di bawah untuk memulai chat dengan AI assistant
                  </p>
                </div>
              )}
              
              <div className="flex gap-2 sm:gap-3 items-end">
                <div className="flex-1 relative">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Ketik pesan Anda..."
                    className="w-full bg-slate-800/80 border-white/20 text-white placeholder:text-white/40 focus:ring-2 focus:ring-purple-500 focus:border-transparent rounded-xl resize-none min-h-[48px] sm:min-h-[52px] max-h-[200px] pr-12 text-sm sm:text-base"
                    rows={1}
                    disabled={loading}
                  />
                  <div className="absolute bottom-2.5 sm:bottom-3 right-3 text-xs text-white/40 hidden sm:block">
                    {input.length > 0 && `${input.length} chars`}
                  </div>
                </div>
                <Button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className="h-[48px] sm:h-[52px] px-4 sm:px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-medium rounded-xl transition-all shadow-lg disabled:shadow-none"
                >
                  {loading ? (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </Button>
              </div>
              <p className="text-[10px] sm:text-xs text-white/40 mt-2 text-center">
                Press Enter to send • Shift + Enter for new line
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}