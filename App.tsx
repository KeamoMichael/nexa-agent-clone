
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import AgentConsole from './components/AgentConsole';
import ToolPanel from './components/ToolPanel';
import { Message, PlanStep, AgentStatus, ToolCall, FileData, ChatSession, UserProfile, PlanAction } from './types';
import { initializeGemini, createChatSession, DEFAULT_SYSTEM_INSTRUCTION, generateChatTitle } from './services/geminiService';
import { v4 as uuidv4 } from 'uuid'; 

// Simple ID generator fallback if uuid fails or for consistency
const generateId = () => Math.random().toString(36).substring(2, 15);

export interface AgentConfig {
  temperature: number;
  systemInstruction: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  modelMode: 'fast' | 'max';
}

const App: React.FC = () => {
  // Session Management State
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem('nexa_sessions');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load sessions from local storage", e);
      return [];
    }
  });

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Active Session State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<AgentStatus>(AgentStatus.IDLE);
  const [plan, setPlan] = useState<PlanStep[]>([]);
  const [activeToolCall, setActiveToolCall] = useState<ToolCall | null>(null);
  const [fileSystem, setFileSystem] = useState<FileData[]>([]);
  const [lastWebContent, setLastWebContent] = useState<{title: string, url: string, content: string} | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [isPanelCentered, setIsPanelCentered] = useState(false);
  
  // User & Settings State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Agent Configuration State
  const [agentConfig, setAgentConfig] = useState<AgentConfig>({
    temperature: 0.7,
    systemInstruction: DEFAULT_SYSTEM_INSTRUCTION,
    theme: 'light',
    language: 'English',
    modelMode: 'fast'
  });
  
  // Layout State
  const [panelWidth, setPanelWidth] = useState(500); // Initial width in pixels
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Refs
  const chatSessionRef = useRef<any>(null);

  // Persistence Effect
  useEffect(() => {
    localStorage.setItem('nexa_sessions', JSON.stringify(sessions));
  }, [sessions]);

  // Sync messages to current session if it exists
  useEffect(() => {
    if (currentSessionId) {
      setSessions(prev => prev.map(s => 
        s.id === currentSessionId ? { ...s, messages: messages } : s
      ));
    }
  }, [messages, currentSessionId]);

  const initChatSession = async (modelName: string, historyMessages: Message[]) => {
    const ai = initializeGemini();
    if (ai) {
      // Map Message objects to Gemini SDK Content format
      const history = historyMessages.map(msg => ({
        role: msg.role === 'agent' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      // Pass dynamic configuration and history to the session creator
      chatSessionRef.current = await createChatSession(
          ai, 
          modelName, 
          agentConfig.systemInstruction, 
          agentConfig.temperature,
          history
      );
    }
  };

  const handleLoadSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      setMessages(session.messages);
      setStatus(AgentStatus.IDLE); // Ensure status is reset so input isn't disabled
      
      // We clear execution artifacts when switching context as they aren't persisted in this demo
      setPlan([]); 
      setFileSystem([]);
      setLastWebContent(null);
      setActiveToolCall(null);
      setIsSidePanelOpen(false); // Reset side panel for fresh context
      
      // Initialize API session with the loaded history so context is preserved
      initChatSession(selectedModel, session.messages); 
    }
  };

  // Initialize Gemini & Check API Key & URL Params
  useEffect(() => {
    const checkKeyAndInit = async () => {
      let keyExists = false;
      if (window.aistudio) {
        keyExists = await window.aistudio.hasSelectedApiKey();
      } else {
        keyExists = true;
      }
      
      setHasApiKey(keyExists);

      if (keyExists) {
         // Check for sessionId in URL
         const params = new URLSearchParams(window.location.search);
         const sid = params.get('sessionId');
         if (sid) {
             const sessionExists = sessions.find(s => s.id === sid);
             if (sessionExists) {
                 handleLoadSession(sid);
             } else {
                 initChatSession(selectedModel, []);
             }
         } else {
             initChatSession(selectedModel, []);
         }
      }
    };
    checkKeyAndInit();
  }, []); // Run once on mount, access initial sessions state

  const handleNewTask = () => {
    // When creating a new task, we reset the console to the "Home" state
    setCurrentSessionId(null);
    setMessages([]);
    setPlan([]);
    setFileSystem([]);
    setLastWebContent(null);
    setStatus(AgentStatus.IDLE);
    setActiveToolCall(null);
    setIsSidePanelOpen(false);
    setIsPanelCentered(false);
    setInput('');
    chatSessionRef.current = null;
    
    // Start a fresh API session with no history
    initChatSession(selectedModel, []); 
  };

  const handleDeleteSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      handleNewTask();
    }
  };

  const handleRenameSession = (sessionId: string, newName: string) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, name: newName } : s));
  };

  const handleToggleFavorite = (sessionId: string) => {
     setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, isFavorite: !s.isFavorite } : s));
  };

  const handleUpdateConfig = (newConfig: AgentConfig) => {
    setAgentConfig(newConfig);
    // Re-init with new config BUT preserve current message history
    // This allows the user to change settings (e.g., make agent more creative) 
    // in the middle of a chat without losing context.
    // If the user selected a model mode, map it to a concrete model id.
    const modeModelMap: Record<string, string> = {
      fast: 'gemini-2.5-flash',
      max: 'gemini-2.0-flash'
    };

    const targetModel = (newConfig.modelMode && modeModelMap[newConfig.modelMode]) ? modeModelMap[newConfig.modelMode] : selectedModel;
    setSelectedModel(targetModel);
    initChatSession(targetModel, messages);
  };

  const handleSelectKey = async () => {
    if (window.aistudio) {
      try {
        await window.aistudio.openSelectKey();
        setHasApiKey(true);
        await initChatSession(selectedModel, messages);
      } catch (e) {
        console.error("Failed to select key", e);
      }
    }
  };

  const handleModelChange = (newModel: string) => {
    setSelectedModel(newModel);
    initChatSession(newModel, messages);
  };

  // --- Resizing Logic ---
  const startResizing = useCallback(() => {
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none'; // Prevent text selection
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        // Calculate width from the right edge
        const newWidth = containerRect.right - e.clientX;
        
        // Constraints (Min 300px, Max container width - 300px for chat)
        if (newWidth > 300 && newWidth < containerRect.width - 100) {
            setPanelWidth(newWidth);
        }
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
        window.addEventListener('mousemove', resize);
        window.addEventListener('mouseup', stopResizing);
    }
    return () => {
        window.removeEventListener('mousemove', resize);
        window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  // Derived state for sidebar visibility based on stretch
  // If panel width takes up more than 70% of available window width, hide sidebar
  const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const isSidebarVisible = !isSidePanelOpen || isPanelCentered || (panelWidth < (windowWidth * 0.7));

  // Helper to add action to active step
  const addActionToActiveStep = (action: Omit<PlanAction, 'id' | 'timestamp'>) => {
    setPlan(prevPlan => {
      const activeIndex = prevPlan.findIndex(p => p.status === 'active' || p.status === 'pending');
      // If no active/pending step found, or plan is empty, do nothing
      if (activeIndex === -1) return prevPlan;

      const newPlan = [...prevPlan];
      // If the first found is pending, make it active
      if (newPlan[activeIndex].status === 'pending') {
          newPlan[activeIndex].status = 'active';
      }

      const newAction: PlanAction = {
          id: generateId(),
          timestamp: Date.now(),
          ...action
      };

      const currentActions = newPlan[activeIndex].actions || [];
      newPlan[activeIndex].actions = [...currentActions, newAction];
      
      return newPlan;
    });
  };

  // Helper to execute tools locally (Simulation)
  const executeTool = async (name: string, args: any): Promise<any> => {
    
    if (name === 'create_plan') {
      const newPlan = args.steps.map((s: any) => ({
        id: generateId(),
        title: s.title,
        description: s.description,
        status: 'pending',
        actions: []
      }));
      setPlan(newPlan);
      return { status: "Plan created successfully. Proceed to execute steps." };
    }

    if (name === 'web_search') {
        // Visual Simulation
        addActionToActiveStep({ type: 'command', content: `Searching Google for: "${args.query}"`, status: 'running' });
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Open side panel
        setIsSidePanelOpen(true);
        if (!isSidePanelOpen && !isPanelCentered) setPanelWidth(window.innerWidth * 0.45);

        addActionToActiveStep({ type: 'info', content: `Found 3 relevant results`, status: 'completed' });
        await new Promise(resolve => setTimeout(resolve, 500));

        return {
            results: [
                { title: `${args.query} - Official Documentation`, snippet: "Comprehensive guide and documentation...", url: "https://docs.example.com" },
                { title: `Latest news on ${args.query}`, snippet: "Breaking news and updates regarding...", url: "https://news.example.com/article" },
                { title: `${args.query} Tutorial`, snippet: "Step by step tutorial for beginners...", url: "https://tutorial.example.com" }
            ]
        };
    }

    if (name === 'visit_page') {
        addActionToActiveStep({ type: 'command', content: `curl ${args.url}`, status: 'running' });
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const content = `
# Content from ${args.url}

This is a simulated page content for the URL provided.
It contains relevant information regarding the user's query.

## Section 1: Overview
The topic discussed is complex and involves multiple factors.

## Section 2: Technical Details
- Point A: Critical data
- Point B: Secondary data

(End of scraped content)
        `;
        setLastWebContent({
            title: "Simulated Web Page",
            url: args.url,
            content: content.trim()
        });
        
        setIsSidePanelOpen(true);
        addActionToActiveStep({ type: 'file', content: `parsed content from ${args.url}`, status: 'completed' });

        // Auto complete the step after visiting
        setPlan(prev => {
            const activeIdx = prev.findIndex(p => p.status === 'active');
            if (activeIdx === -1) return prev;
            const copy = [...prev];
            copy[activeIdx].status = 'completed';
            return copy;
        });

        return { content };
    }

    if (name === 'write_code') {
        addActionToActiveStep({ type: 'command', content: `cat > ${args.filename} << 'EOF' ...`, status: 'running' });
        await new Promise(resolve => setTimeout(resolve, 800));

        const newFile = {
            name: args.filename,
            language: 'python',
            content: args.code
        };
        setFileSystem(prev => [...prev, newFile]);
        
        setIsSidePanelOpen(true);
        if (!isSidePanelOpen && !isPanelCentered) setPanelWidth(window.innerWidth * 0.45);
        
        addActionToActiveStep({ type: 'file', content: `Created file: ${args.filename}`, status: 'completed' });
        await new Promise(resolve => setTimeout(resolve, 800));

        addActionToActiveStep({ type: 'command', content: `python3 ${args.filename}`, status: 'running' });
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        addActionToActiveStep({ type: 'output', content: `Process exited with code 0`, status: 'completed' });

        setPlan(prev => {
             const activeIdx = prev.findIndex(p => p.status === 'active');
             if (activeIdx === -1) return prev;
             const copy = [...prev];
             copy[activeIdx].status = 'completed';
             return copy;
         });

        return { stdout: "Process exited with code 0.\nOutput generated successfully." };
    }

    return { error: "Unknown tool" };
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    // Ensure we have a session
    if (!chatSessionRef.current) {
        await initChatSession(selectedModel, messages);
        if (!chatSessionRef.current) {
             if (!hasApiKey && window.aistudio) {
                 handleSelectKey();
                 return;
             }
        }
    }

    // Capture initial input for title generation BEFORE clearing it
    const initialInput = input;
    const isNewSession = currentSessionId === null;
    
    // If it's a new session, create it now
    let activeSessionId = currentSessionId;
    if (isNewSession) {
        activeSessionId = generateId();
        setCurrentSessionId(activeSessionId);
        
        const newSession: ChatSession = {
            id: activeSessionId,
            name: 'New Task', // Placeholder, updated async
            messages: [],
            createdAt: Date.now()
        };
        setSessions(prev => [newSession, ...prev]);
        
        // Generate creative title in background using the selected model
        const ai = initializeGemini();
        if (ai) {
             generateChatTitle(ai, initialInput, selectedModel).then(title => {
                 setSessions(prev => prev.map(s => 
                    s.id === activeSessionId ? { ...s, name: title } : s
                 ));
             });
        }
    }

    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setStatus(AgentStatus.PLANNING); 

    try {
      if (!chatSessionRef.current) throw new Error("Agent session not initialized");

      let response = await chatSessionRef.current.sendMessage({ message: userMsg.content });
      
      let candidates = response.candidates;
      let textResponse = response.text;
      
      if (textResponse) {
          const agentMsg: Message = {
            id: generateId(),
            role: 'agent',
            content: textResponse,
            timestamp: Date.now()
          };
          setMessages(prev => [...prev, agentMsg]);
      }

      let functionCalls = candidates?.[0]?.content?.parts?.filter((part: any) => part.functionCall).map((part: any) => part.functionCall);

      while (functionCalls && functionCalls.length > 0) {
        setStatus(AgentStatus.EXECUTING);
        
        const functionResponses = [];
        
        for (const call of functionCalls) {
            const toolCallData: ToolCall = {
                id: generateId(),
                toolName: call.name,
                args: call.args,
                status: 'running'
            };
            setActiveToolCall(toolCallData);

            const result = await executeTool(call.name, call.args);
            
            functionResponses.push({
                functionResponse: {
                    name: call.name,
                    response: { result: result } 
                }
            });

            setActiveToolCall(null);
        }

        response = await chatSessionRef.current.sendMessage({ message: functionResponses });
        candidates = response.candidates;
        textResponse = response.text;

        if (textResponse) {
             setMessages(prev => [...prev, {
                id: generateId(),
                role: 'agent',
                content: textResponse,
                timestamp: Date.now()
             }]);
        }
        
        functionCalls = candidates?.[0]?.content?.parts?.filter((part: any) => part.functionCall).map((part: any) => part.functionCall);
      }

    } catch (error: any) {
      console.error("Error in agent loop:", error);
      
      const errMsg = error.message || JSON.stringify(error);
      if (errMsg.includes("Requested entity was not found") || errMsg.includes("API key")) {
          setHasApiKey(false);
          setMessages(prev => [...prev, {
              id: generateId(),
              role: 'agent',
              content: "Authentication failed. Please select a valid API Key to continue.",
              timestamp: Date.now()
          }]);
      } else {
          setMessages(prev => [...prev, {
              id: generateId(),
              role: 'agent',
              content: "I encountered an error while processing your request. Please check your API Key or try again.",
              timestamp: Date.now()
          }]);
      }
    } finally {
      setStatus(AgentStatus.IDLE);
    }
  };

  return (
    <div className="flex h-screen bg-[#FFFFFF] text-gray-900 font-sans overflow-hidden relative" ref={containerRef}>
      
      {/* Background/Main Layout - Blurred when centered */}
      <div className={`flex flex-1 h-full overflow-hidden transition-all duration-300 ${isPanelCentered ? 'filter blur-[2px] scale-[0.99] opacity-80' : ''}`}>
        {isSidebarVisible && (
            <Sidebar 
                config={agentConfig} 
                onUpdateConfig={handleUpdateConfig}
                onClearMemory={() => {
                    setMessages([]);
                    setPlan([]);
                }}
                sessions={sessions}
                currentSessionId={currentSessionId}
                onLoadSession={handleLoadSession}
                onNewTask={handleNewTask}
                onDeleteSession={handleDeleteSession}
                onRenameSession={handleRenameSession}
                onToggleFavorite={handleToggleFavorite}
                user={user}
                onLogin={setUser}
                onLogout={() => setUser(null)}
                isSettingsOpen={isSettingsOpen}
                onCloseSettings={() => setIsSettingsOpen(false)}
                onOpenSettings={() => setIsSettingsOpen(true)}
            />
        )}
        
        <div className="flex-1 flex min-w-0">
            <div className="flex-1 flex flex-col relative min-w-0">
                {!hasApiKey && window.aistudio && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 text-center">
                        <div className="max-w-md p-6 bg-white shadow-xl rounded-2xl border border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900 mb-2">API Key Required</h2>
                            <p className="text-gray-500 mb-6">Connect your Google AI Studio account to start using Nexa.</p>
                            <button 
                                onClick={handleSelectKey}
                                className="px-5 py-2.5 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
                            >
                                Connect API Key
                            </button>
                            <p className="mt-4 text-xs text-gray-400">
                                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">
                                    Billing information
                                </a>
                            </p>
                        </div>
                    </div>
                )}
                
                <AgentConsole 
                  messages={messages}
                  plan={plan}
                  status={status}
                  input={input}
                  setInput={setInput}
                  onSend={handleSend}
                  selectedModel={selectedModel}
                  onSelectModel={handleModelChange}
                  fileSystem={fileSystem}
                  activeToolCall={activeToolCall}
                  isSidePanelOpen={isSidePanelOpen}
                  onOpenSidePanel={() => {
                      setIsSidePanelOpen(true);
                      if (!isPanelCentered) setPanelWidth(window.innerWidth * 0.45);
                  }}
                  user={user}
                  onOpenSettings={() => setIsSettingsOpen(true)}
                  onLogin={() => {
                      // Trigger auth modal via sidebar logic (or handle globally)
                      // For now, let's just trigger settings if logged out, or sidebar handles auth
                      // Ideally App should handle auth trigger, but Sidebar owns AuthModal. 
                      // For simplicity, AgentConsole profile click will open Settings, 
                      // where we can handle auth or just show disconnected state.
                  }}
                  onLogout={() => setUser(null)}
                />
            </div>

            {/* Split View Panel */}
            {isSidePanelOpen && !isPanelCentered && (
                <>
                  <div 
                      onMouseDown={startResizing}
                      className={`w-4 -ml-2 z-20 cursor-col-resize flex flex-col justify-center items-center group bg-transparent hover:bg-transparent ${isResizing ? 'bg-transparent' : ''}`}
                      title="Drag to resize"
                  >
                      <div className="h-8 w-1 rounded-full bg-gray-200 group-hover:bg-blue-400 transition-colors"></div>
                  </div>
                  
                  <div style={{ width: panelWidth }} className="shrink-0 h-full flex flex-col min-w-[320px]">
                      <ToolPanel 
                          activeToolCall={activeToolCall}
                          fileSystem={fileSystem}
                          lastWebContent={lastWebContent}
                          onClose={() => setIsSidePanelOpen(false)}
                          isCentered={false}
                          onToggleCenter={() => setIsPanelCentered(true)}
                      />
                  </div>
                </>
            )}
        </div>
      </div>

      {/* Centered Modal Overlay */}
      {isSidePanelOpen && isPanelCentered && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-8 bg-black/10 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="w-full max-w-6xl h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col animate-in zoom-in-95 duration-300">
               <ToolPanel 
                    activeToolCall={activeToolCall}
                    fileSystem={fileSystem}
                    lastWebContent={lastWebContent}
                    onClose={() => setIsSidePanelOpen(false)}
                    isCentered={true}
                    onToggleCenter={() => setIsPanelCentered(false)}
                />
           </div>
        </div>
      )}

    </div>
  );
};

export default App;
