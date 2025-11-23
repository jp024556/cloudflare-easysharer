import React from 'react';
import { Clock, ChevronDown } from 'lucide-react';

interface ExpirySelectorProps {
  selectedExpiry: number;
  onExpiryChange: (minutes: number) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const ExpirySelector: React.FC<ExpirySelectorProps> = ({
  selectedExpiry,
  onExpiryChange,
  isOpen,
  onToggle
}) => {
  const expiryOptions = [
    { value: 10, label: '10 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 60, label: '1 hour' },
    { value: 180, label: '3 hours' },
    { value: 720, label: '12 hours' },
    { value: 1440, label: '24 hours' },
    { value: 10080, label: '7 days' }
  ];

  const selectedOption = expiryOptions.find(opt => opt.value === selectedExpiry);

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="flex items-center space-x-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-full hover:bg-white dark:hover:bg-gray-700 transition-all duration-200 text-sm"
      >
        <Clock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
        <span className="text-gray-700 dark:text-gray-300 font-medium">
          {selectedOption?.label}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10"
            onClick={onToggle}
          />
          <div className="absolute top-full left-0 mt-2 z-20 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 py-2 min-w-[160px] backdrop-blur-sm">
            {expiryOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onExpiryChange(option.value);
                  onToggle();
                }}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 text-sm ${
                  selectedExpiry === option.value 
                    ? 'bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 font-medium' 
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ExpirySelector;