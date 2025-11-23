export interface FileData {
  id: string;
  file: File;
  originalFile?: File;
  type: 'image' | 'document';
  preview?: string;
  size: number;
  originalSize?: number;
  name: string;
  compressed?: boolean;
}

export interface FileUploadProps {
  onFilesSelected: (files: FileData[]) => void;
  maxFiles?: number;
  maxSize?: number;
}

export interface FilePreviewProps {
  files: FileData[];
  onRemoveFile: (id: string) => void;
  onShowMore?: () => void;
  onClearAll?: () => void;
  onPreviewFile?: (fileData: FileData) => void;
}

export interface FileModalProps {
  files: FileData[];
  isOpen: boolean;
  onClose: () => void;
  onRemoveFile: (id: string) => void;
  onPreviewFile?: (fileData: FileData) => void;
}

export interface AttachmentDropdownProps {
  onFileSelect: (files: FileList) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export interface DragDropZoneProps {
  onFilesDrop: (files: FileList) => void;
  children: React.ReactNode;
  className?: string;
}