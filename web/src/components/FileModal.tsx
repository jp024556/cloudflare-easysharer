import React from 'react';
import { X, FileText, Download, Eye, Zap } from 'lucide-react';
import { FileModalProps } from '../types';
import { formatFileSize } from '../utils/fileUtils';
import { calculateCompressionRatio } from '../utils/compressionUtils';

const FileModal: React.FC<FileModalProps> = ({
  files,
  isOpen,
  onClose,
  onRemoveFile,
  onPreviewFile
}) => {
  if (!isOpen) return null;

  const handleDownload = (fileData: any) => {
    const url = URL.createObjectURL(fileData.file);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileData.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} />
        
        <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-2xl rounded-2xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Selected Files ({files.length})
            </h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
            {files.map((fileData) => {
              const compressionRatio = fileData.originalSize ? 
                calculateCompressionRatio(fileData.originalSize, fileData.size) : 0;
              
              return (
                <div
                  key={fileData.id}
                  className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex-shrink-0 mr-4">
                    {fileData.type === 'image' && fileData.preview ? (
                      <img
                        src={fileData.preview}
                        alt={fileData.name}
                        className="w-14 h-14 object-cover rounded-lg shadow-sm"
                      />
                    ) : (
                      <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center shadow-sm">
                        <FileText className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {fileData.name}
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="text-gray-500 dark:text-gray-400 font-medium">
                        {formatFileSize(fileData.size)}
                      </span>
                      {fileData.originalSize && fileData.originalSize !== fileData.size && (
                        <span className="text-gray-400 dark:text-gray-500 text-xs">
                          (was {formatFileSize(fileData.originalSize)})
                        </span>
                      )}
                    </div>
                    {fileData.compressed && compressionRatio > 0 && (
                      <div className="flex items-center space-x-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full text-xs mt-1 w-fit">
                        <Zap className="w-3 h-3" />
                        <span className="font-medium">Compressed {compressionRatio}%</span>
                      </div>
                    )}
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
                      onClick={() => handleDownload(fileData)}
                      className="p-2 text-gray-400 dark:text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all duration-200"
                      aria-label="Download file"
                    >
                      <Download className="w-4 h-4" />
                    </button>
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
        </div>
      </div>
    </div>
  );
};

export default FileModal;