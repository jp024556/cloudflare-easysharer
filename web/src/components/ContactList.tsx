import React, { useState, useEffect } from 'react';
import { User, MessageCircle, ChevronRight, Loader2, Search, RefreshCw, Filter, Bell } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';
import { API_BASE_URL, CONTACTS_PER_PAGE, CONTACTS_REFRESH_INTERVAL } from '../config/constants';

interface Contact {
  sender_mobile_number: string;
  last_file_timestamp: string;
  total_files_from_sender: number;
}

interface ContactListProps {
  selectedSender: string | null;
  onSelectContact: (senderMobileNumber: string) => void;
  isConversationOpen?: boolean;
  onUnreadCountUpdate?: (senderNumber: string) => void; // Callback when unread count changes
}

// Helper functions for unread count management
const getUnreadKey = (senderNumber: string) => `unread_${senderNumber}`;
const getLastViewedKey = (senderNumber: string) => `lastViewed_${senderNumber}`;

const getUnreadCount = (senderNumber: string): number => {
  const count = localStorage.getItem(getUnreadKey(senderNumber));
  return count ? parseInt(count, 10) : 0;
};

const setUnreadCount = (senderNumber: string, count: number): void => {
  if (count <= 0) {
    localStorage.removeItem(getUnreadKey(senderNumber));
  } else {
    localStorage.setItem(getUnreadKey(senderNumber), count.toString());
  }
};

const getLastViewedTimestamp = (senderNumber: string): string | null => {
  return localStorage.getItem(getLastViewedKey(senderNumber));
};

const setLastViewedTimestamp = (senderNumber: string, timestamp: string): void => {
  localStorage.setItem(getLastViewedKey(senderNumber), timestamp);
};

const calculateUnreadCount = (contact: Contact): number => {
  const lastViewed = getLastViewedTimestamp(contact.sender_mobile_number);
  if (!lastViewed) {
    // If never viewed, all files are unread
    return contact.total_files_from_sender;
  }
  
  const lastViewedTime = new Date(lastViewed).getTime();
  const lastFileTime = new Date(contact.last_file_timestamp).getTime();
  
  // If last file is newer than last viewed, there are unread files
  // For simplicity, we'll show 1+ for any new activity
  return lastFileTime > lastViewedTime ? 1 : 0;
};

