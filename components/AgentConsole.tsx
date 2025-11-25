
import React, { useEffect, useRef, useState } from 'react';
import { Message, PlanStep, AgentStatus, FileData, ToolCall, UserProfile } from '../types';
import PlanVisualizer from './PlanVisualizer';
import { Send, Sparkles, Mic, ChevronDown, Plus, Globe, Code, FileText, Check, Copy, StopCircle, Maximize2, Settings, LogOut, User } from 'lucide-react';
import Markdown from 'react-markdown';

interface AgentConsoleProps {
  messages: Message[];
  plan: PlanStep[];
  status: AgentStatus;
  input: string;
  setInput: (s: string) => void;
  onSend: () => void;
  selectedModel: string;
  onSelectModel: (model: string) => void;
  fileSystem?: FileData[];
  activeToolCall?: ToolCall | null;
  isSidePanelOpen?: boolean;
  onOpenSidePanel?: () => void;
  user: UserProfile | null;
  onOpenSettings: () => void;
  onLogin: () => void;
  onLogout: () => void;
}

const MODELS = [
  { id: 'gemini-2.5-flash', name: 'Nexa 2.5 Flux', description: 'Fast, everyday tasks' },
  { id: 'gemini-3-pro-preview', name: 'Nexa 3 Max', description: 'Deep reasoning & quality' },
];

const SUGGESTIONS = [
  { icon: <Code size={16} />, label: 'Build website' },
  { icon: <FileText size={16} />, label: 'Create slides' },
  { icon: <Globe size={16} />, label: 'Wide Research' },
  { icon: <Plus size={16} />, label: 'More' },
];

// Browser Preview Component
const BrowserPreview = ({ toolCall, onClick }: { toolCall: ToolCall, onClick: () => void }) => {
  const isWeb = toolCall.toolName === 'web_search' || toolCall.toolName === 'visit_page';
  if (!isWeb) return null;

  const url = toolCall.toolName === 'web_search' 
    ? `google.com/search?q=${encodeURIComponent(toolCall.args.query)}`
    : toolCall.args.url;

  return (
    <div 
        onClick={onClick}
        className="absolute left-0 bottom-full mb-3 w-64 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group animate-in fade-in slide-in-from-bottom-4"
    >
        {/* Mock Browser Header */}
        <div className="h-6 bg-gray-100 flex items-center px-2 space-x-1.5 border-b border-gray-200">
            <div className="w-2 h-2 rounded-full bg-red-400"></div>
            <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
            <div className="w-2 h-2 rounded-full bg-green-400"></div>
            <div className="flex-1 ml-2 bg-white h-4 rounded-md border border-gray-200 flex items-center px-2">
                <span className="text-[8px] text-gray-400 truncate font-mono w-full">{url}</span>
            </div>
        </div>
        {/* Body */}
        <div className="p-3 flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                <Globe size={16} className="text-blue-500 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-900 truncate">
                   {toolCall.toolName === 'web_search' ? 'Searching Google...' : 'Visiting Page...'}
                </div>
                <div className="text-[10px] text-gray-500 truncate">
                   {toolCall.toolName === 'web_search' ? toolCall.args.query : 'Accessing content'}
                </div>
            </div>
            <Maximize2 size={14} className="text-gray-300 group-hover:text-gray-600 transition-colors" />
        </div>
    </div>
  );
};

// Custom Code Block Component
const CodeBlock = ({ inline, className, children, ...props }: any) => {
    const [isCopied, setIsCopied] = useState(false);
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : 'text';

    const handleCopy = () => {
        navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    if (!inline && match) {
        return (
            <div className="my-4 rounded-lg overflow-hidden bg-[#1e1e1e] border border-gray-800 shadow-sm group font-mono text-sm">
                <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-gray-700">
                    <span className="text-xs font-medium text-gray-400 lowercase">{language}</span>
                    <button 
                        onClick={handleCopy}
                        className="flex items-center space-x-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                    >
                        {isCopied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                        <span>{isCopied ? 'Copied' : 'Copy'}</span>
                    </button>
                </div>
                <div className="p-4 overflow-x-auto">
                    <code className={`${className} text-gray-300 leading-relaxed`} {...props}>
                        {children}
                    </code>
                </div>
            </div>
        );
    }

    return (
        <code className={`${className} px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-800 font-mono text-sm border border-gray-200`} {...props}>
            {children}
        </code>
    );
};

// Reusable Input Component moved outside to prevent re-render focus loss
interface ChatInputProps {
  input: string;
  setInput: (s: string) => void;
  onSend: () => void;
  status: AgentStatus;
  isHome?: boolean;
  centered?: boolean;
  activeToolCall?: ToolCall | null;
  onOpenSidePanel?: () => void;
  isSidePanelOpen?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ input, setInput, onSend, status, isHome = false, centered = false, activeToolCall, onOpenSidePanel, isSidePanelOpen }) => {
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          onSend();
        }
    };

    return (
        <div className={`relative w-full bg-white rounded-2xl border border-gray-200 shadow-sm focus-within:shadow-md transition-all p-2 ${centered ? '' : 'max-w-3xl mx-auto'}`}>
            {/* Browser Preview Floating Above Input */}
            {!isSidePanelOpen && activeToolCall && onOpenSidePanel && (
                 <div className="absolute left-0 -top-3 w-full">
                    <BrowserPreview toolCall={activeToolCall} onClick={onOpenSidePanel} />
                 </div>
            )}

            <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isHome ? "Assign a task or ask anything..." : "Send message to Nexa..."}
                className="w-full min-h-[60px] p-3 bg-transparent border-none resize-none focus:ring-0 focus:outline-none text-base text-gray-900 placeholder-gray-400"
                style={{ maxHeight: '200px' }}
            />
            <div className="flex items-center justify-between px-3 pb-2 mt-2">
                <div className="flex items-center space-x-2">
                    <button className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors focus:outline-none">
                        <Plus size={20} />
                    </button>
                </div>
                <div className="flex items-center space-x-2">
                    <button className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors focus:outline-none">
                        <Mic size={20} />
                    </button>
                    <button 
                        onClick={onSend}
                        disabled={!input.trim() || status === AgentStatus.EXECUTING}
                        className={`p-2 rounded-full transition-colors flex items-center justify-center focus:outline-none ${input.trim() && status !== AgentStatus.EXECUTING ? 'bg-black text-white hover:bg-gray-800' : 'bg-gray-100 text-gray-400'}`}
                    >
                        {status === AgentStatus.EXECUTING ? (
                           <StopCircle size={20} className="animate-pulse text-gray-500" />
                        ) : (
                           <Send size={18} />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

const UserProfileDropdown: React.FC<{ user: UserProfile | null, onOpenSettings: () => void, onLogout: () => void }> = ({ user, onOpenSettings, onLogout }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!user) {
        return (
             <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-400 cursor-default" title="Not Signed In">
                <User size={16} />
             </div>
        );
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-sm hover:ring-2 hover:ring-offset-2 hover:ring-blue-200 transition-all focus:outline-none"
            >
                {user.name.charAt(0).toUpperCase()}
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-50">
                        <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    
                    <div className="py-1">
                        <button 
                            onClick={() => { setIsOpen(false); onOpenSettings(); }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                        >
                            <Settings size={16} className="text-gray-400" />
                            <span>Settings</span>
                        </button>
                    </div>

                    <div className="border-t border-gray-50 py-1">
                        <button 
                            onClick={() => { setIsOpen(false); onLogout(); }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                        >
                            <LogOut size={16} />
                            <span>Log out</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

const AgentConsole: React.FC<AgentConsoleProps> = ({ 
  messages, 
  plan, 
  status, 
  input, 
  setInput, 
  onSend,
  selectedModel,
  onSelectModel,
  fileSystem = [],
  activeToolCall,
  isSidePanelOpen,
  onOpenSidePanel,
  user,
  onOpenSettings,
  onLogin,
  onLogout
}) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, plan, status]);

  const isHome = messages.length === 0;
  const currentModelName = MODELS.find(m => m.id === selectedModel)?.name || selectedModel;

  // --- HOME VIEW ---
  if (isHome) {
    return (
      <div className="flex-1 flex flex-col h-screen bg-white overflow-hidden relative p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
           <div className="relative">
              <button 
                onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                className="flex items-center space-x-2 text-gray-700 font-medium hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors focus:outline-none"
              >
                <span>{currentModelName}</span>
                <ChevronDown size={14} className="text-gray-400" />
              </button>
              
              {isModelDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-100 shadow-xl rounded-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                  {MODELS.map(model => (
                    <button
                      key={model.id}
                      onClick={() => {
                        onSelectModel(model.id);
                        setIsModelDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 focus:outline-none ${selectedModel === model.id ? 'bg-gray-50' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                          <span className={`font-medium text-sm ${selectedModel === model.id ? 'text-blue-600' : 'text-gray-900'}`}>{model.name}</span>
                          {selectedModel === model.id && <Check size={14} className="text-blue-600" />}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{model.description}</div>
                    </button>
                  ))}
                </div>
              )}
           </div>
           <div className="flex items-center space-x-4">
              <UserProfileDropdown user={user} onOpenSettings={onOpenSettings} onLogout={onLogout} />
           </div>
        </div>

        {/* Center Content */}
        <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full -mt-20">
            <h1 className="text-3xl font-medium text-gray-900 mb-8 tracking-tight">What can I do for you?</h1>
            
            <ChatInput 
                input={input} 
                setInput={setInput} 
                onSend={onSend} 
                status={status} 
                isHome={true} 
                centered={true}
                activeToolCall={activeToolCall}
                isSidePanelOpen={isSidePanelOpen}
                onOpenSidePanel={onOpenSidePanel}
            />
            
            <div className="text-center mt-6 pb-1">
               <span className="text-[10px] text-gray-400">Nexa can make mistakes. Check important info.</span>
            </div>

            <div className="flex flex-wrap justify-center gap-3 mt-8">
               {SUGGESTIONS.map((suggestion, idx) => (
                 <button 
                    key={idx}
                    className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm focus:outline-none"
                    onClick={() => {
                       setInput(suggestion.label + " ");
                    }}
                 >
                    {suggestion.icon}
                    <span>{suggestion.label}</span>
                 </button>
               ))}
            </div>
        </div>
      </div>
    );
  }

  // --- CHAT VIEW ---
  return (
    <div className="flex-1 flex flex-col h-screen bg-white overflow-hidden relative">
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-6 border-b border-gray-100 bg-white z-10 shrink-0">
        {/* Left: Model Selector (Replaces Project Alpha) */}
        <div className="flex items-center">
           <div className="relative">
              <button 
                onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                className="flex items-center space-x-2 text-gray-700 font-medium hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors focus:outline-none"
              >
                <span>{currentModelName}</span>
                <ChevronDown size={14} className="text-gray-400" />
              </button>
              
              {isModelDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-100 shadow-xl rounded-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                  {MODELS.map(model => (
                    <button
                      key={model.id}
                      onClick={() => {
                        onSelectModel(model.id);
                        setIsModelDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 focus:outline-none ${selectedModel === model.id ? 'bg-gray-50' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                          <span className={`font-medium text-sm ${selectedModel === model.id ? 'text-blue-600' : 'text-gray-900'}`}>{model.name}</span>
                          {selectedModel === model.id && <Check size={14} className="text-blue-600" />}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{model.description}</div>
                    </button>
                  ))}
                </div>
              )}
           </div>
        </div>

        {/* Right: Status Indicator */}
        <div className="flex items-center space-x-3">
           <div className={`flex items-center space-x-2 text-xs transition-colors ${status === AgentStatus.EXECUTING ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-2 h-2 rounded-full ${status === AgentStatus.EXECUTING ? 'bg-blue-600 animate-pulse' : 'bg-gray-300'}`}></div>
              <span className="font-medium uppercase tracking-wider">
                {status === AgentStatus.IDLE ? 'Idle' : status === AgentStatus.EXECUTING ? 'Running' : status === AgentStatus.PLANNING ? 'Planning' : 'Waiting'}
              </span>
           </div>
           {/* Also show profile dropdown in chat header for consistency */}
           <div className="pl-3 border-l border-gray-200">
               <UserProfileDropdown user={user} onOpenSettings={onOpenSettings} onLogout={onLogout} />
           </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 pb-32">
        
        <div className="max-w-3xl mx-auto space-y-8">
            {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                className={`max-w-2xl rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user' 
                    ? 'bg-[#F3F4F6] text-gray-900 rounded-br-sm shadow-sm px-5 py-4' 
                    : 'bg-transparent text-gray-800 w-full px-0 py-2 pl-0' 
                }`}
                >
                {msg.role === 'agent' && (
                    <div className="flex items-center space-x-2 mb-2">
                        <div className="w-5 h-5 bg-black rounded-md flex items-center justify-center">
                            <span className="text-[10px] text-white font-bold">N</span>
                        </div>
                        <span className="font-semibold text-gray-900">Nexa</span>
                    </div>
                )}
                
                <div className="prose prose-sm max-w-none text-gray-700 prose-p:leading-relaxed prose-pre:bg-transparent prose-pre:p-0 prose-pre:m-0 prose-pre:border-0">
                    <Markdown components={{ code: CodeBlock }}>
                    {msg.content}
                    </Markdown>
                </div>
                </div>
            </div>
            ))}

            {/* Dynamic Plan Visualization inserted into the stream */}
            {plan.length > 0 && (
                <div className="flex justify-start">
                    <div className="w-full">
                        <PlanVisualizer steps={plan} />
                    </div>
                </div>
            )}

            {/* Thinking Indicator */}
            {(status === AgentStatus.PLANNING || status === AgentStatus.EXECUTING) && (
                <div className="flex justify-start">
                    <div className="flex items-center space-x-3 px-0 py-1">
                        {/* Circular Loading Spinner - Transparent track with blue spinner */}
                         <div className="w-4 h-4 border-2 border-transparent border-t-blue-500 rounded-full animate-spin shrink-0"></div>
                        {/* Shimmer Text */}
                        <span className="text-sm font-medium bg-gradient-to-r from-gray-400 via-gray-800 to-gray-400 bg-[length:200%_auto] text-transparent bg-clip-text animate-shimmer">
                            Thinking...
                        </span>
                    </div>
                </div>
            )}
        </div>

        <div ref={endOfMessagesRef} />
      </div>

      {/* Input Area (Sticky Bottom) */}
      <div className="p-6 bg-white z-20">
         <ChatInput 
            input={input} 
            setInput={setInput} 
            onSend={onSend} 
            status={status}
            activeToolCall={activeToolCall}
            isSidePanelOpen={isSidePanelOpen}
            onOpenSidePanel={onOpenSidePanel}
         />
         <div className="text-center mt-6 text-[10px] text-gray-400">
             Nexa can make mistakes. Check important info.
         </div>
      </div>
    </div>
  );
};

export default AgentConsole;
