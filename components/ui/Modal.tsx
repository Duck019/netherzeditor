import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string; // New prop for subtitle
  icon?: React.ReactNode; // New prop for header icon
  children: React.ReactNode;
  footer?: React.ReactNode;
  variant?: 'default' | 'danger'; // To style header differently
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  description,
  icon,
  children, 
  footer,
  variant = 'default' 
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop with stronger blur and darker overlay */}
      <div 
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity duration-300" 
        onClick={onClose}
      />
      
      {/* Content Container */}
      <div className="relative w-full max-w-lg bg-white/95 dark:bg-[#121217]/95 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-2xl rounded-2xl overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-300 ring-1 ring-black/5 dark:ring-white/5">
        
        {/* Decorative Top Line */}
        <div className={`h-1 w-full bg-gradient-to-r ${
          variant === 'danger' 
            ? 'from-red-500 via-orange-500 to-red-500' 
            : 'from-nether-400 via-purple-500 to-indigo-500'
        }`} />

        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-2">
          <div className="flex gap-4">
            {icon && (
              <div className={`mt-1 p-2.5 rounded-xl shrink-0 ${
                variant === 'danger' 
                  ? 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400' 
                  : 'bg-nether-50 text-nether-600 dark:bg-nether-500/10 dark:text-nether-300'
              }`}>
                {icon}
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                {title}
              </h3>
              {description && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {description}
                </p>
              )}
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="group p-2 -mr-2 -mt-2 rounded-lg text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
          >
            <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6 pt-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 p-4 bg-gray-50/80 dark:bg-black/20 border-t border-gray-100 dark:border-white/5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};