const ContactList: React.FC<ContactListProps> = ({ 
  selectedSender, 
  onSelectContact, 
  isConversationOpen = false,
  onUnreadCountUpdate 
}) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'files'>('recent');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const LIMIT = CONTACTS_PER_PAGE;

  const fetchContacts = async (page: number, append: boolean = false) => {
    try {
      if (page === 1) {
        if (append) {
          setIsRefreshing(true);
        } else {
          setLoading(true);
        }
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const token = localStorage.getItem('authToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${API_BASE_URL}/files/contacts?page=${page}&limit=${LIMIT}`,
        {
          headers,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const newContacts = data.contacts || [];

      if (append && page === 1) {
        // For refresh, replace all contacts
        setContacts(newContacts);
      } else if (append && page > 1) {
        // For load more, append new contacts
        setContacts(prev => {
          const existingNumbers = new Set(prev.map(c => c.sender_mobile_number));
          const uniqueNewContacts = newContacts.filter(c => !existingNumbers.has(c.sender_mobile_number));
          return [...prev, ...uniqueNewContacts];
        });
      } else {
        // Initial load
        setContacts(newContacts);
      }

      // Check if there are more contacts to load
      setHasMore(newContacts.length === LIMIT);
      setCurrentPage(page);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load contacts');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setIsRefreshing(false);
    }
  };

  // Update unread counts when contacts are fetched
  useEffect(() => {
    contacts.forEach(contact => {
      const calculatedUnread = calculateUnreadCount(contact);
      const currentUnread = getUnreadCount(contact.sender_mobile_number);
      
      if (calculatedUnread !== currentUnread) {
        setUnreadCount(contact.sender_mobile_number, calculatedUnread);
        
        // Notify parent if this contact has new unread messages and is currently selected
        if (calculatedUnread > currentUnread && onUnreadCountUpdate) {
          onUnreadCountUpdate(contact.sender_mobile_number);
        }
      }
    });
  }, [contacts, onUnreadCountUpdate]);

  // Auto-refresh every minute
  useEffect(() => {
    const interval = setInterval(() => {
      // Only refresh if conversation is not open or if we need to update unread counts
      if (!loading && !loadingMore && !isRefreshing && (!isConversationOpen || selectedSender)) {
        fetchContacts(1, true);
      }
    }, CONTACTS_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [loading, loadingMore, isRefreshing, isConversationOpen, selectedSender]);

  // Filter and sort contacts
  useEffect(() => {
    let filtered = [...contacts];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(contact =>
        contact.sender_mobile_number.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.last_file_timestamp).getTime() - new Date(a.last_file_timestamp).getTime();
        case 'name':
          return a.sender_mobile_number.localeCompare(b.sender_mobile_number);
        case 'files':
          return b.total_files_from_sender - a.total_files_from_sender;
        default:
          return 0;
      }
    });

    setFilteredContacts(filtered);
  }, [contacts, searchQuery, sortBy]);

  useEffect(() => {
    fetchContacts(1);
  }, []);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchContacts(currentPage + 1, true);
    }
  };

  const handleSelectContact = (senderNumber: string) => {
    setLastViewedTimestamp(senderNumber, new Date().toISOString());
    setUnreadCount(senderNumber, 0);
    onSelectContact(senderNumber);
  };

  const handleManualRefresh = () => {
    if (!isRefreshing && !loading) {
      fetchContacts(1, true);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  const formatPhoneNumber = (phoneNumber: string) => {
    // Format Indian phone numbers nicely
    if (phoneNumber.startsWith('+91') && phoneNumber.length === 13) {
      return `+91 ${phoneNumber.slice(3, 8)} ${phoneNumber.slice(8)}`;
    }
    return phoneNumber;
  };

  if (loading && contacts.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-gray-800">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading contacts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-gray-800 p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Failed to Load Contacts
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => fetchContacts(1)}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (contacts.length === 0 && !loading) {
    return (
      <div className="h-full flex items-center justify-center bg-white dark:bg-gray-800 p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Contacts Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            No files have been shared with you yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white dark:bg-gray-800 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Contacts
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {filteredContacts.length} of {contacts.length} contact{contacts.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing || loading}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh contacts"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          />
        </div>

        {/* Last Refresh Indicator - placed with refresh button */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          {lastRefresh && (
            <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
          )}
        </div>
      </div>

      {/* Contact List */}
      <div className="flex-1 overflow-y-auto">
        {/* Refresh Indicator */}
        {isRefreshing && (
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-center space-x-2 text-sm text-blue-600 dark:text-blue-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Refreshing contacts...</span>
            </div>
          </div>
        )}

        <div className="space-y-1 p-2">
          {filteredContacts.map((contact) => (
            <button
              key={contact.sender_mobile_number}
              onClick={() => handleSelectContact(contact.sender_mobile_number)}
              className={`w-full p-4 rounded-xl text-left transition-all duration-200 group ${
                selectedSender === contact.sender_mobile_number
                  ? 'bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/30 dark:to-emerald-900/30 border-2 border-teal-200 dark:border-teal-700 shadow-md'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-transparent active:bg-gray-100 dark:active:bg-gray-600'
              }`}
            >
              <div className="flex items-center space-x-4">
                {(() => {
                  const unreadCount = getUnreadCount(contact.sender_mobile_number);
                  return (
                    <>
                      {/* Avatar */}
                      <div className={`relative w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                  selectedSender === contact.sender_mobile_number
                    ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                }`}>
                  <User className="w-6 h-6" />
                      {unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </div>
                      )}
                      </div>
                    </>
                  );
                })()}

                {/* Contact Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`font-medium truncate ${
                      selectedSender === contact.sender_mobile_number
                        ? 'text-teal-900 dark:text-teal-100'
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {formatPhoneNumber(contact.sender_mobile_number)}
                    </h3>
                    <span className={`text-xs ${
                      selectedSender === contact.sender_mobile_number
                        ? 'text-teal-600 dark:text-teal-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {formatTimestamp(contact.last_file_timestamp)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className={`text-sm ${
                      selectedSender === contact.sender_mobile_number
                        ? 'text-teal-700 dark:text-teal-300'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {contact.total_files_from_sender} file{contact.total_files_from_sender !== 1 ? 's' : ''}
                    </p>
                    
                    <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${
                      selectedSender === contact.sender_mobile_number
                        ? 'text-teal-600 dark:text-teal-400'
                        : 'text-gray-400'
                    }`} />
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Load More Button */}
        {hasMore && (
          <div className="p-4">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="w-full py-3 px-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                <span>Load More Contacts</span>
              )}
            </button>
          </div>
        )}

        {/* No search results */}
        {searchQuery && filteredContacts.length === 0 && contacts.length > 0 && (
          <div className="p-6 text-center">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
              No contacts found
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Try adjusting your search query
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactList;