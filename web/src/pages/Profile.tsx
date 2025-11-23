import React, { useState, useRef } from 'react';
import { User, Mail, Calendar, Shield, Phone, Key, Download, Share2, Printer, QrCode, Eye, EyeOff, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import QRCodeLib from 'qrcode';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  // Generate QR code when component mounts
  React.useEffect(() => {
    if (user?.short_code) {
      const appBaseURL = window.location.origin;
      const qrContent = `${appBaseURL}/upload?recipientId=${user.short_code}`;
      
      QRCodeLib.toDataURL(qrContent, {
        width: 256,
        margin: 2,
        color: {
          dark: '#0f766e', // teal-700
          light: '#ffffff'
        }
      }).then(url => {
        setQrCodeDataUrl(url);
      }).catch(err => {
        console.error('Error generating QR code:', err);
      });
    }
  }, [user?.short_code]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    setIsChangingPassword(true);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordSuccess('Password changed successfully!');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => {
          setShowChangePassword(false);
          setPasswordSuccess('');
        }, 2000);
      } else {
        setPasswordError(data.message || 'Failed to change password');
      }
    } catch (error) {
      setPasswordError('Network error. Please try again.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const downloadQRCode = () => {
    if (qrCodeDataUrl) {
      const link = document.createElement('a');
      link.download = `${user?.name || 'user'}-qr-code.png`;
      link.href = qrCodeDataUrl;
      link.click();
    }
  };

  const shareQRCode = async () => {
    if (navigator.share && qrCodeDataUrl) {
      try {
        // Convert data URL to blob
        const response = await fetch(qrCodeDataUrl);
        const blob = await response.blob();
        const file = new File([blob], `${user?.name || 'user'}-qr-code.png`, { type: 'image/png' });
        
        await navigator.share({
          title: `${user?.name}'s File Share QR Code`,
          text: `Scan this QR code to send files to ${user?.name}`,
          files: [file]
        });
      } catch (error) {
        // Fallback to copying link
        const appBaseURL = window.location.origin;
        const shareUrl = `${appBaseURL}/upload?recipientId=${user?.short_code}`;
        navigator.clipboard.writeText(shareUrl);
        alert('Share link copied to clipboard!');
      }
    } else {
      // Fallback for browsers without Web Share API
      const appBaseURL = window.location.origin;
      const shareUrl = `${appBaseURL}/upload?recipientId=${user?.short_code}`;
      navigator.clipboard.writeText(shareUrl);
      alert('Share link copied to clipboard!');
    }
  };

  const printQRCode = () => {
    if (qrCodeDataUrl) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>QR Code - ${user?.name}</title>
              <style>
                body { 
                  margin: 0; 
                  padding: 40px; 
                  text-align: center; 
                  font-family: 'Sora', sans-serif;
                  background: white;
                }
                .container {
                  max-width: 400px;
                  margin: 0 auto;
                  padding: 30px;
                  border: 2px solid #e5e7eb;
                  border-radius: 16px;
                }
                h1 {
                  color: #0f766e;
                  margin-bottom: 10px;
                  font-size: 24px;
                }
                .subtitle {
                  color: #6b7280;
                  margin-bottom: 30px;
                  font-size: 16px;
                }
                .qr-code {
                  margin: 20px 0;
                }
                .instructions {
                  color: #374151;
                  font-size: 14px;
                  margin-top: 20px;
                  line-height: 1.5;
                }
                @media print { 
                  body { padding: 20px; }
                  .container { border: 1px solid #000; }
                }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>Send to ${user?.name}</h1>
                <div class="subtitle">Scan QR Code to Share Files</div>
                <div class="qr-code">
                  <img src="${qrCodeDataUrl}" alt="QR Code" style="max-width: 100%; height: auto;" />
                </div>
                <div class="instructions">
                  Scan this QR code with your phone's camera to quickly access the file upload page and send files directly to ${user?.name}.
                </div>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.onload = () => {
          printWindow.print();
          printWindow.close();
        };
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Profile</h1>
        <p className="text-gray-600 dark:text-gray-400">View your account information and manage settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-8">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center border-4 border-white/20">
                  <User className="w-10 h-10 text-white" />
                </div>
                <div className="text-white">
                  <h2 className="text-2xl font-bold">{user.name}</h2>
                  <p className="text-teal-100">{user.email}</p>
                  <div className="mt-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 text-white">
                      <Shield className="w-4 h-4 mr-1" />
                      Active User
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Profile Information</h3>

              <div className="space-y-6">
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <User className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">{user.name}</span>
                  </div>
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">{user.email}</span>
                  </div>
                </div>

                {/* Mobile Number Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mobile Number
                  </label>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">
                      {user.mobile_number || 'Not provided'}
                    </span>
                  </div>
                </div>

                {/* Short Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Your Short Code
                  </label>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <QrCode className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900 dark:text-white font-mono">{user.short_code}</span>
                  </div>
                </div>

                {/* Account Created */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Member Since
                  </label>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">{formatDate(user.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* QR Code & Actions */}
        <div className="space-y-6">
          {/* QR Code Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <QrCode className="w-5 h-5 mr-2" />
              Your QR Code
            </h3>
            
            <div className="text-center">
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Send to {user.name}
                </p>
                {qrCodeDataUrl && (
                  <div className="inline-block p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                    <img 
                      src={qrCodeDataUrl} 
                      alt="QR Code" 
                      className="w-48 h-48 mx-auto"
                    />
                  </div>
                )}
              </div>
              
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                Scan this QR code to send files to you
              </p>
              
              {/* QR Code Actions */}
              <div className="flex flex-col space-y-2">
                <button
                  onClick={downloadQRCode}
                  className="flex items-center justify-center space-x-2 w-full px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
                
                <button
                  onClick={shareQRCode}
                  className="flex items-center justify-center space-x-2 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </button>
                
                <button
                  onClick={printQRCode}
                  className="flex items-center justify-center space-x-2 w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print</span>
                </button>
              </div>
            </div>
          </div>

          {/* Security Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Security</h3>
            <div className="space-y-3">
              <button
                onClick={() => setShowChangePassword(true)}
                className="w-full text-left p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-3"
              >
                <Key className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Change Password</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Update your account password</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                  <Lock className="w-5 h-5 mr-2" />
                  Change Password
                </h3>
                <button
                  onClick={() => {
                    setShowChangePassword(false);
                    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    setPasswordError('');
                    setPasswordSuccess('');
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handlePasswordChange} className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Error/Success Messages */}
                {passwordError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                    <span className="text-sm text-red-600 dark:text-red-400">{passwordError}</span>
                  </div>
                )}

                {passwordSuccess && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <span className="text-sm text-green-600 dark:text-green-400">{passwordSuccess}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isChangingPassword ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Changing Password...</span>
                    </>
                  ) : (
                    <span>Change Password</span>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;