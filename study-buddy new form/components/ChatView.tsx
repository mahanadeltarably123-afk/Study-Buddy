import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Language } from '../types';
import { Send, Bot, User, BookmarkPlus, Check, Copy, Trash2 } from 'lucide-react';
import { geminiService } from '../services/geminiService';

interface ChatViewProps {
  file?: File | null;
  context?: string;
  onAddToNotes?: (content: string) => void;
  t?: any;
  storageKey?: string;
  language?: Language;
}

const renderMarkdown = (text: string) => {
  // Bold
  let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Newlines to <br>
  html = html.replace(/\n/g, '<br />');
  // Basic numbered list support
  html = html.replace(/(\d+\.\s.*?(?=<br \/>|$))/g, '<p style="margin-left: 20px; text-indent: -10px;">$1</p>');
  return { __html: html };
};

export const ChatView: React.FC<ChatViewProps> = ({ file, context, onAddToNotes, t, storageKey, language = 'en' }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [copiedIds, setCopiedIds] = useState<Set<number>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  // Load history
  useEffect(() => {
    if (storageKey) {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setMessages(parsed);
                    initializedRef.current = true;
                    return;
                }
            } catch (e) {
                console.error("Failed to parse chat history");
            }
        }
    }
    
    // Initial greeting if no history
    if (!initializedRef.current && messages.length === 0) {
          const initialMsg: ChatMessage = { 
            role: 'model', 
            text: file 
              ? (t?.chatInitialLecture || "Hi! I'm Buddy. I've analyzed this lecture content. Ask me anything!")
              : (t?.chatInitialWorkspace || "Hi! I'm Buddy. I'm here to help you with everything in this workspace."),
            timestamp: Date.now() 
          };
          setMessages([initialMsg]);
          initializedRef.current = true;
    }
  }, [file, context, t, storageKey]);

  // Save history
  useEffect(() => {
      if (storageKey && messages.length > 0) {
          localStorage.setItem(storageKey, JSON.stringify(messages));
      }
  }, [messages, storageKey]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    if (!file && !context) return;

    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      let responseText;
      if (file) {
          // Lecture specific RAG
          responseText = await geminiService.chatWithDocument(file, messages, userMsg.text, language);
      } else if (context) {
          // Workspace context chat
          responseText = await geminiService.chatWithContext(context, messages, userMsg.text, language);
      } else {
          responseText = "I'm not sure what context to use.";
      }
      
      const botMsg: ChatMessage = { role: 'model', text: responseText, timestamp: Date.now() };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error.", timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
      if (window.confirm("Are you sure you want to clear the chat history?")) {
          setMessages([]);
          initializedRef.current = false; // Allow re-initialization
          if (storageKey) localStorage.removeItem(storageKey);
          
          // Re-add initial message
          setTimeout(() => {
              const initialMsg: ChatMessage = { 
                role: 'model', 
                text: file 
                  ? (t?.chatInitialLecture || "Hi! I'm Buddy. I've analyzed this lecture content. Ask me anything!")
                  : (t?.chatInitialWorkspace || "Hi! I'm Buddy. I'm here to help you with everything in this workspace."),
                timestamp: Date.now() 
              };
              setMessages([initialMsg]);
          }, 100);
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
    <div className="flex flex-col h-full max-h-[600px] relative">
      {messages.length > 1 && (
          <button 
            onClick={handleClearHistory}
            className="absolute top-2 right-4 z-10 p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            title="Clear History"
          >
              <Trash2 className="w-4 h-4" />
          </button>
      )}

      <div className="flex-1 overflow-y-auto space-y-6 p-4 rounded-xl bg-black/5 dark:bg-black/20 border border-gray-200 dark:border-gray-800 mb-4 min-h-0 custom-scrollbar">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${msg.role === 'user' ? 'bg-primary' : 'bg-gradient-to-br from-accent to-orange-400'}`}>
              {msg.role === 'user' ? <User className="w-6 h-6 text-white" /> : <Bot className="w-6 h-6 text-white" />}
            </div>
            
            <div className="group relative max-w-[80%]">
                <div className={`p-4 rounded-2xl text-sm shadow-md leading-relaxed prose prose-sm max-w-none dark:prose-invert ${
                msg.role === 'user' 
                    ? 'bg-primary/20 text-primary-800 dark:text-primary-50 rounded-tr-none border border-primary/30' 
                    : 'bg-surface border border-gray-200 dark:border-gray-700 text-text rounded-tl-none'
                }`}
                style={{ direction: language === 'ar' ? 'rtl' : 'ltr', textAlign: language === 'ar' ? 'right' : 'left' }}
                dangerouslySetInnerHTML={renderMarkdown(msg.text)}
                />

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
               <span className="text-xs text-gray-500 ml-2">{file ? (t?.scanning || "Scanning media...") : (t?.thinking || "Thinking...")}</span>
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
          placeholder={file ? (t?.chatPlaceholderLecture || "Ask about the lecture...") : (t?.chatPlaceholderWorkspace || "Ask Buddy about your workspace...")}
          className="w-full bg-surface border border-gray-300 dark:border-gray-700 rounded-xl py-4 pl-5 pr-14 text-text focus:outline-none focus:border-primary transition-colors shadow-sm"
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className="absolute right-2 top-2 bottom-2 px-4 bg-primary hover:bg-blue-600 text-white rounded-lg transition-all disabled:opacity-50 disabled:hover:bg-primary shadow-lg flex items-center justify-center"
          style={{ bottom: '8px' }} // Adjust specifically for padding
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};