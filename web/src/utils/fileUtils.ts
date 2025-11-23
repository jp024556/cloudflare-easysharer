export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};

export const isDocumentFile = (file: File): boolean => {
  const documentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ];
  return documentTypes.includes(file.type);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const createFilePreview = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    if (isImageFile(file)) {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      resolve('');
    }
  });
};

export const validateRecipientId = (id: string): boolean => {
  // Basic validation - adjust regex based on your requirements
  const idPattern = /^[a-zA-Z0-9_-]{3,20}$/;
  return idPattern.test(id);
};

export const generateFileId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};