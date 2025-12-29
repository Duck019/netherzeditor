import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  icon,
  className = '',
  type = 'button', 
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-95";
  
  const variants = {
    primary: "bg-gradient-to-br from-nether-600 to-indigo-600 hover:from-nether-500 hover:to-indigo-500 text-white shadow-lg shadow-nether-500/25 hover:shadow-nether-500/40 border border-transparent ring-1 ring-white/10",
    secondary: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-200 shadow-sm",
    ghost: "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white border border-transparent",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/20 shadow-sm",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs min-h-[32px]", 
    md: "px-5 py-2.5 text-sm min-h-[42px]", 
    lg: "px-8 py-3.5 text-base min-h-[52px]",
  };

  return (
    <button 
      type={type}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} 
      {...props}
    >
      {icon && <span className={children ? "mr-2" : ""}>{icon}</span>}
      {children}
    </button>
  );
};