import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { Send, Bot, User, BookmarkPlus, Check, Copy, Sparkles, GraduationCap, Lightbulb, Code2, Target } from 'lucide-react';
import { geminiService } from '../services/geminiService';

interface ChatViewProps {
  file?: File | null;
  context?: string;
  onAddToNotes?: (content: string) => void;
  t?: any;
}

const PERSONAS = [
  { id: 'Socratic Tutor', label: 'Socratic', icon: Lightbulb, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800' },
  { id: 'Feynman Explainer', label: 'Feynman', icon: Sparkles, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800' },
  { id: 'Exam Coach', label: 'Exam Coach', icon: Target, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800' },
  { id: 'Code Specialist', label: 'Code Mentor', icon: Code2, color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950/30 border-cyan-300 dark:border-cyan-800' },
];

export const ChatView: React.FC<ChatViewProps> = ({ file, context, onAddToNotes, t }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [copiedIds, setCopiedIds] = useState<Set<number>>(new Set());
  const [selectedPersona, setSelectedPersona] = useState<string>('Socratic Tutor');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current) {
      const initialMsg = file 
        ? (t?.chatInitialLecture || `Hi! I'm Buddy with ${selectedPersona} mode active. I've analyzed this lecture content. Ask me anything!`)
        : (t?.chatInitialWorkspace || `Hi! I'm Buddy in ${selectedPersona} mode. Ask me any study question!`);
        
      setMessages([{ role: 'model', text: initialMsg, timestamp: Date.now() }]);
      initializedRef.current = true;
    }
  }, [file, context, t, selectedPersona]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      let responseText = '';
      
      // First try local/server AI Tutor endpoint if available
      try {
        const res = await fetch('/api/tutor/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: 'default_session',
            persona: selectedPersona,
            message: userMsg.text,
            context: context || ''
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.reply) {
            responseText = data.reply;
          }
        }
      } catch (err) {
        // Fallback to Gemini client
      }

      if (!responseText) {
        const personaPrompt = `Persona instruction: You are acting as ${selectedPersona}. `;
        if (file) {
          responseText = await geminiService.chatWithDocument(file, messages, personaPrompt + userMsg.text);
        } else if (context) {
          responseText = await geminiService.chatWithContext(context, messages, personaPrompt + userMsg.text);
        } else {
          responseText = await geminiService.chatWithContext("General study assistant", messages, personaPrompt + userMsg.text);
        }
      }
      
      const botMsg: ChatMessage = { role: 'model', text: responseText, timestamp: Date.now() };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error answering your question.", timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToNotes = (msg: ChatMessage, idx: number) => {
    if (onAddToNotes) {
      onAddToNotes(msg.text);
      setSavedIds(prev => new Set(prev).add(idx));
    }
  };

  const handleCopyToClipboard = (msg: ChatMessage, idx: number) => {
    navigator.clipboard.writeText(msg.text);
    setCopiedIds(prev => new Set(prev).add(idx));
    setTimeout(() => {
      setCopiedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(idx);
        return newSet;
      });
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[600px]">
      {/* Persona Selector Bar */}
      <div className="flex items-center gap-2 mb-3 pb-2 overflow-x-auto no-scrollbar">
        <span className="text-xs font-semibold text-gray-400 flex items-center gap-1">
          <GraduationCap className="w-3.5 h-3.5" /> Persona:
        </span>
        {PERSONAS.map(p => {
          const Icon = p.icon;
          const isSelected = selectedPersona === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setSelectedPersona(p.id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                isSelected 
                  ? p.color + ' shadow-sm scale-105' 
                  : 'bg-surface text-gray-400 border-gray-200 dark:border-gray-800 hover:text-text'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 p-4 rounded-xl bg-surface border border-gray-200 dark:border-gray-800 mb-4 min-h-0">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${msg.role === 'user' ? 'bg-primary' : 'bg-gradient-to-br from-accent to-orange-400'}`}>
              {msg.role === 'user' ? <User className="w-6 h-6 text-white" /> : <Bot className="w-6 h-6 text-white" />}
            </div>
            
            <div className="group relative max-w-[80%]">
              <div className={`p-4 rounded-2xl text-sm shadow-md leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-primary/20 text-primary-800 dark:text-primary-50 rounded-tr-none border border-primary/30' 
                  : 'bg-surface border border-gray-200 dark:border-gray-700 text-text rounded-tl-none whitespace-pre-wrap'
              }`}>
                {msg.text}
              </div>

              {/* Actions Bar (Only for Model) */}
              {msg.role === 'model' && (
                <div className="absolute -bottom-8 left-0 flex gap-2">
                  {onAddToNotes && (
                    <button
                      onClick={() => handleSaveToNotes(msg, idx)}
                      disabled={savedIds.has(idx)}
                      className={`
                        flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md transition-all
                        ${savedIds.has(idx) 
                          ? 'text-green-500 bg-green-100 dark:bg-green-900/20' 
                          : 'text-gray-400 opacity-0 group-hover:opacity-100 hover:text-text hover:bg-gray-200 dark:hover:bg-gray-700'
                        }
                      `}
                    >
                      {savedIds.has(idx) ? (
                        <><Check className="w-3 h-3" /> {t?.saved || "Saved"}</>
                      ) : (
                        <><BookmarkPlus className="w-3 h-3" /> {t?.saveToNotes || "Save to Notes"}</>
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => handleCopyToClipboard(msg, idx)}
                    className={`
                      flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md transition-all
                      ${copiedIds.has(idx)
                        ? 'text-blue-500 bg-blue-100 dark:bg-blue-900/20'
                        : 'text-gray-400 opacity-0 group-hover:opacity-100 hover:text-text hover:bg-gray-200 dark:hover:bg-gray-700'
                      }
                    `}
                  >
                    {copiedIds.has(idx) ? (
                      <><Check className="w-3 h-3" /> {t?.copied || "Copied"}</>
                    ) : (
                      <><Copy className="w-3 h-3" /> {t?.copyToClipboard || "Copy"}</>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-orange-400 flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div className="bg-surface border border-gray-200 dark:border-gray-700 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              <span className="text-xs text-gray-500 ml-2">{file ? (t?.scanning || "Scanning media...") : (t?.thinking || `Consulting ${selectedPersona}...`)}</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="relative pb-safe">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={file ? (t?.chatPlaceholderLecture || `Ask ${selectedPersona} about this lecture...`) : `Ask ${selectedPersona} anything...`}
          className="w-full bg-surface border border-gray-300 dark:border-gray-700 rounded-xl py-4 pl-5 pr-14 text-text focus:outline-none focus:border-primary transition-colors shadow-sm"
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="absolute right-2 top-2 bottom-2 px-4 bg-primary hover:bg-blue-600 text-white rounded-lg transition-all disabled:opacity-50 disabled:hover:bg-primary shadow-lg flex items-center justify-center"
          style={{ bottom: '8px' }}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
