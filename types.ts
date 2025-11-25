
export enum AgentStatus {
  IDLE = 'IDLE',
  PLANNING = 'PLANNING',
  EXECUTING = 'EXECUTING',
  WAITING_USER = 'WAITING_USER',
  FINISHED = 'FINISHED',
}

export interface Message {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: number;
  isThinking?: boolean;
}

export interface PlanAction {
  id: string;
  type: 'command' | 'file' | 'info' | 'output';
  content: string;
  status: 'running' | 'completed' | 'failed';
  timestamp: number;
}

export interface PlanStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  actions?: PlanAction[];
  isExpanded?: boolean;
}

export interface ToolCall {
  id: string;
  toolName: string;
  args: Record<string, any>;
  result?: any;
  status: 'running' | 'completed' | 'failed';
}

export interface AgentState {
  status: AgentStatus;
  currentPlan: PlanStep[];
  activeToolCall: ToolCall | null;
}

export enum ToolType {
  BROWSER = 'browser',
  CODE_EDITOR = 'code_editor',
  FILE_VIEWER = 'file_viewer',
  DATA_TABLE = 'data_table',
}

export interface FileData {
  name: string;
  language: string;
  content: string;
}

export interface ChatSession {
  id: string;
  name: string;
  messages: Message[];
  createdAt: number;
  isFavorite?: boolean;
}

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  avatar?: string;
}
