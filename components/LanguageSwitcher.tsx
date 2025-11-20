
import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

interface LanguageSwitcherProps {
  className?: string;
  dark?: boolean;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className = '', dark = false }) => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'de' : 'en');
  };

  return (
    <button
      onClick={toggleLanguage}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all
        ${dark 
          ? 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700' 
          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
        }
        ${className}
      `}
    >
      <Globe size={14} />
      <span>{language === 'en' ? 'EN' : 'DE'}</span>
    </button>
  );
};
