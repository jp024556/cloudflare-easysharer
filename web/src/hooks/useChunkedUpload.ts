import { useState, useCallback, useRef } from 'react';
import { apiClient } from '../utils/apiClient';
import { calculateChunkHash, calculateFileHash } from '../utils/hashUtils';
import { MAX_CONCURRENT_UPLOADS } from '../config/constants';

export interface ChunkedUploadState {
  uploadId: string | null;
  status: 'idle' | 'uploading' | 'paused' | 'completed' | 'error' | 'cancelled';
  progress: number;
  uploadedChunks: number;
  totalChunks: number;
  error: string | null;
  canResume: boolean;
  speed: number;
  timeRemaining: number;
}

export interface ChunkedUploadFile {
  id: string;
  file: File;
  state: ChunkedUploadState;
  originalRecipientId?: string;
  originalSenderMobileNumber?: string;
}

export const useChunkedUpload = () => {
  const [files, setFiles] = useState<ChunkedUploadFile[]>([]);
  const abortControllers = useRef<Map<string, AbortController>>(new Map());
  const uploadTimers = useRef<Map<string, { startTime: number; uploadedBytes: number }>>(new Map());
  const pausedFiles = useRef<Set<string>>(new Set());

  const createFileUpload = useCallback((file: File): ChunkedUploadFile => {
    return {
      id: Date.now().toString() + Math.random().toString(36).substr(2),
      file,
      state: {
        uploadId: null,
        status: 'idle',
        progress: 0,
        uploadedChunks: 0,
        totalChunks: 0,
        error: null,
        canResume: false,
        speed: 0,
        timeRemaining: 0,
      },
    };
  }, []);

  const updateFileState = useCallback((fileId: string, updates: Partial<ChunkedUploadState>) => {
    // Don't update state if file is paused (prevents race conditions)
    if (pausedFiles.current.has(fileId) && updates.status && updates.status !== 'paused') {
      return;
    }
    
    setFiles(prev => prev.map(file => 
      file.id === fileId 
        ? { ...file, state: { ...file.state, ...updates } }
        : file
    ));
  }, []);

  const updateFileData = useCallback((fileId: string, updates: Partial<ChunkedUploadFile>) => {
    setFiles(prev => prev.map(file => 
      file.id === fileId 
        ? { ...file, ...updates }
        : file
    ));
  }, []);

  const calculateSpeed = useCallback((fileId: string, uploadedBytes: number) => {
    const timer = uploadTimers.current.get(fileId);
    if (!timer) return 0;

    const elapsedTime = (Date.now() - timer.startTime) / 1000;
    return elapsedTime > 0 ? uploadedBytes / elapsedTime : 0;
  }, []);

  const getErrorMessage = useCallback((error: any): string => {
    if (error?.message) {
      // Handle specific API error messages
      if (error.message.includes('400')) {
        if (error.message.toLowerCase().includes('recipient')) {
          return 'Invalid recipient ID. Please check and try again.';
        }
        if (error.message.toLowerCase().includes('mobile')) {
          return 'Invalid mobile number format.';
        }
        return 'Invalid request. Please check your input and try again.';
      }
      if (error.message.includes('404')) {
        return 'Recipient not found. Please verify the recipient ID.';
      }
      if (error.message.includes('413')) {
        return 'File too large. Please try a smaller file.';
      }
      if (error.message.includes('429')) {
        return 'Too many requests. Please wait and try again.';
      }
      if (error.message.includes('500')) {
        return 'Server error. Please try again later.';
      }
      return error.message;
    }
    return 'Upload failed. Please try again.';
  }, []);

  const startUpload = useCallback(async (
    fileUpload: ChunkedUploadFile,
    recipientId: string,
    senderName: string
  ) => {
    const fileId = fileUpload.id;
    
    // Remove from paused files when starting upload
    pausedFiles.current.delete(fileId);

    const abortController = new AbortController();
    abortControllers.current.set(fileId, abortController);

    try {
      updateFileState(fileId, { status: 'uploading', error: null });
      updateFileData(fileId, { 
        originalRecipientId: recipientId, 
        originalSenderMobileNumber: senderName 
      });

      // Start timing
      uploadTimers.current.set(fileId, {
        startTime: Date.now(),
        uploadedBytes: 0,
      });

      // Initiate upload
      const initiateResponse = await apiClient.initiateUpload({
        fileName: fileUpload.file.name,
        fileSize: fileUpload.file.size,
        mimeType: fileUpload.file.type,
        senderMobileNumber: senderName,
        recipientId,
      });

      if (abortController.signal.aborted) {
        updateFileState(fileId, { status: 'cancelled', error: 'Upload cancelled' });
        return;
      }

      updateFileState(fileId, {
        uploadId: initiateResponse.uploadId,
        totalChunks: initiateResponse.totalChunks,
      });

      // Upload chunks
      const chunkSize = initiateResponse.chunkSize;
      const totalChunks = initiateResponse.totalChunks;
      const maxConcurrent = MAX_CONCURRENT_UPLOADS;
      const chunks: Array<{ index: number; blob: Blob }> = [];
      
      // Prepare all chunks
      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * chunkSize;
        const end = Math.min(start + chunkSize, fileUpload.file.size);
        const chunk = fileUpload.file.slice(start, end);
        chunks.push({ index: chunkIndex, blob: chunk });
      }

      // Upload chunks in batches
      for (let i = 0; i < chunks.length; i += maxConcurrent) {
        if (abortController.signal.aborted) {
          updateFileState(fileId, { status: 'cancelled', error: 'Upload cancelled' });
          return;
        }

        const batch = chunks.slice(i, i + maxConcurrent);
        const uploadPromises = batch.map(async ({ index, blob }) => {
          if (abortController.signal.aborted || pausedFiles.current.has(fileId)) {
            throw new Error('Upload cancelled');
          }

          // Calculate chunk hash
          const chunkHash = await calculateChunkHash(blob);

          const chunkResponse = await apiClient.uploadChunk({
            uploadId: initiateResponse.uploadId,
            chunkIndex: index,
            chunk: blob,
            chunkHash,
          });

          return { index, response: chunkResponse };
        });

        const batchResults = await Promise.all(uploadPromises);
        
        // Update progress with the latest result
        if (pausedFiles.current.has(fileId)) {
          return; // Don't update progress if paused
        }
        
        const latestResult = batchResults[batchResults.length - 1];
        const uploadedBytes = latestResult.response.uploadedChunks * chunkSize;
        const speed = calculateSpeed(fileId, uploadedBytes);
        const remainingBytes = fileUpload.file.size - uploadedBytes;
        const timeRemaining = speed > 0 ? remainingBytes / speed : 0;

        if (!abortController.signal.aborted) {
          if (pausedFiles.current.has(fileId)) {
            return; // Don't update state if paused
          }
          updateFileState(fileId, {
            progress: latestResult.response.progress,
            uploadedChunks: latestResult.response.uploadedChunks,
            speed,
            timeRemaining,
          });
        }
      }

      if (abortController.signal.aborted || pausedFiles.current.has(fileId)) {
        if (pausedFiles.current.has(fileId)) {
          // File was paused, don't change state
          return;
        }
        updateFileState(fileId, { status: 'cancelled', error: 'Upload cancelled' });
        return;
      }

      // Calculate file hash for completion
      const fileHash = await calculateFileHash(fileUpload.file);

      // Complete upload
      const completeResponse = await apiClient.completeUpload({
        uploadId: initiateResponse.uploadId,
        fileHash,
      });

      if (pausedFiles.current.has(fileId)) {
        return; // Don't complete if paused
      }

      updateFileState(fileId, {
        status: 'completed',
        progress: 100,
        speed: 0,
        timeRemaining: 0,
      });

    } catch (error) {
      if (pausedFiles.current.has(fileId)) {
        // File was paused, don't change state
        return;
      }
      
      if (abortController?.signal.aborted) {
        updateFileState(fileId, { status: 'cancelled', error: 'Upload cancelled' });
      } else {
        const errorMessage = getErrorMessage(error);
        updateFileState(fileId, {
          status: 'error',
          error: errorMessage,
          canResume: !errorMessage.includes('Invalid') && !errorMessage.includes('not found'),
        });
      }
    } finally {
      abortControllers.current.delete(fileId);
      uploadTimers.current.delete(fileId);
    }
  }, [updateFileState, updateFileData, calculateSpeed, getErrorMessage]);

  const pauseUpload = useCallback((fileId: string) => {
    // Mark file as paused first to prevent race conditions
    pausedFiles.current.add(fileId);
    
    const abortController = abortControllers.current.get(fileId);
    if (abortController) {
      abortController.abort();
      abortControllers.current.delete(fileId);
    }
    
    uploadTimers.current.delete(fileId);
    updateFileState(fileId, { 
      status: 'paused', 
      canResume: true,
      error: null
    });
  }, [updateFileState]);

  const resumeUpload = useCallback(async (fileId: string) => {
    // Remove from paused files when resuming
    pausedFiles.current.delete(fileId);
    
    const fileUpload = files.find(f => f.id === fileId);
    if (!fileUpload || !fileUpload.originalRecipientId || !fileUpload.originalSenderMobileNumber) {
      updateFileState(fileId, { 
        status: 'error', 
        error: 'Cannot resume upload - missing recipient information',
        canResume: false 
      });
      return;
    }

    // If we have an uploadId, try to resume the existing upload
    if (fileUpload.state.uploadId) {
      try {
        const resumeResponse = await apiClient.resumeUpload(fileUpload.state.uploadId);
        
        if (!resumeResponse.canResume) {
          updateFileState(fileId, { 
            status: 'error', 
            error: 'Cannot resume upload - session expired',
            canResume: false 
          });
          return;
        }

        // Continue upload from missing chunks
        const abortController = new AbortController();
        abortControllers.current.set(fileId, abortController);

        updateFileState(fileId, { 
          status: 'uploading', 
          error: null,
          uploadedChunks: resumeResponse.uploadedChunks,
          totalChunks: resumeResponse.totalChunks,
          progress: (resumeResponse.uploadedChunks / resumeResponse.totalChunks) * 100,
        });

        // Restart timing
        uploadTimers.current.set(fileId, {
          startTime: Date.now(),
          uploadedBytes: resumeResponse.uploadedChunks * resumeResponse.chunkSize,
        });

        // Upload missing chunks
        const missingChunkPromises = resumeResponse.missingChunks.map(async (chunkIndex) => {
          if (abortController.signal.aborted || pausedFiles.current.has(fileId)) {
            throw new Error('Upload cancelled');
          }

          const start = chunkIndex * resumeResponse.chunkSize;
          const end = Math.min(start + resumeResponse.chunkSize, fileUpload.file.size);
          const chunk = fileUpload.file.slice(start, end);
          
          // Calculate chunk hash
          const chunkHash = await calculateChunkHash(chunk);

          return apiClient.uploadChunk({
            uploadId: fileUpload.state.uploadId!,
            chunkIndex,
            chunk,
            chunkHash,
          });
        });

        const chunkResults = await Promise.all(missingChunkPromises);
        
        // Update with final result
        const finalResult = chunkResults[chunkResults.length - 1];
        if (finalResult && !abortController?.signal.aborted && !pausedFiles.current.has(fileId)) {
          const uploadedBytes = finalResult.uploadedChunks * resumeResponse.chunkSize;
          const speed = calculateSpeed(fileId, uploadedBytes);
          const remainingBytes = fileUpload.file.size - uploadedBytes;
          const timeRemaining = speed > 0 ? remainingBytes / speed : 0;

          updateFileState(fileId, {
            progress: finalResult.progress,
            uploadedChunks: finalResult.uploadedChunks,
            speed,
            timeRemaining,
          });
        }

        if (abortController?.signal.aborted || pausedFiles.current.has(fileId)) {
          if (pausedFiles.current.has(fileId)) {
            // File was paused during resume, don't change state
            return;
          }
          updateFileState(fileId, { status: 'cancelled', error: 'Upload cancelled' });
          return;
        }

        // Calculate file hash for completion
        const fileHash = await calculateFileHash(fileUpload.file);

        // Complete upload
        await apiClient.completeUpload({
          uploadId: fileUpload.state.uploadId,
          fileHash,
        });

        if (pausedFiles.current.has(fileId)) {
          return; // Don't complete if paused
        }

        updateFileState(fileId, {
          status: 'completed',
          progress: 100,
          speed: 0,
          timeRemaining: 0,
        });

      } catch (error) {
        if (pausedFiles.current.has(fileId)) {
          // File was paused during resume, don't change state
          return;
        }
        
        if (abortController?.signal.aborted) {
          updateFileState(fileId, { status: 'cancelled', error: 'Upload cancelled' });
        } else {
          const errorMessage = getErrorMessage(error);
          updateFileState(fileId, {
            status: 'error',
            error: errorMessage,
            canResume: !errorMessage.includes('Invalid') && !errorMessage.includes('not found'),
          });
        }
      } finally {
        abortControllers.current.delete(fileId);
        uploadTimers.current.delete(fileId);
      }
    } else {
      // No uploadId, restart the upload
      await startUpload(fileUpload, fileUpload.originalRecipientId, fileUpload.originalSenderMobileNumber);
    }
  }, [files, updateFileState, calculateSpeed, getErrorMessage, startUpload]);

  const cancelUpload = useCallback(async (fileId: string) => {
    // Remove from paused files when cancelling
    pausedFiles.current.delete(fileId);
    
    const fileUpload = files.find(f => f.id === fileId);
    const abortController = abortControllers.current.get(fileId);

    if (abortController) {
      abortController.abort();
    }

    if (fileUpload?.state.uploadId) {
      try {
        await apiClient.abortUpload(fileUpload.state.uploadId);
      } catch (error) {
        console.error('Failed to abort upload:', error);
      }
    }

    updateFileState(fileId, { 
      status: 'cancelled', 
      error: 'Upload cancelled',
      canResume: false 
    });

    abortControllers.current.delete(fileId);
    uploadTimers.current.delete(fileId);
  }, [files, updateFileState]);

  const restartUpload = useCallback(async (fileId: string) => {
    // Remove from paused files when restarting
    pausedFiles.current.delete(fileId);
    
    const fileUpload = files.find(f => f.id === fileId);
    if (!fileUpload || !fileUpload.originalRecipientId || !fileUpload.originalSenderMobileNumber) {
      updateFileState(fileId, { 
        status: 'error', 
        error: 'Cannot restart upload - missing recipient information',
        canResume: false 
      });
      return;
    }

    // Reset the file state
    updateFileState(fileId, {
      uploadId: null,
      status: 'idle',
      progress: 0,
      uploadedChunks: 0,
      totalChunks: 0,
      error: null,
      canResume: false,
      speed: 0,
      timeRemaining: 0,
    });

    // Start a new upload
    await startUpload(fileUpload, fileUpload.originalRecipientId, fileUpload.originalSenderMobileNumber);
  }, [files, updateFileState, startUpload]);

  const removeFile = useCallback((fileId: string) => {
    // Clean up paused files tracking
    pausedFiles.current.delete(fileId);
    
    const fileUpload = files.find(f => f.id === fileId);
    
    if (fileUpload) {
      // Only allow removal if the file is in a final state (completed, cancelled, error)
      const canRemove = ['completed', 'cancelled', 'error'].includes(fileUpload.state.status);
      
      if (!canRemove) {
        // If file is still active, cancel it first
        cancelUpload(fileId).then(() => {
          // Remove from state after cancellation is complete
          setTimeout(() => {
            setFiles(prev => prev.filter(f => f.id !== fileId));
          }, 100);
        });
      } else {
        // For completed/cancelled/error files, just remove from state
        setFiles(prev => prev.filter(f => f.id !== fileId));
        abortControllers.current.delete(fileId);
        uploadTimers.current.delete(fileId);
      }
    } else {
      // File not found, just remove from state
      setFiles(prev => prev.filter(f => f.id !== fileId));
      abortControllers.current.delete(fileId);
      uploadTimers.current.delete(fileId);
    }
  }, [files, cancelUpload]);

  const addFiles = useCallback((newFiles: File[]) => {
    const fileUploads = newFiles.map(createFileUpload);
    setFiles(prev => [...prev, ...fileUploads]);
    return fileUploads;
  }, [createFileUpload]);

  const clearFiles = useCallback(() => {
    // Clear paused files tracking
    pausedFiles.current.clear();
    
    // Cancel all active uploads
    files.forEach(file => {
      if (['uploading', 'paused', 'idle'].includes(file.state.status)) {
        cancelUpload(file.id);
      }
    });
    setFiles([]);
    // Clear all references
    abortControllers.current.clear();
    uploadTimers.current.clear();
  }, [files, cancelUpload]);

  return {
    files,
    addFiles,
    removeFile,
    clearFiles,
    startUpload,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    restartUpload,
  };
};