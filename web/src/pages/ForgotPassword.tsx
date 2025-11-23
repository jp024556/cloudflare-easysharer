import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle, Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from '../components/ThemeToggle';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { forgotPassword, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already signed in
  React.useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await forgotPassword(email);
    setIsLoading(false);

    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error || 'Failed to send reset email');
    }
  };

  // Don't render if user is already signed in
  if (user) {
    return null;
  }
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 transition-colors duration-300">
        {/* Navigation */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <Link to="/upload" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">FileShare</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <Link
              to="/upload"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
            >
              Upload Files
            </Link>
            <Link
              to="/signin"
              className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium transition-colors"
            >
              Sign In
            </Link>
            <ThemeToggle />
          </div>
        </div>
        
        <div className="max-w-md w-full mt-16">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Check Your Email
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              We've sent a password reset link to your email address
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8">
            <div className="text-center space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-700 dark:text-green-300">
                  Password reset instructions have been sent to <strong>{email}</strong>
                </p>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Please check your email and click the reset link to create a new password. 
                The link will expire in 1 hour.
              </p>
              
              <div className="pt-4">
                <Link
                  to="/signin"
                  className="inline-flex items-center space-x-2 text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium transition-colors duration-200"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 transition-colors duration-300">
      {/* Navigation */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
        <Link to="/upload" className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-lg flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-white">EasySharer</span>
        </Link>
        
        <div className="flex items-center space-x-4">
          <Link
            to="/upload"
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
          >
            Upload Files
          </Link>
          <Link
            to="/signin"
            className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium transition-colors"
          >
            Sign In
          </Link>
          <ThemeToggle />
        </div>
      </div>
      
      <div className="max-w-md w-full mt-16">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <Mail className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Forgot Password?
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Enter your email address and we'll send you a reset link
          </p>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 pl-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                  placeholder="Enter your email address"
                  required
                />
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Sending Reset Link...</span>
                </>
              ) : (
                <span>Send Reset Link</span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/signin"
              className="inline-flex items-center space-x-2 text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
