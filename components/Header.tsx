import React, { useRef } from 'react';
import { Layers, Moon, Sun, Layout, Github, Plus, FolderOpen, Edit2, Trash2, FileUp, UserCircle, LogOut, Palette } from 'lucide-react';
import { Button } from './ui/Button';
import { Space, User } from '../types';
import { THEMES } from '../utils/editorThemes';

interface HeaderProps {
  isDark: boolean;
  toggleTheme: () => void;
  layout: 'stacked' | 'split';
  toggleLayout: () => void;
  spaces: Space[];
  activeSpaceId: string;
  onSwitchSpace: (id: string) => void;
  onCreateSpace: () => void;
  onRenameClick: () => void;
  onDeleteClick: () => void;
  onImportSpace: (e: React.ChangeEvent<HTMLInputElement>) => void;
  user: User | null;
  onLoginClick: () => void;
  onProfileClick: () => void;
  currentThemeId: string;
  onThemeChange: (id: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  isDark, toggleTheme, layout, toggleLayout,
  spaces, activeSpaceId, onSwitchSpace, onCreateSpace, onRenameClick, onDeleteClick, onImportSpace,
  user, onLoginClick, onProfileClick, currentThemeId, onThemeChange
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleCreateClick = () => {
     onCreateSpace();
  }

  const triggerImport = () => {
    fileInputRef.current?.click();
  };

  return (
    <header className="flex flex-col md:flex-row items-center justify-between px-6 py-4 sticky top-0 z-50 bg-white/30 dark:bg-black/30 backdrop-blur-xl border-b border-white/20 dark:border-white/5 shadow-sm transition-all duration-300 gap-4 md:gap-0">
      
      {/* Left Side: Logo & Spaces */}
      <div className="flex flex-col sm:flex-row items-center gap-5 w-full md:w-auto">
        
        {/* Logo */}
        <div className="flex items-center gap-3 group">
          <div className="p-2 bg-gradient-to-br from-nether-500 to-nether-700 rounded-xl shadow-lg shadow-nether-500/40 shrink-0 transform group-hover:scale-110 transition-transform duration-300">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-bold text-xl tracking-tight hidden lg:block text-gray-800 dark:text-gray-100 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
            Netherz
          </h1>
        </div>
        
        {/* Spaces Manager Bar */}
        <div className="flex items-center gap-2 bg-white/40 dark:bg-gray-800/40 p-1.5 rounded-xl border border-white/30 dark:border-white/10 shadow-sm w-full sm:w-auto hover:bg-white/60 dark:hover:bg-gray-800/60 transition-colors duration-300">
          
          <FolderOpen className="w-4 h-4 text-nether-500 ml-2 shrink-0" />
          
          {/* Space Selector */}
          <div className="relative group">
            <select 
              value={activeSpaceId}
              onChange={(e) => onSwitchSpace(e.target.value)}
              className="appearance-none bg-transparent border-none outline-none text-sm font-semibold text-gray-800 dark:text-gray-100 pl-1 pr-6 py-1 min-w-[120px] max-w-[200px] cursor-pointer hover:text-nether-600 dark:hover:text-nether-400 transition-colors"
            >
              {spaces.map(space => (
                <option key={space.id} value={space.id} className="bg-white dark:bg-gray-900 py-2">
                  {space.name}
                </option>
              ))}
            </select>
          </div>

          <div className="h-5 w-px bg-gray-300 dark:bg-gray-700 mx-1"></div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            <Button 
              variant="primary" 
              size="sm" 
              onClick={handleCreateClick} 
              title="New Space"
              className="shadow-md !rounded-lg"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              New
            </Button>

            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onRenameClick} 
              title="Rename Current Space"
              className="w-8 h-8 !p-0 !rounded-lg"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </Button>

            <Button 
              variant="ghost" 
              size="sm" 
              onClick={triggerImport} 
              title="Import File"
              className="w-8 h-8 !p-0 relative !rounded-lg"
            >
               <FileUp className="w-3.5 h-3.5" />
               <input 
                 ref={fileInputRef}
                 type="file" 
                 className="hidden" 
                 accept=".json,.html,.js,.css,.txt" 
                 onChange={onImportSpace}
               />
            </Button>

            <Button 
              variant="danger" 
              size="sm" 
              onClick={onDeleteClick} 
              title="Delete Space"
              className="w-8 h-8 !p-0 !rounded-lg"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Right Side: Toggles & Auth */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-end">
        <div className="bg-white/40 dark:bg-gray-800/40 p-1 rounded-xl backdrop-blur-sm border border-white/30 dark:border-white/10 flex gap-1 shadow-sm">
          {/* Theme Selector Dropdown */}
          <div className="relative group">
            <Button 
              variant="ghost" 
              size="sm" 
              title="Code Theme"
              className="w-9 h-9 !p-0 rounded-lg text-gray-500 dark:text-gray-400"
            >
              <Palette className="w-4 h-4" />
            </Button>
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 border border-white/20 dark:border-white/10 rounded-xl shadow-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[60]">
               <div className="p-1">
                  {Object.values(THEMES).map(theme => (
                     <button
                        key={theme.id}
                        onClick={() => onThemeChange(theme.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                           currentThemeId === theme.id 
                           ? 'bg-nether-500/10 text-nether-600 dark:text-nether-400' 
                           : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
                        }`}
                     >
                        <div className="flex items-center gap-2">
                           <div className={`w-3 h-3 rounded-full border border-gray-300 dark:border-gray-700 ${theme.id === 'netherz' ? 'bg-gradient-to-br from-white to-gray-200' : ''}`} style={{ backgroundColor: theme.id !== 'netherz' ? theme.selection : undefined }}></div>
                           {theme.name}
                        </div>
                     </button>
                  ))}
               </div>
            </div>
          </div>

          <div className="w-px h-4 bg-gray-300 dark:bg-white/10 mx-1"></div>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleLayout} 
            title="Toggle Layout"
            className={`w-9 h-9 !p-0 rounded-lg ${layout === 'split' ? 'text-nether-600 bg-white/60 dark:bg-white/10 shadow-sm' : ''}`}
          >
            <Layout className="w-4 h-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleTheme}
            title="Toggle Theme"
            className="w-9 h-9 !p-0 rounded-lg"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </div>
        
        <div className="h-8 w-px bg-gray-300 dark:bg-white/10 mx-1 hidden md:block"></div>

        {/* User Auth Section */}
        {user ? (
          <button 
            onClick={onProfileClick}
            className="flex items-center gap-2 bg-white/40 dark:bg-gray-800/40 pl-1 pr-4 py-1 rounded-xl border border-white/30 dark:border-white/10 shadow-sm hover:bg-white/60 dark:hover:bg-gray-700/60 transition-colors group cursor-pointer"
          >
             <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/20 group-hover:scale-105 transition-transform">
               <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
             </div>
             <div className="flex flex-col items-start mr-1">
               <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 leading-none">Hello,</span>
               <span className="text-xs font-semibold text-gray-800 dark:text-white leading-none">{user.name.split(' ')[0]}</span>
             </div>
          </button>
        ) : (
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={onLoginClick}
            className="rounded-xl shadow-md border-nether-200 dark:border-nether-800 text-nether-700 dark:text-nether-300 font-bold"
          >
            <UserCircle className="w-4 h-4 mr-2" />
            Login
          </Button>
        )}
      </div>
    </header>
  );
};