
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  LayoutDashboard, 
  Clock, 
  FolderOpen, 
  ChevronRight, 
  Settings, 
  LogOut, 
  User as UserIcon, 
  Mail, 
  Lock, 
  Loader2,
  Cpu,
  Save,
  Trash2,
  X,
  MessageSquare,
  PlusCircle,
  MoreHorizontal,
  Edit2,
  Star,
  ExternalLink,
  Shield,
  Palette,
  Globe
} from 'lucide-react';
import { AgentConfig } from '../App';
import { ChatSession, UserProfile } from '../types';

// --- Types & Interfaces ---

interface SidebarProps {
  config: AgentConfig;
  onUpdateConfig: (newConfig: AgentConfig) => void;
  onClearMemory: () => void;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onLoadSession: (id: string) => void;
  onNewTask: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, newName: string) => void;
  onToggleFavorite: (id: string) => void;
  user: UserProfile | null;
  onLogin: (user: UserProfile) => void;
  onLogout: () => void;
  isSettingsOpen: boolean;
  onCloseSettings: () => void;
  onOpenSettings: () => void;
}

// --- Sidebar Component ---

const Sidebar: React.FC<SidebarProps> = ({ 
  config, 
  onUpdateConfig, 
  onClearMemory, 
  sessions, 
  currentSessionId, 
  onLoadSession, 
  onNewTask,
  onDeleteSession,
  onRenameSession,
  onToggleFavorite,
  user,
  onLogin,
  onLogout,
  isSettingsOpen,
  onCloseSettings,
  onOpenSettings
}) => {
  // Auth State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  return (
    <>
      <div className="hidden md:flex flex-col w-64 h-screen bg-[#F9FAFB] border-r border-gray-200 shrink-0 z-20">
        {/* Header */}
        <div className="p-5 flex items-center space-x-2 border-b border-gray-100">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">N</span>
          </div>
          <span className="font-semibold text-gray-900 text-lg tracking-tight">Nexa</span>
        </div>

        {/* Main Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          <div className="space-y-1">
            <p className="px-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Workspace</p>
            <SidebarItem 
              icon={<PlusCircle size={18} />} 
              label="New Task" 
              onClick={onNewTask}
              active={currentSessionId === null} 
            />
            <SidebarItem icon={<FolderOpen size={18} />} label="Saved Files" />
          </div>

          {/* History Section */}
          <div className="space-y-1">
             <p className="px-3 text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">History</p>
             <div className="max-h-[calc(100vh-400px)] overflow-y-auto custom-scrollbar space-y-0.5 pb-10">
                {sessions.length === 0 ? (
                  <div className="px-3 text-xs text-gray-400 italic">No recent tasks</div>
                ) : (
                  sessions.map(session => (
                    <HistoryItem 
                      key={session.id}
                      session={session}
                      isActive={session.id === currentSessionId}
                      onClick={() => onLoadSession(session.id)}
                      onDelete={onDeleteSession}
                      onRename={onRenameSession}
                      onToggleFavorite={onToggleFavorite}
                    />
                  ))
                )}
             </div>
          </div>

           {/* Settings */}
          <div className="space-y-1 pt-4 border-t border-gray-100">
             <button
                onClick={onOpenSettings}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              >
                <div className="flex items-center space-x-3">
                  <span><Settings size={18} /></span>
                  <span>Settings</span>
                </div>
              </button>
          </div>
        </div>

        {/* Bottom User Section */}
        <div className="p-4 border-t border-gray-200 bg-[#F9FAFB]">
          {user ? (
            <div className="group relative">
               <div className="flex items-center space-x-3 hover:bg-gray-100 p-2 rounded-lg cursor-pointer transition-colors" onClick={onOpenSettings}>
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-xs font-medium text-white shadow-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.role}</p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); onLogout(); }}
                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                  title="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setIsAuthModalOpen(true)}
              className="w-full flex items-center justify-center space-x-2 bg-black text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-all shadow-sm"
            >
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* Auth Modal */}
      {isAuthModalOpen && (
        <AuthModal 
          onClose={() => setIsAuthModalOpen(false)} 
          onSuccess={(profile) => {
            onLogin(profile);
            setIsAuthModalOpen(false);
          }} 
        />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal 
          config={config} 
          user={user}
          onClose={onCloseSettings} 
          onSave={onUpdateConfig}
          onDeleteAccount={onLogout}
          onUpdateUser={onLogin}
        />
      )}
    </>
  );
};

// --- Sub-components ---

