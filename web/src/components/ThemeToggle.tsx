import React, { useState } from 'react';
import { Sun, Moon, Monitor, ChevronDown } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { themeMode, setThemeMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themeOptions = [
    { value: 'light' as const, label: 'Light', icon: Sun },
    { value: 'dark' as const, label: 'Dark', icon: Moon },
    { value: 'system' as const, label: 'System', icon: Monitor }
  ];

  const currentTheme = themeOptions.find(option => option.value === themeMode);
  const CurrentIcon = currentTheme?.icon || Monitor;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 border border-gray-200 dark:border-gray-600"
        aria-label="Toggle theme"
      >
        <CurrentIcon className="w-4 h-4 text-gray-700 dark:text-gray-300" />
        <ChevronDown className={`w-3 h-3 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full right-0 mt-2 z-20 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 py-2 min-w-[140px] backdrop-blur-sm">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => {
                    setThemeMode(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 text-sm flex items-center space-x-3 ${
                    themeMode === option.value 
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium' 
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default ThemeToggle;