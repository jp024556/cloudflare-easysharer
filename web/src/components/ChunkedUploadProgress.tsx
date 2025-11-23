import React from 'react';
import { Play, Pause, X, RotateCcw, CheckCircle, XCircle, AlertCircle, Wifi, Clock, RefreshCw } from 'lucide-react';
import { ChunkedUploadFile } from '../hooks/useChunkedUpload';
import { formatFileSize } from '../utils/fileUtils';

interface ChunkedUploadProgressProps {
  files: ChunkedUploadFile[];
  onPause: (fileId: string) => void;
  onResume: (fileId: string) => void;
  onCancel: (fileId: string) => void;
  onRestart: (fileId: string) => void;
  onRemove: (fileId: string) => void;
  onClearAll: () => void;
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

const ChunkedUploadProgress: React.FC<ChunkedUploadProgressProps> = ({
  files,
  onPause,
  onResume,
  onCancel,
  onRestart,
  onRemove,
  onClearAll,
}) => {
  if (files.length === 0) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-gray-500" />;
      case 'uploading':
        return <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      case 'paused':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <div className="w-5 h-5 bg-gray-300 rounded-full" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'cancelled':
        return 'bg-gray-400';
      case 'uploading':
        return 'bg-blue-500';
      case 'paused':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'error':
        return 'Failed';
      case 'cancelled':
        return 'Cancelled';
      case 'uploading':
        return 'Uploading';
      case 'paused':
        return 'Paused';
      case 'idle':
        return 'Waiting';
      default:
        return 'Unknown';
    }
  };

  const getActionButtons = (file: ChunkedUploadFile) => {
    const { status, canResume } = file.state;

    switch (status) {
      case 'uploading':
        return (
          <div className="flex space-x-1">
            <button
              onClick={() => onPause(file.id)}
              className="p-2 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-all"
              title="Pause upload"
            >
              <Pause className="w-4 h-4" />
            </button>
            <button
              onClick={() => onCancel(file.id)}
              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
              title="Cancel upload"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );

      case 'paused':
        return (
          <div className="flex space-x-1">
            {canResume && (
              <button
                onClick={() => onResume(file.id)}
                className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all"
                title="Resume upload"
              >
                <Play className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => onCancel(file.id)}
              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
              title="Cancel upload"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );

      case 'error':
        return (
          <div className="flex space-x-1">
            {canResume && (
              <button
                onClick={() => onResume(file.id)}
                className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                title="Retry upload"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => onRestart(file.id)}
              className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all"
              title="Restart upload"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => onRemove(file.id)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-all"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );

      case 'cancelled':
        return (
          <div className="flex space-x-1">
            <button
              onClick={() => onRestart(file.id)}
              className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all"
              title="Restart upload"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => onRemove(file.id)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-all"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );

      case 'completed':
        return (
          <button
            onClick={() => onRemove(file.id)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-all"
            title="Remove file"
          >
            <X className="w-4 h-4" />
          </button>
        );

      case 'idle':
      default:
        return (
          <div className="flex space-x-1">
            <div className="p-2 text-gray-400" title="Waiting to start">
              <div className="w-4 h-4 bg-gray-300 rounded-full" />
            </div>
            <button
              onClick={() => onRemove(file.id)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-all"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
    }
  };

  const hasAnyFiles = files.length > 0;
  const hasCompletedFiles = files.some(f => f.state.status === 'completed');
  const hasActiveUploads = files.some(f => 
    f.state.status === 'uploading' || f.state.status === 'paused' || f.state.status === 'idle'
  );

  return (
    <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
      <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
            File Uploads ({files.length})
          </h3>
          {hasAnyFiles && (
            <button
              onClick={onClearAll}
              className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium px-3 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 border border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {files.map((file) => (
          <div
            key={file.id}
            className="px-4 py-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                {getStatusIcon(file.state.status)}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {file.file.name}
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{formatFileSize(file.file.size)}</span>
                    <span>•</span>
                    <span className="font-medium">{getStatusText(file.state.status)}</span>
                    {file.state.status === 'uploading' && file.state.uploadedChunks > 0 && (
                      <>
                        <span>•</span>
                        <span>{file.state.uploadedChunks}/{file.state.totalChunks} chunks</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* Upload Stats */}
                {file.state.status === 'uploading' && (
                  <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                    {file.state.speed > 0 && (
                      <div className="flex items-center space-x-1">
                        <Wifi className="w-3 h-3" />
                        <span>{formatSpeed(file.state.speed)}</span>
                      </div>
                    )}
                    {file.state.timeRemaining > 0 && (
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(file.state.timeRemaining)}</span>
                      </div>
                    )}
                  </div>
                )}

                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {Math.round(file.state.progress)}%
                </span>

                {getActionButtons(file)}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${getStatusColor(file.state.status)}`}
                style={{ width: `${file.state.progress}%` }}
              />
            </div>

            {/* Error Message */}
            {file.state.error && (
              <div className="mt-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                {file.state.error}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChunkedUploadProgress;