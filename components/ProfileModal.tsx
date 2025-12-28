import React from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { User } from '../types';
import { LogOut, Mail, Box, User as UserIcon, Shield } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onLogout: () => void;
  projectCount: number;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ 
  isOpen, 
  onClose, 
  user, 
  onLogout,
  projectCount
}) => {
  if (!user) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="User Profile"
    >
      <div className="flex flex-col items-center gap-6">
        {/* Avatar Section */}
        <div className="relative group">
          <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-br from-nether-500 to-indigo-600 shadow-xl shadow-nether-500/20">
            <img 
              src={user.avatar} 
              alt={user.name} 
              className="w-full h-full rounded-full object-cover border-4 border-white dark:border-gray-800 bg-white dark:bg-gray-900" 
            />
          </div>
          <div className="absolute bottom-1 right-1 bg-emerald-500 w-5 h-5 rounded-full border-2 border-white dark:border-gray-800" title="Online"></div>
        </div>

        {/* Info Section */}
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h2>
          <div className="flex items-center justify-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
            <Mail className="w-3.5 h-3.5" />
            <span>{user.email}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 w-full mt-2">
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex flex-col items-center gap-2 transition-transform hover:scale-[1.02]">
            <div className="p-2 bg-nether-100 dark:bg-nether-500/20 rounded-lg text-nether-600 dark:text-nether-300">
              <Box className="w-5 h-5" />
            </div>
            <div className="text-center">
              <span className="block text-2xl font-bold text-gray-800 dark:text-white">{projectCount}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Active Projects</span>
            </div>
          </div>
          
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex flex-col items-center gap-2 transition-transform hover:scale-[1.02]">
            <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-lg text-blue-600 dark:text-blue-300">
              <Shield className="w-5 h-5" />
            </div>
            <div className="text-center">
              <span className="block text-2xl font-bold text-gray-800 dark:text-white">Free</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Account Plan</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-gray-200 dark:bg-white/10 my-2"></div>

        {/* Actions */}
        <Button 
          onClick={() => {
            onLogout();
            onClose();
          }} 
          variant="danger" 
          className="w-full justify-center py-3"
          icon={<LogOut className="w-4 h-4" />}
        >
          Sign Out
        </Button>
      </div>
    </Modal>
  );
};