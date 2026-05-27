import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from './ThemeContext';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full hover:bg-gray-200/50 dark:hover:bg-slate-700/50 transition-colors"
      title={`Current theme: ${theme}`}
    >
      {theme === 'light' ? (
        <Sun className="w-5 h-5 text-amber-500" />
      ) : theme === 'dark' ? (
        <Moon className="w-5 h-5 text-blue-400" />
      ) : (
        <Monitor className="w-5 h-5 text-gray-500 dark:text-gray-400" />
      )}
    </button>
  );
};
