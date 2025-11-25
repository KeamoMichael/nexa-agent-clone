
import React, { useState, useEffect } from 'react';
import { PlanStep, PlanAction } from '../types';
import { 
  CheckCircle2, 
  Circle, 
  Loader2, 
  ChevronDown, 
  ChevronRight, 
  Terminal, 
  FileText, 
  Info,
  AlertCircle
} from 'lucide-react';

interface PlanVisualizerProps {
  steps: PlanStep[];
}

const PlanVisualizer: React.FC<PlanVisualizerProps> = ({ steps }) => {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  // Auto-expand active or recently completed steps
  useEffect(() => {
    const newExpanded = new Set(expandedSteps);
    steps.forEach(step => {
      if (step.status === 'active') {
        newExpanded.add(step.id);
      }
    });
    setExpandedSteps(newExpanded);
  }, [steps]);

  const toggleStep = (id: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedSteps(newExpanded);
  };

  if (steps.length === 0) return null;

  return (
    <div className="mb-8 w-full">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-black animate-pulse"></div>
          Execution Plan
        </h4>
        <span className="text-xs text-gray-400 font-mono">
          {steps.filter(s => s.status === 'completed').length}/{steps.length} Steps
        </span>
      </div>
      
      <div className="space-y-3 relative">
        {/* Connector Line */}
        <div className="absolute left-[19px] top-4 bottom-4 w-px bg-gray-200 z-0"></div>
        
        {steps.map((step, index) => {
          const isExpanded = expandedSteps.has(step.id);
          const isActive = step.status === 'active';
          const isCompleted = step.status === 'completed';
          
          let StatusIcon = Circle;
          let iconColor = "text-gray-300";
          let ringColor = "ring-gray-100";
          let bgColor = "bg-white";

          if (isCompleted) {
            StatusIcon = CheckCircle2;
            iconColor = "text-green-500";
            ringColor = "ring-green-50";
            bgColor = "bg-green-50/10";
          } else if (isActive) {
            StatusIcon = Loader2;
            iconColor = "text-blue-600";
            ringColor = "ring-blue-100";
            bgColor = "bg-blue-50/10";
          }

          return (
            <div 
              key={step.id} 
              className={`relative z-10 rounded-xl border transition-all duration-300 overflow-hidden group ${
                isActive ? 'border-blue-200 shadow-sm bg-white' : 
                isCompleted ? 'border-gray-200 bg-gray-50/30' : 
                'border-transparent hover:border-gray-100 bg-transparent'
              }`}
            >
              {/* Step Header */}
              <div 
                onClick={() => toggleStep(step.id)}
                className="flex items-start p-3 cursor-pointer select-none"
              >
                {/* Icon Wrapper */}
                <div className={`mt-0.5 mr-3 p-1 rounded-full bg-white ring-4 ${ringColor} transition-all`}>
                  <StatusIcon 
                    size={18} 
                    className={`${iconColor} ${isActive ? 'animate-spin' : ''}`} 
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h5 className={`text-sm font-medium transition-colors ${
                      isActive ? 'text-blue-700' : 
                      isCompleted ? 'text-gray-700' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </h5>
                    {step.actions && step.actions.length > 0 && (
                      <span className="text-gray-400 hover:text-gray-600 transition-colors">
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </span>
                    )}
                  </div>
                  
                  {step.description && (
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions / Logs Area */}
              {isExpanded && step.actions && step.actions.length > 0 && (
                <div className="px-3 pb-3 pl-[3.25rem] space-y-2 animate-in slide-in-from-top-2 fade-in duration-200">
                  {step.actions.map((action) => (
                    <ActionItem key={action.id} action={action} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ActionItem: React.FC<{ action: PlanAction }> = ({ action }) => {
  const isCommand = action.type === 'command';
  const isFile = action.type === 'file';
  
  return (
    <div className={`
      flex items-center gap-3 p-2.5 rounded-lg text-xs font-mono border shadow-sm transition-all
      ${isCommand 
        ? 'bg-[#1e1e1e] border-[#333] text-gray-300' // Terminal Dark Style
        : 'bg-white border-gray-200 text-gray-600'   // Default Light Style
      }
    `}>
      <div className={`shrink-0 ${isCommand ? 'text-green-500' : 'text-blue-500'}`}>
        {isCommand && <Terminal size={14} />}
        {isFile && <FileText size={14} />}
        {action.type === 'info' && <Info size={14} />}
        {action.type === 'output' && <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />}
      </div>
      
      <div className="flex-1 min-w-0 truncate">
        {isCommand && <span className="text-gray-500 mr-2 select-none">$</span>}
        <span className={isCommand ? 'text-gray-100' : ''}>{action.content}</span>
      </div>

      {action.status === 'running' && (
        <Loader2 size={12} className="animate-spin text-gray-500 shrink-0" />
      )}
    </div>
  );
};

export default PlanVisualizer;
