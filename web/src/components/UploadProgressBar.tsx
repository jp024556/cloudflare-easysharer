import React from 'react';
import { CheckCircle, XCircle, Upload, Clock, Wifi } from 'lucide-react';
import { UploadProgress } from '../hooks/useUploadProgress';
import { formatFileSize } from '../utils/fileUtils';

interface UploadProgressBarProps {
  uploadProgress: UploadProgress[];
  overallProgress: number;
  isUploading: boolean;
  onCancel?: () => void;
}

const formatTime = (seconds: number): string => {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
};

const formatSpeed = (bytesPerSecond: number): string => {
  if (bytesPerSecond < 1024) return `${Math.round(bytesPerSecond)} B/s`;
  if (bytesPerSecond < 1024 * 1024) return `${Math.round(bytesPerSecond / 1024)} KB/s`;
  return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
};

const UploadProgressBar: React.FC<UploadProgressBarProps> = ({
  uploadProgress,
  overallProgress,
  isUploading,
  onCancel
}) => {
  if (!isUploading && uploadProgress.length === 0) return null;

  const completedFiles = uploadProgress.filter(p => p.status === 'completed').length;
  const errorFiles = uploadProgress.filter(p => p.status === 'error').length;
  const totalFiles = uploadProgress.length;
  
  const averageSpeed = uploadProgress
    .filter(p => p.speed && p.status === 'uploading')
    .reduce((sum, p) => sum + (p.speed || 0), 0) / Math.max(1, uploadProgress.filter(p => p.status === 'uploading').length);

  const estimatedTimeRemaining = uploadProgress
    .filter(p => p.timeRemaining && p.status === 'uploading')
    .reduce((sum, p) => sum + (p.timeRemaining || 0), 0) / Math.max(1, uploadProgress.filter(p => p.status === 'uploading').length);

  return (
    <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
              {overallProgress === 100 ? (
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <div>
              <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {overallProgress === 100 ? 'Upload Complete' : 'Uploading Files'}
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-300">
                {completedFiles} of {totalFiles} files completed
                {errorFiles > 0 && ` • ${errorFiles} failed`}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Upload Stats */}
            {isUploading && averageSpeed > 0 && (
              <div className="flex items-center space-x-4 text-xs text-blue-700 dark:text-blue-300">
                <div className="flex items-center space-x-1">
                  <Wifi className="w-3 h-3" />
                  <span>{formatSpeed(averageSpeed)}</span>
                </div>
                {estimatedTimeRemaining > 0 && (
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(estimatedTimeRemaining)}</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Cancel Button */}
            {isUploading && onCancel && (
              <button
                onClick={onCancel}
                className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Overall Progress
          </span>
          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
            {overallProgress}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 h-3 rounded-full transition-all duration-300 ease-out relative overflow-hidden"
            style={{ width: `${overallProgress}%` }}
          >
            {/* Animated shimmer effect */}
            {isUploading && overallProgress < 100 && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
            )}
          </div>
        </div>
      </div>

      {/* Individual File Progress */}
      {uploadProgress.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          <div className="max-h-48 overflow-y-auto">
            {uploadProgress.map((progress) => (
              <div
                key={progress.fileId}
                className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      {progress.status === 'completed' ? (
                        <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400" />
                      ) : progress.status === 'error' ? (
                        <XCircle className="w-4 h-4 text-red-500 dark:text-red-400" />
                      ) : (
                        <div className="w-4 h-4 border-2 border-blue-500 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {progress.fileName}
                      </div>
                      {progress.error && (
                        <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                          {progress.error}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                    {progress.speed && progress.status === 'uploading' && (
                      <span>{formatSpeed(progress.speed)}</span>
                    )}
                    <span className="font-medium">
                      {progress.progress}%
                    </span>
                  </div>
                </div>
                
                {/* Individual Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      progress.status === 'completed' 
                        ? 'bg-green-500 dark:bg-green-400' 
                        : progress.status === 'error'
                        ? 'bg-red-500 dark:bg-red-400'
                        : 'bg-blue-500 dark:bg-blue-400'
                    }`}
                    style={{ width: `${progress.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadProgressBar;