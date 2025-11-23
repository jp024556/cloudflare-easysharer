import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ContactList from '../components/ContactList';
import FileConversation from '../components/FileConversation';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [selectedSender, setSelectedSender] = useState<string | null>(null);
  const [isMobileContactsOpen, setIsMobileContactsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [conversationRefreshTrigger, setConversationRefreshTrigger] = useState(0);

  // Detect mobile device
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
      
      // On mobile, automatically show contacts if no contact is selected
      if (window.innerWidth < 1024 && !selectedSender) {
        setIsMobileContactsOpen(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-show contacts on mobile when component mounts
  React.useEffect(() => {
    if (isMobile && !selectedSender) {
      setIsMobileContactsOpen(true);
    }
  }, [isMobile, selectedSender]);

  const handleSelectContact = (senderMobileNumber: string) => {
    setSelectedSender(senderMobileNumber);
    if (isMobile) {
      setIsMobileContactsOpen(false);
    }
  };

  const handleUnreadCountUpdate = (senderNumber: string) => {
    // If the sender with updated unread count is currently selected, refresh the conversation
    if (selectedSender === senderNumber) {
      console.log('Triggering conversation refresh for selected contact:', senderNumber);
      setConversationRefreshTrigger(prev => prev + 1);
    }
  };
  
  const handleBackToContacts = () => {
    if (isMobile) {
      setSelectedSender(null);
      setIsMobileContactsOpen(true);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900">
      <div className="h-full flex relative">
        {/* Left Pane - Contact List */}
        <div className={`
          lg:w-96 lg:relative lg:translate-x-0 lg:border-r lg:border-gray-200 lg:dark:border-gray-700
          ${isMobile 
            ? selectedSender 
              ? 'hidden' 
              : 'fixed inset-0 z-40 w-full bg-white dark:bg-gray-800'
            : 'relative'
          }
          transition-all duration-300 ease-in-out
        `}>
          <ContactList
            selectedSender={selectedSender}
            onSelectContact={handleSelectContact}
            isConversationOpen={!!selectedSender}
            onUnreadCountUpdate={handleUnreadCountUpdate}
          />
        </div>

        {/* Right Pane - File Conversation */}
        <div className={`flex-1 ${isMobile && !selectedSender ? 'hidden' : ''}`}>
          <FileConversation 
            senderMobileNumber={selectedSender} 
            onBack={isMobile ? handleBackToContacts : undefined}
            isMobile={isMobile}
            refreshTrigger={conversationRefreshTrigger}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;