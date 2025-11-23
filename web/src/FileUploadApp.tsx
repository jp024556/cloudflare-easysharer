import React, { useState, useEffect } from 'react';
import { Send, Loader2, AlertCircle, MessageCircle, Zap, TrendingDown, User } from 'lucide-react';
import AttachmentDropdown from './components/AttachmentDropdown';
import DragDropZone from './components/DragDropZone';
import ChunkedUploadProgress from './components/ChunkedUploadProgress';
import FilePreview from './components/FilePreview';
import FileModal from './components/FileModal';
import { useFileUpload } from './hooks/useFileUpload';
import { useChunkedUpload } from './hooks/useChunkedUpload';
import { validateRecipientId, formatFileSize } from './utils/fileUtils';
import { apiClient } from './utils/apiClient';
import { MAX_FILE_SIZE, MAX_FILES, MAX_TOTAL_SIZE } from './config/constants';

const FileUploadApp: React.FC = () => {
  const [recipientId, setRecipientId] = useState('');
  const [senderName, setSenderName] = useState('');
  const [showRecipientField, setShowRecipientField] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [resolvedRecipientId, setResolvedRecipientId] = useState<string | null>(null);
  const [isResolvingRecipient, setIsResolvingRecipient] = useState(false);
  const [recipientError, setRecipientError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  const { 
    files, 
    isProcessing, 
    error, 
    processFiles, 
    clearFiles, 
    getTotalSize, 
    compressionStats,
    getCompressionRatio,
    removeFile
  } = useFileUpload(MAX_FILE_SIZE, MAX_FILES, MAX_TOTAL_SIZE);

  const chunkedUpload = useChunkedUpload();

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check for recipientId in URL query parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlRecipientId = urlParams.get('recipientId');
    if (urlRecipientId) {
      setRecipientId(urlRecipientId);
      setShowRecipientField(false);
    }
  }, []);

  // Resolve recipient ID when it changes
  useEffect(() => {
    const resolveRecipient = async () => {
      if (!recipientId.trim()) {
        setResolvedRecipientId(null);
        setRecipientError(null);
        return;
      }

      setIsResolvingRecipient(true);
      setRecipientError(null);

      try {
        const response = await apiClient.resolveShortCode(recipientId);
        setResolvedRecipientId(response.recipientId);
      } catch (error) {
        let errorMessage = 'Failed to resolve recipient';
        
        if (error instanceof Error) {
          if (error.message.includes('404')) {
            errorMessage = 'Recipient ID not found. Please check and try again.';
          } else if (error.message.includes('400')) {
            errorMessage = 'Invalid recipient ID format.';
          } else if (error.message.includes('500')) {
            errorMessage = 'Server error. Please try again later.';
          } else {
            errorMessage = error.message;
          }
        }
        
        setRecipientError(errorMessage);
        setResolvedRecipientId(null);
      } finally {
        setIsResolvingRecipient(false);
      }
    };

    const timeoutId = setTimeout(resolveRecipient, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [recipientId]);

  const isValidName = (name: string): boolean => {
    return name.trim().length >= 2;
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (files.length === 0) {
      errors.push("Please select at least one file to upload");
    }
    if (!recipientId.trim()) {
      errors.push("Please enter a recipient ID");
    } else if (recipientError) {
      errors.push(recipientError);
    } else if (!resolvedRecipientId) {
      errors.push("Please wait while we validate the recipient ID");
    }
    if (!senderName.trim()) {
      errors.push("Please enter your name");
    } else if (!isValidName(senderName)) {
      errors.push("Name must be at least 2 characters long");
    }
    if (isProcessing) {
      errors.push("Please wait while files are being processed");
    }
    
    return errors;
  };

  const canStartUploads = 
    files.length > 0 && 
    resolvedRecipientId && 
    isValidName(senderName) && 
    !isProcessing;

  const handleStartUploads = async () => {
    const errors = validateForm();
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      setShowValidationDialog(true);
      return;
    }

    // Add files to chunked upload
    const fileUploads = chunkedUpload.addFiles(files.map(f => f.file));

    // Start uploading all files automatically
    fileUploads.forEach(fileUpload => {
      chunkedUpload.startUpload(fileUpload, resolvedRecipientId, senderName);
    });

    // Clear the original files since they're now managed by chunked upload
    clearFiles();
    setValidationErrors([]);
  };

  const handleResumeUpload = (fileId: string) => {
    chunkedUpload.resumeUpload(fileId);
  };

  const handleRestartUpload = (fileId: string) => {
    chunkedUpload.restartUpload(fileId);
  };

  const handlePreviewFile = (fileData: any) => {
    if (fileData.type === 'image' && fileData.preview) {
      // Open image in new tab
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>${fileData.name}</title>
              <style>
                body { 
                  margin: 0; 
                  padding: 20px; 
                  background: #000; 
                  display: flex; 
                  justify-content: center; 
                  align-items: center; 
                  min-height: 100vh;
                  font-family: 'Sora', sans-serif;
                }
                img { 
                  max-width: 100%; 
                  max-height: 100vh; 
                  object-fit: contain;
                  border-radius: 8px;
                  box-shadow: 0 10px 30px rgba(255,255,255,0.1);
                }
                .info {
                  position: fixed;
                  top: 20px;
                  left: 20px;
                  color: white;
                  background: rgba(0,0,0,0.7);
                  padding: 10px 15px;
                  border-radius: 8px;
                  font-size: 14px;
                }
              </style>
            </head>
            <body>
              <div class="info">${fileData.name}</div>
              <img src="${fileData.preview}" alt="${fileData.name}" />
            </body>
          </html>
        `);
        newWindow.document.close();
      }
    } else if (fileData.file.type === 'application/pdf') {
      // Open PDF in new tab with embedded viewer
      const url = URL.createObjectURL(fileData.file);
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>${fileData.name}</title>
              <style>
                body { 
                  margin: 0; 
                  padding: 0; 
                  background: #2a2a2a; 
                  font-family: 'Sora', sans-serif;
                  overflow: hidden;
                }
                .header {
                  background: linear-gradient(135deg, #0d9488 0%, #059669 100%);
                  color: white;
                  padding: 15px 20px;
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .file-info {
                  display: flex;
                  align-items: center;
                  gap: 10px;
                }
                .file-icon {
                  font-size: 24px;
                }
                .file-name {
                  font-weight: 600;
                  font-size: 16px;
                }
                .download-btn {
                  background: rgba(255,255,255,0.2);
                  border: 1px solid rgba(255,255,255,0.3);
                  color: white;
                  padding: 8px 16px;
                  border-radius: 6px;
                  text-decoration: none;
                  font-weight: 500;
                  transition: all 0.2s;
                }
                .download-btn:hover {
                  background: rgba(255,255,255,0.3);
                }
                .pdf-container {
                  width: 100%;
                  height: calc(100vh - 70px);
                  border: none;
                }
              </style>
            </head>
            <body>
              <div class="header">
                <div class="file-info">
                  <span class="file-icon">📄</span>
                  <span class="file-name">${fileData.name}</span>
                </div>
                <a href="${url}" download="${fileData.name}" class="download-btn">Download</a>
              </div>
              <iframe src="${url}" class="pdf-container" type="application/pdf"></iframe>
            </body>
          </html>
        `);
        newWindow.document.close();
      }
    } else {
      // For other documents, create a download link
      const url = URL.createObjectURL(fileData.file);
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>${fileData.name}</title>
              <style>
                body { 
                  margin: 0; 
                  padding: 40px; 
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                  font-family: 'Sora', sans-serif;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                }
                .container {
                  background: white;
                  padding: 40px;
                  border-radius: 16px;
                  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                  text-align: center;
                  max-width: 500px;
                }
                .icon {
                  font-size: 64px;
                  margin-bottom: 20px;
                }
                h1 {
                  color: #333;
                  margin-bottom: 10px;
                  font-size: 24px;
                }
                p {
                  color: #666;
                  margin-bottom: 30px;
                  font-size: 16px;
                }
                .download-btn {
                  background: #0d9488;
                  color: white;
                  padding: 12px 24px;
                  border: none;
                  border-radius: 8px;
                  font-size: 16px;
                  font-weight: 600;
                  cursor: pointer;
                  text-decoration: none;
                  display: inline-block;
                  transition: background 0.2s;
                }
                .download-btn:hover {
                  background: #0f766e;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="icon">📄</div>
                <h1>${fileData.name}</h1>
                <p>Click the button below to download this document</p>
                <a href="${url}" download="${fileData.name}" class="download-btn">Download File</a>
              </div>
            </body>
          </html>
        `);
        newWindow.document.close();
      }
    }
  };

  const handleFilesDrop = (fileList: FileList) => {
    processFiles(fileList);
    setIsDropdownOpen(false);
  };

  const DragDropWrapper = isMobile ? React.Fragment : DragDropZone;
  const dragDropProps = isMobile ? {} : { onFilesDrop: handleFilesDrop, className: "w-full" };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <DragDropWrapper {...dragDropProps}>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-300">
          <div className="p-6">
            {/* Recipient Field */}
            <div className="mb-6">
              <label htmlFor="recipientId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Send to (Recipient ID) *
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="recipientId"
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                  placeholder="Enter recipient ID"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                    recipientError ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  required
                />
                {isResolvingRecipient && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="w-5 h-5 animate-spin text-teal-500" />
                  </div>
                )}
              </div>
              {recipientError && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {recipientError}
                </p>
              )}
              {resolvedRecipientId && !recipientError && (
                <p className="mt-2 text-sm text-green-600 dark:text-green-400 flex items-center">
                  <div className="w-4 h-4 mr-2 font-bold">✓</div>
                  Recipient found
                </p>
              )}
            </div>

            {/* Sender Name */}
            <div className="mb-6">
              <label htmlFor="senderName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  id="senderName"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="Enter your name"
                  className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200 bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600 ${
                    senderName && !isValidName(senderName) ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  maxLength={50}
                  required
                />
              </div>
              {senderName && !isValidName(senderName) && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Please enter a valid name (at least 2 characters)
                </p>
              )}
            </div>

            {/* Chunked Upload Progress */}
            <ChunkedUploadProgress
              files={chunkedUpload.files}
              onPause={chunkedUpload.pauseUpload}
              onResume={handleResumeUpload}
              onCancel={chunkedUpload.cancelUpload}
              onRestart={handleRestartUpload}
              onRemove={chunkedUpload.removeFile}
              onClearAll={chunkedUpload.clearFiles}
            />

            {/* File Upload Stats */}
            {files.length > 0 && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <div className="text-blue-700 dark:text-blue-300">
                    <span className="font-medium">{files.length}</span> of <span className="font-medium">{MAX_FILES}</span> files
                  </div>
                  <div className="text-blue-700 dark:text-blue-300">
                    <span className="font-medium">{formatFileSize(getTotalSize())}</span> of <span className="font-medium">{formatFileSize(MAX_TOTAL_SIZE)}</span>
                  </div>
                </div>
                <div className="mt-2 w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                  <div 
                    className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((getTotalSize() / MAX_TOTAL_SIZE) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Compression Stats */}
            {compressionStats.filesCompressed > 0 && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">
                      Compression Applied
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
                    <TrendingDown className="w-4 h-4" />
                    <span className="font-medium">{getCompressionRatio()}% reduction</span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                  {compressionStats.filesCompressed} file{compressionStats.filesCompressed !== 1 ? 's' : ''} compressed • 
                  Saved {formatFileSize(compressionStats.originalSize - compressionStats.compressedSize)}
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 mr-3" />
                  <span className="text-sm text-red-700 dark:text-red-400 font-medium">{error}</span>
                </div>
              </div>
            )}

            {/* File Preview */}
            {files.length > 0 && (
              <FilePreview
                files={files}
                onRemoveFile={removeFile}
                onShowMore={files.length > 3 ? () => setIsModalOpen(true) : undefined}
                onClearAll={clearFiles}
                onPreviewFile={handlePreviewFile}
              />
            )}

            {/* Drag & Drop Hint - Hidden on Mobile */}
            {files.length === 0 && !isMobile && (
              <div className="mb-6 p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center bg-gray-50 dark:bg-gray-700/50">
                <div className="text-gray-500 dark:text-gray-400">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">📎</span>
                  </div>
                  <p className="text-lg font-medium mb-2 text-gray-700 dark:text-gray-300">Drag and drop files here</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">or use the attachment button below</p>
                </div>
              </div>
            )}

            {/* Input Area - WhatsApp Style */}
            <div className="flex items-end space-x-3 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <div className="flex-1">
                <AttachmentDropdown
                  onFileSelect={processFiles}
                  isOpen={isDropdownOpen}
                  onToggle={() => setIsDropdownOpen(!isDropdownOpen)}
                />
              </div>
              
              <button
                onClick={handleStartUploads}
                className="flex items-center justify-center w-12 h-12 rounded-full bg-teal-500 hover:bg-teal-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95"
                aria-label="Start upload"
                title="Start upload"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>

            {/* Processing Indicator */}
            {isProcessing && (
              <div className="mt-4 flex items-center justify-center text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 py-3 rounded-lg">
                <Loader2 className="w-5 h-5 animate-spin mr-3 text-blue-500 dark:text-blue-400" />
                <span className="font-medium">Processing and compressing files...</span>
              </div>
            )}
          </div>
        </div>
      </DragDropWrapper>

      {/* Validation Dialog */}
      {showValidationDialog && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Please Complete Required Fields
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Please fix the following issues before uploading:
                </p>
              </div>

              <div className="space-y-3 mb-6">
                {validationErrors.map((error, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                  >
                    <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">{index + 1}</span>
                    </div>
                    <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                      {error}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowValidationDialog(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  Got it
                </button>
                <button
                  onClick={() => {
                    setShowValidationDialog(false);
                    // Focus on the first empty field
                    if (!recipientId.trim()) {
                      document.getElementById('recipientId')?.focus();
                    } else if (!senderName.trim()) {
                      document.getElementById('senderName')?.focus();
                    }
                  }}
                  className="flex-1 px-4 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors font-medium"
                >
                  Fix Issues
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Modal */}
      <FileModal
        files={files}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRemoveFile={removeFile}
        onPreviewFile={handlePreviewFile}
      />

      {/* File Info */}
      <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg p-4 border border-gray-200/30 dark:border-gray-700/30">
        <div className="space-y-1">
          <p className="font-medium">📏 Maximum: {formatFileSize(MAX_FILE_SIZE)} per file • {MAX_FILES} files total • {formatFileSize(MAX_TOTAL_SIZE)} total size</p>
          <p>📄 Supported formats: PDF, DOC, DOCX, TXT, XLS, XLSX, PPT, PPTX, JPG, PNG, GIF</p>
          <p className="text-xs text-orange-600 dark:text-orange-400">⏰ Files expire automatically after 7 days</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center justify-center space-x-1">
            <Zap className="w-3 h-3" />
            <span>Images are automatically converted to JPG and compressed</span>
          </p>
          {!isMobile && (
            <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center justify-center space-x-1">
              <span>💡</span>
              <span>Tip: You can drag and drop files directly onto the interface</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUploadApp;