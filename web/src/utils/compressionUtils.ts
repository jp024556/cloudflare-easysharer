// Image compression utility - converts all images to JPG
export const compressImage = (file: File, quality: number = 0.8, maxWidth: number = 1920, maxHeight: number = 1080): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      // Convert all images to JPG format
      const outputType = 'image/jpeg';
      const fileName = file.name.replace(/\.[^/.]+$/, '.jpg');
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], fileName, {
              type: outputType,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            resolve(file); // Fallback to original if compression fails
          }
        },
        outputType,
        quality
      );
    };
    
    img.onerror = () => resolve(file); // Fallback to original if loading fails
    img.src = URL.createObjectURL(file);
  });
};

// Document compression utility (basic text-based compression)
export const compressDocument = async (file: File): Promise<File> => {
  // For documents, we'll implement a basic compression strategy
  // In a real-world scenario, you might use libraries like pako for gzip compression
  
  if (file.type === 'text/plain') {
    try {
      const text = await file.text();
      // Simple text compression by removing extra whitespace
      const compressedText = text
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .replace(/\n\s*\n/g, '\n') // Remove empty lines
        .trim();
      
      const blob = new Blob([compressedText], { type: file.type });
      return new File([blob], file.name, {
        type: file.type,
        lastModified: Date.now()
      });
    } catch (error) {
      return file; // Return original if compression fails
    }
  }
  
  // For other document types (PDF, DOC, etc.), return as-is
  // In production, you might use server-side compression or specialized libraries
  return file;
};

// Get compression settings based on file size
export const getCompressionSettings = (fileSize: number) => {
  if (fileSize > 5 * 1024 * 1024) { // > 5MB
    return { quality: 0.6, maxWidth: 1600, maxHeight: 900 };
  } else if (fileSize > 2 * 1024 * 1024) { // > 2MB
    return { quality: 0.7, maxWidth: 1800, maxHeight: 1000 };
  } else {
    return { quality: 0.8, maxWidth: 1920, maxHeight: 1080 };
  }
};

// Calculate compression ratio
export const calculateCompressionRatio = (originalSize: number, compressedSize: number): number => {
  return Math.round(((originalSize - compressedSize) / originalSize) * 100);
};