const SidebarItem: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all ${
      active
        ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200'
        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
    }`}
  >
    <div className="flex items-center space-x-3 overflow-hidden">
      <span className={`shrink-0 ${active ? 'text-gray-900' : 'text-gray-400'}`}>{icon}</span>
      <span className="truncate">{label}</span>
    </div>
    {active && <ChevronRight size={14} className="text-gray-400 shrink-0 ml-2" />}
  </button>
);

interface HistoryItemProps {
  session: ChatSession;
  isActive: boolean;
  onClick: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onToggleFavorite: (id: string) => void;
}

const HistoryItem: React.FC<HistoryItemProps> = ({ session, isActive, onClick, onDelete, onRename, onToggleFavorite }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(session.name);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Close menu on scroll or resize to prevent floating detatchment
    const handleScroll = () => setShowMenu(false);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isRenaming]);

  const handleMenuOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      // Calculate best position (right aligned, but check bottom edge)
      const top = rect.bottom + 5;
      const left = rect.right - 180; // Align right edge approx
      setMenuPos({ top, left: left > 0 ? left : 10 });
    }
    setShowMenu(!showMenu);
  };

  const handleRenameSubmit = () => {
    if (renameValue.trim()) {
      onRename(session.id, renameValue.trim());
    } else {
      setRenameValue(session.name);
    }
    setIsRenaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleRenameSubmit();
    if (e.key === 'Escape') {
      setRenameValue(session.name);
      setIsRenaming(false);
    }
  };

  return (
    <div className="group relative">
      {isRenaming ? (
        <div className="px-3 py-2">
          <input
            ref={inputRef}
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={handleKeyDown}
            className="w-full text-sm px-2 py-1 bg-white border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
      ) : (
        <button
          onClick={onClick}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all group ${
            isActive
              ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center space-x-3 overflow-hidden flex-1 min-w-0">
            <span className={`shrink-0 ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
               {session.isFavorite ? <Star size={16} fill="currentColor" className="text-yellow-400" /> : <MessageSquare size={16} />}
            </span>
            <span className="truncate text-left">{session.name}</span>
          </div>
          
          {/* Menu Trigger */}
          <div 
             ref={triggerRef}
             className={`ml-2 shrink-0 ${isActive || showMenu ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
             onClick={handleMenuOpen}
          >
             <div className={`p-1 rounded-md hover:bg-gray-200 ${showMenu ? 'bg-gray-200 text-gray-900' : 'text-gray-400'}`}>
                <MoreHorizontal size={14} />
             </div>
          </div>
        </button>
      )}

      {/* Dropdown Menu - Portal/Fixed to avoid clipping */}
      {showMenu && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-transparent" 
            onClick={() => setShowMenu(false)}
          />
          
          {/* Menu Content */}
          <div 
            className="fixed w-48 bg-white border border-gray-100 rounded-xl shadow-xl shadow-gray-200/50 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 p-1.5"
            style={{ top: menuPos.top, left: menuPos.left }}
          >
             <button 
                className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-medium text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  setIsRenaming(true);
                }}
             >
               <Edit2 size={14} className="text-gray-400" />
               <span>Rename</span>
             </button>
             <button className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-medium text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors" onClick={(e) => { 
               e.stopPropagation(); 
               setShowMenu(false);
               const url = new URL(window.location.href);
               url.searchParams.set('sessionId', session.id);
               window.open(url.toString(), '_blank');
             }}>
               <ExternalLink size={14} className="text-gray-400" />
               <span>Open in new tab</span>
             </button>
             
             <div className="h-px bg-gray-100 my-1 mx-2"></div>
             
             <button 
                className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(session.id);
                  setShowMenu(false);
                }}
             >
               <Trash2 size={14} />
               <span>Delete</span>
             </button>
          </div>
        </>
      )}
    </div>
  );
};

// --- Settings Modal ---

interface SettingsModalProps {
  config: AgentConfig;
  user: UserProfile | null;
  onClose: () => void;
  onSave: (config: AgentConfig) => void;
  onDeleteAccount: () => void;
  onUpdateUser: (user: UserProfile) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ config, user, onClose, onSave, onDeleteAccount, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<'account' | 'general'>('account');
  const [localConfig, setLocalConfig] = useState<AgentConfig>(config);
  const [localUser, setLocalUser] = useState<UserProfile | null>(user);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [isSaved, setIsSaved] = useState(false);

  // Initialize localUser when user prop changes
  useEffect(() => {
    setLocalUser(user);
  }, [user]);

  const handleSave = () => {
    onSave(localConfig);
    if (localUser && user) {
        onUpdateUser(localUser);
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[600px] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
           <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
             <Settings size={20} className="text-gray-500" />
             <span>Settings</span>
           </h2>
           <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
             <X size={18} />
           </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
           {/* Sidebar Tabs */}
           <div className="w-48 border-r border-gray-100 bg-gray-50/30 p-4 space-y-1">
              <button 
                onClick={() => setActiveTab('account')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'account' ? 'bg-white shadow-sm text-blue-600 ring-1 ring-gray-200' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <UserIcon size={16} />
                <span>Account</span>
              </button>
              <button 
                onClick={() => setActiveTab('general')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'general' ? 'bg-white shadow-sm text-blue-600 ring-1 ring-gray-200' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <LayoutDashboard size={16} />
                <span>General</span>
              </button>
           </div>

           {/* Content */}
           <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'account' && (
                <div className="space-y-8">
                   {!localUser ? (
                       <div className="text-center py-10 text-gray-500">
                           <p>You are currently browsing as a guest.</p>
                           <p className="text-xs mt-2">Sign in to manage your account settings.</p>
                       </div>
                   ) : (
                       <>
                        {/* Profile Section */}
                        <section className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">Profile</h3>
                            <div className="flex items-center space-x-4 mb-4">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-2xl font-bold text-white">
                                    {localUser.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <button className="text-xs text-blue-600 font-medium hover:underline">Change Avatar</button>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500">Full Name</label>
                                    <input 
                                        type="text" 
                                        value={localUser.name}
                                        onChange={(e) => setLocalUser({...localUser, name: e.target.value})}
                                        className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500">Email Address</label>
                                    <input 
                                        type="email" 
                                        value={localUser.email}
                                        onChange={(e) => setLocalUser({...localUser, email: e.target.value})}
                                        className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Security Section */}
                        <section className="space-y-4">
                             <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">Security</h3>
                             <div className="space-y-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-500">Current Password</label>
                                    <input type="password" placeholder="••••••••" className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-500">New Password</label>
                                        <input type="password" placeholder="••••••••" className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-500">Confirm Password</label>
                                        <input type="password" placeholder="••••••••" className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                                    </div>
                                </div>
                             </div>
                        </section>

                         {/* Danger Zone */}
                         <section className="pt-4 border-t border-red-100">
                             <h3 className="text-sm font-semibold text-red-600 uppercase tracking-wide mb-3">Danger Zone</h3>
                             <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100">
                                 <div>
                                     <h4 className="text-sm font-medium text-red-900">Delete Account</h4>
                                     <p className="text-xs text-red-500 mt-1">Permanently remove your account and all data.</p>
                                 </div>
                                 <button 
                                    onClick={() => {
                                        if(confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
                                            onDeleteAccount();
                                            onClose();
                                        }
                                    }}
                                    className="px-3 py-1.5 bg-white text-red-600 border border-red-200 rounded-md text-xs font-medium hover:bg-red-50 transition-colors"
                                 >
                                     Delete Account
                                 </button>
                             </div>
                         </section>
                       </>
                   )}
                </div>
              )}

              {activeTab === 'general' && (
                <div className="space-y-8">
                    {/* Appearance */}
                    <section className="space-y-4">
                         <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">Appearance</h3>
                         <div className="grid grid-cols-3 gap-3">
                             {['Light', 'Dark', 'System'].map((theme) => (
                                 <button 
                                    key={theme}
                                    onClick={() => setLocalConfig({...localConfig, theme: theme.toLowerCase() as any})}
                                    className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${localConfig.theme === theme.toLowerCase() ? 'border-blue-500 bg-blue-50/50' : 'border-gray-100 hover:border-gray-200'}`}
                                 >
                                     <div className={`w-full h-16 rounded mb-2 ${theme === 'Light' ? 'bg-gray-100' : theme === 'Dark' ? 'bg-gray-800' : 'bg-gradient-to-r from-gray-100 to-gray-800'}`}></div>
                                     <span className={`text-xs font-medium ${localConfig.theme === theme.toLowerCase() ? 'text-blue-700' : 'text-gray-600'}`}>{theme}</span>
                                 </button>
                             ))}
                         </div>
                    </section>
                    
                    {/* Language */}
                    <section className="space-y-4">
                         <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">Language</h3>
                         <div className="space-y-1">
                             <label className="text-xs font-medium text-gray-500">Interface Language</label>
                             <div className="relative">
                                 <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                 <select 
                                    value={localConfig.language}
                                    onChange={(e) => setLocalConfig({...localConfig, language: e.target.value})}
                                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none appearance-none"
                                 >
                                     <option value="English">English</option>
                                     <option value="Spanish">Spanish (Español)</option>
                                     <option value="French">French (Français)</option>
                                     <option value="German">German (Deutsch)</option>
                                     <option value="Japanese">Japanese (日本語)</option>
                                 </select>
                             </div>
                         </div>
                    </section>

                    {/* AI Preferences */}
                    <section className="space-y-4">
                         <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">AI Preferences</h3>
                         
                         <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">AI Model</label>
                            <p className="text-xs text-gray-500 mb-3">Select the model to use for your AI agent.</p>
                            <div className="space-y-2">
                                <label className="flex items-center space-x-3 p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                    <input 
                                        type="radio" 
                                        name="model" 
                                        value="fast"
                                        checked={(localConfig as any).modelMode === 'fast'}
                                        onChange={(e) => setLocalConfig({...localConfig, modelMode: e.target.value as any})}
                                        className="w-4 h-4"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-gray-900">Gemini 2.5 Flash (Fast)</div>
                                        <div className="text-xs text-gray-500">Quick responses, everyday tasks</div>
                                    </div>
                                </label>
                                <label className="flex items-center space-x-3 p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                    <input 
                                        type="radio" 
                                        name="model" 
                                        value="max"
                                        checked={(localConfig as any).modelMode === 'max'}
                                        onChange={(e) => setLocalConfig({...localConfig, modelMode: e.target.value as any})}
                                        className="w-4 h-4"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-gray-900">Gemini 2.0 Flash</div>
                                        <div className="text-xs text-gray-500">Fast & efficient reasoning</div>
                                    </div>
                                </label>
                            </div>
                         </div>
                         
                         <div>
                            <label className="block text-sm font-medium text-gray-900 mb-2">Agent Persona (System Instructions)</label>
                            <p className="text-xs text-gray-500 mb-3">Define the behavior and personality of your AI agent.</p>
                            <textarea 
                                className="w-full h-32 p-3 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black/5 focus:border-black focus:outline-none resize-none font-mono leading-relaxed"
                                value={localConfig.systemInstruction}
                                onChange={(e) => setLocalConfig({...localConfig, systemInstruction: e.target.value})}
                            />
                         </div>

                         <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-gray-900">Creativity (Temperature)</label>
                                <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">{localConfig.temperature}</span>
                            </div>
                            <input 
                                type="range" 
                                min="0" 
                                max="2" 
                                step="0.1"
                                value={localConfig.temperature}
                                onChange={(e) => setLocalConfig({...localConfig, temperature: parseFloat(e.target.value)})}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                            />
                            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                                <span>Precise</span>
                                <span>Balanced</span>
                                <span>Creative</span>
                            </div>
                         </div>
                    </section>
                </div>
              )}
           </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end space-x-3">
           <button 
             onClick={onClose}
             className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
           >
             Cancel
           </button>
           <button 
             onClick={handleSave}
             className="flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm"
           >
             {isSaved ? <span className="text-green-400">Saved!</span> : <span>Save Changes</span>}
           </button>
        </div>
      </div>
    </div>
  );
};

// --- Authentication Modal ---

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose, onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Mock Simulation
    setTimeout(() => {
      // Email Validation
      if (!email.includes('@')) {
         setError("Email is missing the '@' symbol.");
         setIsLoading(false);
         return;
      }

      const profile: UserProfile = {
        name: isLogin ? 'Test User' : name || 'New User',
        email: email,
        role: 'Administrator'
      };
      
      setIsLoading(false);
      onSuccess(profile);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-8">
          <div className="text-center mb-8">
             <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-gray-200">
                <span className="text-white font-bold text-xl">N</span>
             </div>
             <h2 className="text-2xl font-bold text-gray-900">
               {isLogin ? 'Welcome back' : 'Create an account'}
             </h2>
             <p className="text-gray-500 mt-2 text-sm">
               {isLogin ? 'Enter your credentials to access the workspace.' : 'Get started with your AI agent today.'}
             </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black/5 focus:border-black focus:outline-none transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black/5 focus:border-black focus:outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black/5 focus:border-black focus:outline-none transition-all"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg flex items-center animate-pulse">
                <span className="font-medium mr-1">Error:</span> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black text-white py-2.5 rounded-lg font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={18} />
                  Processing...
                </>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button 
                onClick={() => {
                   setIsLogin(!isLogin);
                   setError('');
                   setEmail('');
                   setPassword('');
                }}
                className="font-medium text-black hover:underline focus:outline-none"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
