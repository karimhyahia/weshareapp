import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, icon, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            {icon}
          </div>
        )}
        <input
          className={`
            block w-full rounded-lg border-slate-200 bg-white 
            text-slate-900 placeholder-slate-400 shadow-sm
            focus:border-blue-500 focus:ring-blue-500 
            ${icon ? 'pl-10' : 'pl-3'} 
            py-2.5 text-sm border transition-colors
            ${className}
          `}
          {...props}
        />
      </div>
    </div>
  );
};

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({ label, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>}
      <textarea
        className={`
          block w-full rounded-lg border-slate-200 bg-white 
          text-slate-900 placeholder-slate-400 shadow-sm
          focus:border-blue-500 focus:ring-blue-500 
          p-3 text-sm border transition-colors min-h-[100px]
          ${className}
        `}
        {...props}
      />
    </div>
  );
};