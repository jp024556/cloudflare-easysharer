import { useState, useCallback } from 'react';
import { FileData } from '../types';
import { isImageFile, isDocumentFile, createFilePreview, generateFileId } from '../utils/fileUtils';
import { compressImage, compressDocument, getCompressionSettings, calculateCompressionRatio } from '../utils/compressionUtils';
import { MAX_FILE_SIZE, MAX_FILES, MAX_TOTAL_SIZE } from '../config/constants';

export const useFileUpload = (maxSize: number = MAX_FILE_SIZE, maxFiles: number = MAX_FILES, maxTotalSize: number = MAX_TOTAL_SIZE) => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compressionStats, setCompressionStats] = useState<{
    originalSize: number;
    compressedSize: number;
    filesCompressed: number;
  }>({ originalSize: 0, compressedSize: 0, filesCompressed: 0 });

  const processFiles = useCallback(async (fileList: FileList) => {
    setIsProcessing(true);
    setError(null);

    try {
      const processedFiles: FileData[] = [];
      let totalOriginalSize = 0;
      let totalCompressedSize = 0;
      let filesCompressed = 0;
      
      // Check if adding these files would exceed the maximum file count
      if (files.length + fileList.length > maxFiles) {
        setError(`Cannot add ${fileList.length} files. Maximum ${maxFiles} files allowed. Currently have ${files.length} files.`);
        setIsProcessing(false);
        return;
      }
      
      // Calculate current total size
      const currentTotalSize = files.reduce((total, file) => total + file.size, 0);
      let newFilesSize = 0;
      
      for (let i = 0; i < fileList.length; i++) {
        const originalFile = fileList[i];
        totalOriginalSize += originalFile.size;
        
        // Validate file type first
        if (!isImageFile(originalFile) && !isDocumentFile(originalFile)) {
          setError(`File "${originalFile.name}" is not a supported file type`);
          continue;
        }
        
        let processedFile = originalFile;
        let wasCompressed = false;
        
        // Compress the file if it's an image or text document
        if (isImageFile(originalFile)) {
          const settings = getCompressionSettings(originalFile.size);
          processedFile = await compressImage(originalFile, settings.quality, settings.maxWidth, settings.maxHeight);
          wasCompressed = processedFile.size < originalFile.size;
        } else if (isDocumentFile(originalFile)) {
          processedFile = await compressDocument(originalFile);
          wasCompressed = processedFile.size < originalFile.size;
        }
        
        if (wasCompressed) {
          filesCompressed++;
        }
        
        totalCompressedSize += processedFile.size;
        
        // Validate file size after compression
        if (processedFile.size > maxSize) {
          setError(`File "${originalFile.name}" exceeds maximum size of ${maxSize / (1024 * 1024)}MB even after compression`);
          continue;
        }
        
        // Check total size limit
        newFilesSize += processedFile.size;
        if (currentTotalSize + newFilesSize > maxTotalSize) {
          setError(`Adding these files would exceed the maximum total size of ${maxTotalSize / (1024 * 1024)}MB`);
          break;
        }
        
        const fileData: FileData = {
          id: generateFileId(),
          file: processedFile,
          originalFile: originalFile,
          type: isImageFile(originalFile) ? 'image' : 'document',
          size: processedFile.size,
          originalSize: originalFile.size,
          name: originalFile.name,
          preview: await createFilePreview(processedFile),
          compressed: wasCompressed
        };
        
        processedFiles.push(fileData);
      }
      
      // Update compression stats
      setCompressionStats(prev => ({
        originalSize: prev.originalSize + totalOriginalSize,
        compressedSize: prev.compressedSize + totalCompressedSize,
        filesCompressed: prev.filesCompressed + filesCompressed
      }));
      
      setFiles(prev => [...prev, ...processedFiles]);
    } catch (err) {
      setError('Error processing files. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [maxSize, maxFiles, maxTotalSize, files]);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove) {
        // Update compression stats when removing files
        setCompressionStats(prevStats => ({
          originalSize: prevStats.originalSize - (fileToRemove.originalSize || fileToRemove.size),
          compressedSize: prevStats.compressedSize - fileToRemove.size,
          filesCompressed: fileToRemove.compressed ? prevStats.filesCompressed - 1 : prevStats.filesCompressed
        }));
      }
      return prev.filter(f => f.id !== id);
    });
    setError(null); // Clear error when removing files
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
    setError(null);
    setCompressionStats({ originalSize: 0, compressedSize: 0, filesCompressed: 0 });
  }, []);

  const getTotalSize = useCallback(() => {
    return files.reduce((total, file) => total + file.size, 0);
  }, [files]);

  const getCompressionRatio = useCallback(() => {
    if (compressionStats.originalSize === 0) return 0;
    return calculateCompressionRatio(compressionStats.originalSize, compressionStats.compressedSize);
  }, [compressionStats]);

  return {
    files,
    isProcessing,
    error,
    processFiles,
    removeFile,
    clearFiles,
    getTotalSize,
    compressionStats,
    getCompressionRatio
  };
};