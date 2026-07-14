import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Loader2, Trash2 } from 'lucide-react';
import { aiApi } from '../../services/aiApi';

interface AiChatPanelProps {
  activeFileContent?: string;
  activeFileName?: string | null;
  projectId?: string;
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string; // ISO string for JSON serialization
}

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  sender: 'ai',
  text: 'Hello! I am Parallax AI. How can I help you with your code today?',
  timestamp: new Date().toISOString()
};

function getStorageKey(projectId?: string) {
  return projectId ? `parallax-ai-chat-${projectId}` : null;
}

function loadMessages(projectId?: string): Message[] {
  const key = getStorageKey(projectId);
  if (!key) return [WELCOME_MESSAGE];
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored) as Message[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Corrupted data — fall back to welcome
  }
  return [WELCOME_MESSAGE];
}

function saveMessages(projectId: string | undefined, messages: Message[]) {
  const key = getStorageKey(projectId);
  if (!key) return;
  try {
    localStorage.setItem(key, JSON.stringify(messages));
  } catch {
    // Storage full — silently fail
  }
}

export function AiChatPanel({ activeFileContent, activeFileName, projectId }: AiChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>(() => loadMessages(projectId));
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Persist messages whenever they change
  useEffect(() => {
    saveMessages(projectId, messages);
  }, [messages, projectId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Reload messages when projectId changes
  useEffect(() => {
    setMessages(loadMessages(projectId));
  }, [projectId]);

  useEffect(() => {
    const handleTrigger = (e: Event) => {
      const customEvent = e as CustomEvent;
      const prompt = customEvent.detail;
      if (prompt) {
        setInput(prompt);
        // Delay send slightly so state sets first
        setTimeout(() => {
          const btn = document.getElementById("ai-send-btn");
          if (btn) btn.click();
        }, 50);
      }
    };
    window.addEventListener("trigger-ai-chat", handleTrigger);
    return () => window.removeEventListener("trigger-ai-chat", handleTrigger);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: input.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await aiApi.chat({
        prompt: userMessage.text,
        activeFileContent,
        activeFileName: activeFileName || undefined
      });

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: response.reply,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI Chat Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: 'Sorry, I encountered an error while processing your request.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = useCallback(() => {
    setMessages([WELCOME_MESSAGE]);
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#09090B]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-[#D4AF37]" />
          <h3 className="text-sm font-semibold text-white/90">Parallax AI</h3>
        </div>
        <button
          onClick={handleClearChat}
          title="Clear chat history"
          className="p-1.5 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/10 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              msg.sender === 'user' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-white/10 text-white/70'
            }`}>
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2 ${
              msg.sender === 'user' 
                ? 'bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-white/90 rounded-tr-none'
                : 'bg-white/5 border border-white/10 text-white/80 rounded-tl-none'
            }`}>
              <div className="text-sm whitespace-pre-wrap font-sans">{msg.text}</div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 text-white/70 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-[#D4AF37] animate-spin" />
              <span className="text-xs text-white/50">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/5 bg-white/[0.02] shrink-0">
        {activeFileName && (
          <div className="mb-2 text-[10px] text-white/40 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]"></span>
            Context: {activeFileName}
          </div>
        )}
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask AI anything..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]/50 resize-none min-h-[44px] max-h-[120px]"
            rows={1}
          />
          <button
            id="ai-send-btn"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 bottom-2 p-1.5 bg-[#D4AF37]/10 text-[#D4AF37] rounded-lg hover:bg-[#D4AF37]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
