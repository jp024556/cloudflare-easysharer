import React from 'react';
import { FileText, Image, ChevronDown, Paperclip } from 'lucide-react';
import { AttachmentDropdownProps } from '../types';

const AttachmentDropdown: React.FC<AttachmentDropdownProps> = ({
  onFileSelect,
  isOpen,
  onToggle
}) => {
  const handleFileSelect = (type: 'image' | 'document') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    
    if (type === 'image') {
      input.accept = 'image/*';
    } else {
      input.accept = '.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx';
    }
    
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        onFileSelect(files);
      }
    };
    
    input.click();
    onToggle();
  };

  return (
    <div className="relative w-full">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 transition-all duration-200"
        aria-label="Attach file"
      >
        <div className="flex items-center space-x-3">
          <Paperclip className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <span className="font-medium">Attach Files</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10"
            onClick={onToggle}
          />
          <div className="absolute bottom-full left-0 mb-2 z-20 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 py-2 w-full overflow-hidden">
            <div className="space-y-1">
              <button
                onClick={() => handleFileSelect('document')}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 transition-all duration-200"
              >
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-gray-100">Document</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">PDF, DOC, TXT, XLS, PPT</div>
                </div>
              </button>
              
              <button
                onClick={() => handleFileSelect('image')}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 transition-all duration-200"
              >
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <Image className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-gray-100">Image</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">JPG, PNG, GIF, WEBP</div>
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AttachmentDropdown;