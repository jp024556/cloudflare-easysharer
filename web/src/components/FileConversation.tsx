import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Download, FileText, Image as ImageIcon, File, Calendar, User, Loader2, MessageCircle, Eye, Printer, Clock, AlertTriangle, ArrowLeft, Search, Filter, RefreshCw } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import { API_BASE_URL, ITEMS_PER_PAGE, FILE_EXPIRY_DAYS } from '../config/constants';

interface FileItem {
  id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  r2_url: string;
  created_at: string;
}

interface FileConversationProps {
  senderMobileNumber: string | null;
  onBack?: () => void;
  isMobile?: boolean;
  refreshTrigger?: number; // Add trigger to force refresh when unread count changes
}

const FileConversation: React.FC<FileConversationProps> = ({ 
  senderMobileNumber, 
  onBack, 
  isMobile = false,
  refreshTrigger
}) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState<'all' | 'image' | 'document'>('all');
  const [loading, setLoading] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [lastFetchedParams, setLastFetchedParams] = useState<{
    beforeTimestamp?: string;
    beforeId?: string;
  }>({});
  const [hasRefreshedForTrigger, setHasRefreshedForTrigger] = useState<number>(0);
  
  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isRefreshingRef = useRef<boolean>(false);

  const LIMIT = ITEMS_PER_PAGE;

  const fetchFiles = useCallback(async (
    senderMobile: string,
    beforeTimestamp?: string,
    beforeId?: string,
    append: boolean = false
  ) => {
    try {
      // Prevent duplicate requests with same parameters
      if (append && beforeTimestamp && beforeId) {
        const currentParams = `${beforeTimestamp}-${beforeId}`;
        const lastParams = lastFetchedParams.beforeTimestamp && lastFetchedParams.beforeId 
          ? `${lastFetchedParams.beforeTimestamp}-${lastFetchedParams.beforeId}`
          : '';
        
        if (currentParams === lastParams) {
          console.log('Skipping duplicate request with same parameters');
          return;
        }
        
        setLastFetchedParams({ beforeTimestamp, beforeId });
      }

      if (!append) {
        setLoading(true);
        setLastFetchedParams({});
      } else {
        setLoadingOlder(true);
      }
      setError(null);

      const params = new URLSearchParams({
        senderMobileNumber: senderMobile,
        limit: LIMIT.toString(),
      });

      if (append && beforeTimestamp && beforeId) {
        params.set('beforeTimestamp', beforeTimestamp);
        params.set('beforeId', beforeId);
        console.log('Fetching older files with params:', { beforeTimestamp, beforeId });
      }

      const token = localStorage.getItem('authToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const url = `${API_BASE_URL}/files/conversation?${params.toString()}`;
      console.log('API Request URL:', url);

      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const newFiles = data.files || [];
      console.log('Received files:', newFiles.length);

      if (append) {
        // Prevent duplicate files by checking IDs
        setFiles(prev => {
          const existingIds = new Set(prev.map(f => f.id));
          const uniqueNewFiles = newFiles.filter((f: FileItem) => !existingIds.has(f.id));
          console.log('Adding unique files:', uniqueNewFiles.length);
          return [...prev, ...uniqueNewFiles];
        });
      } else {
        setFiles(newFiles);
      }

      setHasMore(newFiles.length === LIMIT);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Error fetching files:', err);
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setLoading(false);
      setLoadingOlder(false);
      isRefreshingRef.current = false;
    }
  }, []);

  // Refresh conversation when refreshTrigger changes (indicating unread count update)
  useEffect(() => {
    if (
      refreshTrigger && 
      refreshTrigger !== hasRefreshedForTrigger && 
      senderMobileNumber && 
      !loading && 
      !isRefreshingRef.current
    ) {
      console.log('Refreshing conversation due to unread count update for:', senderMobileNumber);
      isRefreshingRef.current = true;
      fetchFiles(senderMobileNumber);
      setHasRefreshedForTrigger(refreshTrigger);
    }
  }, [refreshTrigger, hasRefreshedForTrigger, senderMobileNumber, loading, fetchFiles]);

  // Load older files when sentinel comes into view
  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    if (entry.isIntersecting && hasMore && !loadingOlder && files.length > 0 && senderMobileNumber) {
      const oldestFile = files[files.length - 1]; // Last file in array is oldest
      console.log('Loading older files. Oldest file:', {
        id: oldestFile.id,
        created_at: oldestFile.created_at,
        file_name: oldestFile.file_name
      });
      
      fetchFiles(
        senderMobileNumber,
        oldestFile.created_at,
        oldestFile.id,
        true
      );
    }
  }, [hasMore, loadingOlder, files, senderMobileNumber]);

  // Set up intersection observer
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(handleIntersection, {
      threshold: 0.1,
      rootMargin: '100px',
    });

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [handleIntersection]);

  // Fetch files when sender changes
  useEffect(() => {
    if (senderMobileNumber) {
      setFiles([]);
      setFilteredFiles([]);
      setSearchQuery('');
      setFileTypeFilter('all');
      setHasMore(true);
      setLastFetchedParams({});
      setHasRefreshedForTrigger(0); // Reset refresh trigger tracking
      isRefreshingRef.current = false;
      fetchFiles(senderMobileNumber);
    }
  }, [senderMobileNumber, fetchFiles]);

  // Filter and search files
  useEffect(() => {
    let filtered = [...files];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(file =>
        file.file_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply file type filter
    if (fileTypeFilter !== 'all') {
      filtered = filtered.filter(file => {
        if (fileTypeFilter === 'image') {
          return file.mime_type.startsWith('image/');
        } else if (fileTypeFilter === 'document') {
          return !file.mime_type.startsWith('image/');
        }
        return true;
      });
    }

    setFilteredFiles(filtered);
  }, [files, searchQuery, fileTypeFilter]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getExpiryInfo = (createdAt: string) => {
    const createdDate = new Date(createdAt);
    const expiryDate = new Date(createdDate.getTime() + (FILE_EXPIRY_DAYS * 24 * 60 * 60 * 1000));
    const now = new Date();
    const timeUntilExpiry = expiryDate.getTime() - now.getTime();
    
    const isExpired = timeUntilExpiry <= 0;
    const daysLeft = Math.ceil(timeUntilExpiry / (24 * 60 * 60 * 1000));
    const hoursLeft = Math.ceil(timeUntilExpiry / (60 * 60 * 1000));
    
    if (isExpired) {
      return { text: 'Expired', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30' };
    } else if (daysLeft <= 1) {
      return { 
        text: hoursLeft <= 1 ? 'Expires soon' : `${hoursLeft}h left`, 
        color: 'text-orange-600 dark:text-orange-400', 
        bgColor: 'bg-orange-100 dark:bg-orange-900/30' 
      };
    } else if (daysLeft <= 2) {
      return { 
        text: `${daysLeft}d left`, 
        color: 'text-yellow-600 dark:text-yellow-400', 
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' 
      };
    } else {
      return { 
        text: `${daysLeft}d left`, 
        color: 'text-green-600 dark:text-green-400', 
        bgColor: 'bg-green-100 dark:bg-green-900/30' 
      };
    }
  };

  const getFileIcon = (mimeType: string, fileUrl?: string) => {
    if (mimeType.startsWith('image/') && fileUrl) {
      return (
        <img 
          src={fileUrl} 
          alt="File thumbnail"
          className="w-full h-full object-cover rounded-lg"
          onError={(e) => {
            // Fallback to icon if image fails to load
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
      );
    } else if (mimeType === 'application/pdf') {
      return <FileText className="w-6 h-6" />;
    } else {
      return <File className="w-6 h-6" />;
    }
  };

  const getFileTypeColor = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
    } else if (mimeType === 'application/pdf') {
      return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
    } else {
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
    }
  };

  const formatPhoneNumber = (phoneNumber: string) => {
    if (phoneNumber.startsWith('+91') && phoneNumber.length === 13) {
      return `+91 ${phoneNumber.slice(3, 8)} ${phoneNumber.slice(8)}`;
    }
    return phoneNumber;
  };

  const handleDownload = async (file: FileItem) => {
    try {
      const response = await fetch(file.r2_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback to opening in new tab
      window.open(file.r2_url, '_blank');
    }
  };

  const handlePreview = (file: FileItem) => {
    if (file.mime_type.startsWith('image/')) {
      // Open image in new tab with viewer
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>${file.file_name}</title>
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
              <div class="info">${file.file_name}</div>
              <img src="${file.r2_url}" alt="${file.file_name}" />
            </body>
          </html>
        `);
        newWindow.document.close();
      }
    } else if (file.mime_type === 'application/pdf') {
      // Open PDF in new tab with embedded viewer
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>${file.file_name}</title>
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
                  <span class="file-name">${file.file_name}</span>
                </div>
                <a href="${file.r2_url}" download="${file.file_name}" class="download-btn">Download</a>
              </div>
              <iframe src="${file.r2_url}" class="pdf-container" type="application/pdf"></iframe>
            </body>
          </html>
        `);
        newWindow.document.close();
      }
    } else {
      // For other files, open in new tab
      window.open(file.r2_url, '_blank');
    }
  };

  const handlePrint = (file: FileItem) => {
    if (file.mime_type.startsWith('image/')) {
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>Print - ${file.file_name}</title>
              <style>
                body { 
                  margin: 0; 
                  padding: 20px; 
                  text-align: center; 
                  font-family: 'Sora', sans-serif;
                }
                img { 
                  max-width: 100%; 
                  height: auto;
                }
                .filename {
                  margin-bottom: 20px;
                  font-size: 16px;
                  font-weight: bold;
                }
                @media print { 
                  body { padding: 0; }
                  .filename { margin-bottom: 10px; }
                }
              </style>
            </head>
            <body>
              <div class="filename">${file.file_name}</div>
              <img src="${file.r2_url}" alt="${file.file_name}" onload="window.print(); window.close();" />
            </body>
          </html>
        `);
        newWindow.document.close();
      }
    } else if (file.mime_type === 'application/pdf') {
      // For PDFs, open in new window and trigger print
      const newWindow = window.open(file.r2_url, '_blank');
      if (newWindow) {
        newWindow.onload = () => {
          newWindow.print();
        };
      }
    } else {
      // For other files, just open them
      window.open(file.r2_url, '_blank');
    }
  };

  if (!senderMobileNumber) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Select a Contact
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-sm">
            Choose a contact from the left panel to view their shared files
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-gray-800">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading files...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-gray-800 p-6">
        {/* Mobile Back Button */}
        {isMobile && onBack && (
          <button
            onClick={onBack}
            className="absolute top-4 left-4 p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors z-10"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Failed to Load Files
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => fetchFiles(senderMobileNumber)}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-gray-800 p-6">
        {/* Mobile Back Button */}
        {isMobile && onBack && (
          <button
            onClick={onBack}
            className="absolute top-4 left-4 p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors z-10"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Files Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            No files have been shared by {formatPhoneNumber(senderMobileNumber)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white dark:bg-gray-800 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
          {/* Mobile Back Button */}
          {isMobile && onBack && (
            <button
              onClick={onBack}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
            <div className="w-12 h-12 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {formatPhoneNumber(senderMobileNumber)}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {filteredFiles.length} of {files.length} file{files.length !== 1 ? 's' : ''} {searchQuery || fileTypeFilter !== 'all' ? 'shown' : 'shared'}
            </p>
          </div>
          </div>
          
          {/* Right side - Refresh button and last updated */}
          <div className="flex flex-col items-end space-y-1">
          <button
            onClick={() => fetchFiles(senderMobileNumber)}
            disabled={loading}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh files"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
            {lastRefresh && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Updated: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
        
        {/* Search and Filter Controls */}
        <div className="mt-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            </div>
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 shadow-sm hover:shadow-md transition-all duration-200"
            />
          </div>
          
          {/* File Type Filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Filter className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            </div>
            <select
              value={fileTypeFilter}
              onChange={(e) => setFileTypeFilter(e.target.value as 'all' | 'image' | 'document')}
              className="w-full pl-12 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm hover:shadow-md transition-all duration-200 appearance-none cursor-pointer"
            >
              <option value="all">All Files</option>
              <option value="image">Images Only</option>
              <option value="document">Documents Only</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Files List */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {/* File Items */}
        {filteredFiles.map((file) => {
          const expiryInfo = getExpiryInfo(file.created_at);
          
          return (
            <div
              key={file.id}
              className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 sm:p-4 hover:shadow-md transition-all duration-200 border border-gray-200 dark:border-gray-600"
            >
              <div className="flex items-start space-x-3 sm:space-x-4">
                {/* File Icon/Thumbnail */}
                <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden ${getFileTypeColor(file.mime_type)}`}>
                  {getFileIcon(file.mime_type, file.r2_url)}
                  {/* Fallback icon for images */}
                  {file.mime_type.startsWith('image/') && (
                    <ImageIcon className="w-6 h-6 hidden" />
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col space-y-2 mb-3">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {file.file_name}
                    </h3>
                    
                    {/* File metadata */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center space-x-1">
                        <File className="w-3 h-3" />
                        <span>{formatFileSize(file.file_size)}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatTimestamp(file.created_at)}</span>
                      </span>
                      <span className={`flex items-center space-x-1 px-2 py-1 rounded-full ${expiryInfo.bgColor} ${expiryInfo.color}`}>
                        <Clock className="w-3 h-3" />
                        <span className="font-medium">{expiryInfo.text}</span>
                      </span>
                    </div>

                    {/* MIME type */}
                    <div>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                        {file.mime_type}
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handlePreview(file)}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Preview</span>
                    </button>
                    
                    <button
                      onClick={() => handleDownload(file)}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                    
                    <button
                      onClick={() => handlePrint(file)}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                      <Printer className="w-3 h-3" />
                      <span>Print</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Sentinel for infinite scroll - placed at the bottom */}
        <div ref={sentinelRef} className="h-1">
          {loadingOlder && (
            <div className="flex items-center justify-center py-4">
              <LoadingSpinner size="sm" />
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                Loading older files...
              </span>
            </div>
          )}
        </div>

        {/* No more files indicator */}
        {!hasMore && files.length > 0 && filteredFiles.length > 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No more files to load
            </p>
          </div>
        )}
        
        {/* No search/filter results */}
        {(searchQuery || fileTypeFilter !== 'all') && filteredFiles.length === 0 && files.length > 0 && (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              No files found
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileConversation;