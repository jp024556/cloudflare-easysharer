import { MAX_CONCURRENT_UPLOADS } from '../config/constants';

// Simulate file upload with progress tracking
export const uploadFileWithProgress = (
  file: File,
  onProgress: (progress: number, speed: number, timeRemaining: number) => void
): Promise<{ success: boolean; error?: string }> => {
  return new Promise((resolve) => {
    let progress = 0;
    const fileSize = file.size;
    const startTime = Date.now();
    
    // Simulate realistic upload speed (varies between 1-5 MB/s)
    const baseSpeed = 1024 * 1024 * (1 + Math.random() * 4); // 1-5 MB/s
    const chunkSize = Math.max(fileSize / 100, 1024); // At least 1KB chunks
    
    const uploadChunk = () => {
      if (progress >= 100) {
        resolve({ success: true });
        return;
      }
      
      // Simulate network variability
      const currentSpeed = baseSpeed * (0.7 + Math.random() * 0.6); // ±30% speed variation
      const progressIncrement = (chunkSize / fileSize) * 100;
      progress = Math.min(progress + progressIncrement, 100);
      
      // Calculate upload statistics
      const elapsedTime = (Date.now() - startTime) / 1000;
      const uploadedBytes = (progress / 100) * fileSize;
      const averageSpeed = uploadedBytes / elapsedTime;
      const remainingBytes = fileSize - uploadedBytes;
      const timeRemaining = remainingBytes / averageSpeed;
      
      onProgress(Math.round(progress), averageSpeed, timeRemaining);
      
      // Simulate occasional network hiccups
      const delay = Math.random() < 0.1 ? 200 + Math.random() * 300 : 50 + Math.random() * 100;
      
      setTimeout(uploadChunk, delay);
    };
    
    // Start upload after a brief delay
    setTimeout(uploadChunk, 100);
  });
};

// Batch upload multiple files
export const uploadFiles = async (
  files: Array<{ id: string; file: File; name: string }>,
  onFileProgress: (fileId: string, progress: number, speed: number, timeRemaining: number) => void,
  onFileError: (fileId: string, error: string) => void
): Promise<{ success: boolean; results: Array<{ fileId: string; success: boolean; error?: string }> }> => {
  const results: Array<{ fileId: string; success: boolean; error?: string }> = [];
  
  // Upload files concurrently (max 3 at a time to simulate realistic constraints)
  const maxConcurrent = MAX_CONCURRENT_UPLOADS;
  const chunks = [];
  
  for (let i = 0; i < files.length; i += maxConcurrent) {
    chunks.push(files.slice(i, i + maxConcurrent));
  }
  
  for (const chunk of chunks) {
    const promises = chunk.map(async (fileData) => {
      try {
        // Simulate random upload failures (5% chance)
        if (Math.random() < 0.05) {
          onFileError(fileData.id, 'Network error occurred');
          return { fileId: fileData.id, success: false, error: 'Network error occurred' };
        }
        
        const result = await uploadFileWithProgress(
          fileData.file,
          (progress, speed, timeRemaining) => {
            onFileProgress(fileData.id, progress, speed, timeRemaining);
          }
        );
        
        return { fileId: fileData.id, success: result.success, error: result.error };
      } catch (error) {
        const errorMessage = 'Upload failed unexpectedly';
        onFileError(fileData.id, errorMessage);
        return { fileId: fileData.id, success: false, error: errorMessage };
      }
    });
    
    const chunkResults = await Promise.all(promises);
    results.push(...chunkResults);
  }
  
  const allSuccessful = results.every(r => r.success);
  return { success: allSuccessful, results };
};