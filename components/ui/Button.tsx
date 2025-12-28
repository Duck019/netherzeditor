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
    primary: "bg-gradient-to-r from-nether-600 to-nether-500 hover:from-nether-500 hover:to-nether-400 text-white shadow-lg shadow-nether-500/25 hover:shadow-nether-500/40 border border-transparent",
    secondary: "bg-white/50 dark:bg-white/5 border border-white/20 hover:bg-white/80 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 backdrop-blur-md shadow-sm",
    ghost: "text-gray-600 dark:text-gray-400 hover:bg-black/5 dark:hover:bg-white/10 hover:text-nether-600 dark:hover:text-nether-400 border border-transparent",
    danger: "bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 shadow-sm hover:shadow-red-500/10",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs min-h-[32px] min-w-[32px]", 
    md: "px-5 py-2.5 text-sm min-h-[42px] min-w-[42px]", 
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