import React from 'react';
import { X, FileText, Eye, Trash2, Zap, MoreHorizontal } from 'lucide-react';
import { FilePreviewProps } from '../types';
import { formatFileSize } from '../utils/fileUtils';
import { calculateCompressionRatio } from '../utils/compressionUtils';

const FilePreview: React.FC<FilePreviewProps> = ({
  files,
  onRemoveFile,
  onShowMore,
  onClearAll,
  onPreviewFile
}) => {
  const displayFiles = files.slice(0, 3);
  const remainingCount = files.length - 3;

  if (files.length === 0) return null;

  return (
    <div className="mb-6 space-y-3">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 bg-teal-100 dark:bg-teal-900/30 px-3 py-1 rounded-full">
          {files.length} file{files.length !== 1 ? 's' : ''} selected
        </div>
        {onClearAll && (
          <button
            onClick={onClearAll}
            className="flex items-center space-x-2 px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-all duration-200 border border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700"
            aria-label="Clear all files"
          >
            <Trash2 className="w-4 h-4" />
            <span className="font-medium">Clear all</span>
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {displayFiles.map((fileData) => {
          const compressionRatio = fileData.originalSize ? 
            calculateCompressionRatio(fileData.originalSize, fileData.size) : 0;
          
          return (
            <div
              key={fileData.id}
              className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-md transition-all duration-200"
            >
              <div className="flex-shrink-0 mr-3">
                {fileData.type === 'image' && fileData.preview ? (
                  <img
                    src={fileData.preview}
                    alt={fileData.name}
                    className="w-12 h-12 object-cover rounded-lg shadow-sm"
                  />
                ) : (
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center shadow-sm">
                    <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {fileData.name}
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-gray-500 dark:text-gray-400 font-medium">
                    {formatFileSize(fileData.size)}
                  </span>
                  {fileData.compressed && compressionRatio > 0 && (
                    <div className="flex items-center space-x-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">
                      <Zap className="w-3 h-3" />
                      <span className="font-medium">{compressionRatio}% smaller</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex space-x-2">
                {onPreviewFile && (
                  <button
                    onClick={() => onPreviewFile(fileData)}
                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg transition-all duration-200"
                    aria-label="Preview file"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => onRemoveFile(fileData.id)}
                  className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                  aria-label="Remove file"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      {remainingCount > 0 && onShowMore && (
        <button
          onClick={onShowMore}
          className="w-full p-3 text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 bg-teal-50 dark:bg-teal-900/20 hover:bg-teal-100 dark:hover:bg-teal-900/30 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 border border-teal-200 dark:border-teal-800 hover:border-teal-300 dark:hover:border-teal-700"
        >
          <MoreHorizontal className="w-4 h-4" />
          <span className="font-medium">Show {remainingCount} more file{remainingCount !== 1 ? 's' : ''}</span>
        </button>
      )}
    </div>
  );
};

export default FilePreview;