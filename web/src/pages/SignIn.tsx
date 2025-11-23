import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, MessageCircle, Loader2, Mail, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from '../components/ThemeToggle';

const SignIn: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { signin, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';
  const registrationSuccess = location.state?.registrationSuccess;
  const passwordResetSuccess = location.state?.passwordResetSuccess;

  // Redirect if already signed in
  React.useEffect(() => {
    if (user) {
      console.log('User detected in useEffect, redirecting to dashboard:', user); // Debug log
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    console.log('Attempting to sign in...'); // Debug log
    
    const result = await signin(email, password);
    console.log('Sign in result:', result); // Debug log
    
    if (result.success) {
      console.log('Sign in successful, navigating to:', from); // Debug log
      console.log('Current user state after signin:', user); // Debug log
      
      // Add a small delay to ensure state is updated
      setTimeout(() => {
        console.log('User state after timeout:', user); // Debug log
        navigate(from, { replace: true });
      }, 100);
    } else {
      setError(result.error || 'Signin failed');
    }
  };

  // Don't render if user is already signed in
  if (user) {
    console.log('User already signed in, should redirect'); // Debug log
    return null;
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
            to="/register"
            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium transition-colors"
          >
            Register
          </Link>
          <ThemeToggle />
        </div>
      </div>
      
      <div className="max-w-md w-full mt-16">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <MessageCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sign in to access your files
          </p>
        </div>

        {/* Registration Success Message */}
        {registrationSuccess && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-700 dark:text-green-300 font-medium">
              Registration successful! Please sign in with your credentials.
            </p>
          </div>
        )}

        {/* Password Reset Success Message */}
        {passwordResetSuccess && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-700 dark:text-green-300 font-medium">
              Password reset successful! Please sign in with your new password.
            </p>
          </div>
        )}

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
                  placeholder="Enter your email"
                  required
                />
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pl-12 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                  placeholder="Enter your password"
                  required
                />
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
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
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center space-y-3">
            <Link
              to="/forgot-password"
              className="block text-sm text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors duration-200"
            >
              Forgot your password?
            </Link>
            <Link
              to="/register"
              className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium transition-colors duration-200"
            >
              Don't have an account? Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;