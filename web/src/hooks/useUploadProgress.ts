import { useState, useCallback } from 'react';

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  speed?: number;
  timeRemaining?: number;
  error?: string;
}

export const useUploadProgress = () => {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);

  const initializeUpload = useCallback((files: Array<{ id: string; name: string }>) => {
    const initialProgress = files.map(file => ({
      fileId: file.id,
      fileName: file.name,
      progress: 0,
      status: 'pending' as const,
    }));
    
    setUploadProgress(initialProgress);
    setIsUploading(true);
    setOverallProgress(0);
  }, []);

  const updateFileProgress = useCallback((fileId: string, progress: number, speed?: number, timeRemaining?: number) => {
    setUploadProgress(prev => 
      prev.map(item => 
        item.fileId === fileId 
          ? { 
              ...item, 
              progress, 
              status: progress === 100 ? 'completed' : 'uploading',
              speed,
              timeRemaining
            }
          : item
      )
    );

    // Calculate overall progress
    setUploadProgress(prev => {
      const totalProgress = prev.reduce((sum, item) => {
        if (item.fileId === fileId) {
          return sum + progress;
        }
        return sum + item.progress;
      }, 0);
      
      const overall = Math.round(totalProgress / prev.length);
      setOverallProgress(overall);
      
      return prev;
    });
  }, []);

  const setFileError = useCallback((fileId: string, error: string) => {
    setUploadProgress(prev => 
      prev.map(item => 
        item.fileId === fileId 
          ? { ...item, status: 'error', error }
          : item
      )
    );
  }, []);

  const completeUpload = useCallback(() => {
    setIsUploading(false);
    // Clear progress after a delay to show completion
    setTimeout(() => {
      setUploadProgress([]);
      setOverallProgress(0);
    }, 2000);
  }, []);

  const cancelUpload = useCallback(() => {
    setIsUploading(false);
    setUploadProgress([]);
    setOverallProgress(0);
  }, []);

  return {
    uploadProgress,
    isUploading,
    overallProgress,
    initializeUpload,
    updateFileProgress,
    setFileError,
    completeUpload,
    cancelUpload
  };
};