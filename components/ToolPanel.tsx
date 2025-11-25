import React from 'react';
import { ToolCall, FileData } from '../types';
import { Globe, Code, X, RefreshCw, PanelRightClose, Monitor, AppWindow, PanelRightOpen } from 'lucide-react';

interface ToolPanelProps {
  activeToolCall: ToolCall | null;
  fileSystem: FileData[];
  lastWebContent: { title: string; url: string; content: string } | null;
  onClose?: () => void;
  isCentered?: boolean;
  onToggleCenter?: () => void;
}

const ToolPanel: React.FC<ToolPanelProps> = ({ activeToolCall, fileSystem, lastWebContent, onClose, isCentered, onToggleCenter }) => {
  // Determine what to show based on tool type or last state
  const renderContent = () => {
    if (activeToolCall?.status === 'running') {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
          <div className="relative">
            <div className="w-10 h-10 rounded-full border-2 border-gray-100 border-t-blue-500 animate-spin"></div>
          </div>
          <div className="text-sm font-medium text-gray-600 animate-pulse text-center px-4">
            {activeToolCall.toolName === 'web_search' && 'Searching the web...'}
            {activeToolCall.toolName === 'visit_page' && 'Accessing URL...'}
            {activeToolCall.toolName === 'write_code' && 'Executing code...'}
            {!['web_search', 'visit_page', 'write_code'].includes(activeToolCall.toolName) && 'Processing...'}
          </div>
        </div>
      );
    }

    if (fileSystem.length > 0 && (!activeToolCall || activeToolCall.toolName === 'write_code')) {
        const file = fileSystem[fileSystem.length - 1];
        return (
             <div className="flex flex-col h-full bg-[#1e1e1e] text-gray-300 font-mono text-sm">
                <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#333]">
                    <div className="flex items-center space-x-2">
                        <Code size={14} className="text-blue-400" />
                        <span className="text-white text-xs">{file.name}</span>
                    </div>
                    <span className="text-[10px] text-gray-500">Python 3.10</span>
                </div>
                <div className="p-4 overflow-auto whitespace-pre flex-1 custom-scrollbar">
                    {file.content}
                </div>
                <div className="bg-[#252526] p-3 border-t border-[#333]">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Console Output</div>
                    <div className="text-green-400 text-xs">$ python {file.name}</div>
                    <div className="text-gray-400 text-xs mt-1">
                        Execution complete. Output generated.<br/>
                        {`> Process finished with exit code 0`}
                    </div>
                </div>
            </div>
        )
    }

    if (lastWebContent) {
      return (
        <div className="flex flex-col h-full bg-white">
          <div className="flex items-center space-x-2 px-4 py-3 border-b border-gray-100 bg-gray-50/50">
            <div className="flex-1 ml-0 bg-white border border-gray-200 rounded-md px-3 py-1.5 flex items-center justify-between shadow-sm">
                 <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <Globe size={12} className="text-gray-400 shrink-0" />
                    <div className="text-xs text-gray-600 truncate font-mono">{lastWebContent.url}</div>
                 </div>
                 <div className="flex items-center space-x-2">
                    <RefreshCw size={10} className="text-gray-400 cursor-pointer hover:text-gray-600" />
                 </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 prose prose-sm max-w-none">
            <h1 className="text-xl font-bold text-gray-900 mb-4">{lastWebContent.title}</h1>
            <div className="text-gray-700 whitespace-pre-wrap font-sans">
              {lastWebContent.content}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-gray-50/30">
        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-3 border border-gray-200 shadow-sm">
            <LayoutDashboardIcon />
        </div>
        <p className="text-sm font-medium text-gray-500">Sandbox Ready</p>
        <p className="text-xs mt-1 text-gray-400 text-center px-6">Web browsing and code execution results will appear here</p>
      </div>
    );
  };

  return (
    <div className={`h-full flex flex-col bg-white overflow-hidden ${isCentered ? '' : 'border-l border-gray-200 shadow-xl'}`}>
      {/* Browser-like Header */}
      <div className="h-10 flex items-center justify-between px-3 bg-[#F3F4F6] border-b border-gray-200 shrink-0">
         <div className="flex items-center space-x-2">
            <div className="flex space-x-1.5 group mr-2">
                 {/* Visual traffic lights */}
                <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
            </div>
            
            <div className="flex items-center space-x-1.5 text-xs text-gray-500 font-medium">
                <Globe size={12} />
                <span>Nexa Sandbox</span>
            </div>
         </div>
         
         <div className="flex items-center space-x-1">
            {/* View Mode Controls */}
            
            {/* 1st Icon: Monitor (Visual Placeholder/Menu) */}
            <button className="p-1.5 hover:bg-gray-200 rounded-md text-gray-500 transition-colors" title="Display Options">
                <Monitor size={14} />
            </button>

            {/* 2nd Icon: Center/Side Toggle */}
            <button 
                onClick={onToggleCenter}
                className="p-1.5 hover:bg-gray-200 rounded-md text-gray-500 transition-colors"
                title={isCentered ? "Dock to Side View" : "Center View"}
            >
                {isCentered ? <PanelRightOpen size={14} /> : <AppWindow size={14} />}
            </button>
            
            <div className="h-3 w-[1px] bg-gray-300 mx-1"></div>

            {/* 3rd Icon: Close */}
            <button 
                onClick={onClose} 
                className="p-1.5 hover:bg-red-100 hover:text-red-500 rounded-md text-gray-500 transition-colors"
                title="Close Panel"
            >
                <X size={14} />
            </button>
         </div>
      </div>

      <div className="flex-1 bg-white relative overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
};

const LayoutDashboardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="9" y1="3" x2="9" y2="21"></line>
    <line x1="3" y1="9" x2="21" y2="9"></line>
  </svg>
)

export default ToolPanel;