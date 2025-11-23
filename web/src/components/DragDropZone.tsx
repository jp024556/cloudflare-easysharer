import React, { useState, useCallback } from 'react';
import { Upload, FileText, Sparkles } from 'lucide-react';
import { DragDropZoneProps } from '../types';

const DragDropZone: React.FC<DragDropZoneProps> = ({
  onFilesDrop,
  children,
  className = ''
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev - 1);
    if (dragCounter <= 1) {
      setIsDragOver(false);
    }
  }, [dragCounter]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setDragCounter(0);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onFilesDrop(files);
    }
  }, [onFilesDrop]);

  return (
    <div
      className={`relative ${className}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {children}
      
      {isDragOver && (
        <div className="absolute inset-0 z-30 bg-green-50/95 dark:bg-green-900/95 backdrop-blur-sm border-2 border-dashed border-green-400 dark:border-green-500 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
              <Upload className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300 mb-3 flex items-center justify-center space-x-2">
              <Sparkles className="w-6 h-6" />
              <span>Drop files here</span>
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="text-sm text-green-600 dark:text-green-400 flex items-center justify-center space-x-2 bg-white/60 dark:bg-gray-800/60 px-4 py-2 rounded-full">
              <FileText className="w-4 h-4" />
              <span className="font-medium">Documents and images supported</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DragDropZone;