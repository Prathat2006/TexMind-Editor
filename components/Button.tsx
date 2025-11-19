
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md';
    isLoading?: boolean;
    icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
    children, 
    variant = 'primary', 
    size = 'md',
    isLoading = false, 
    icon,
    className = '',
    ...props 
}) => {
    const baseStyles = "font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900";
    
    const sizeStyles = {
        sm: "px-3 py-1.5 text-xs",
        md: "px-4 py-2 text-sm",
    };

    const variants = {
        primary: "bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-lg shadow-indigo-500/20 border border-indigo-500/20",
        secondary: "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-sm hover:border-slate-600",
        danger: "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/30",
        ghost: "bg-transparent hover:bg-slate-800/50 text-slate-400 hover:text-slate-200"
    };

    return (
        <button 
            className={`${baseStyles} ${sizeStyles[size]} ${variants[variant]} ${className}`}
            disabled={isLoading || props.disabled}
            {...props}
        >
            {isLoading ? (
                <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : icon}
            {children}
        </button>
    );
};
