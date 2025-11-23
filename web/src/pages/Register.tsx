import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, MessageCircle, Loader2, Mail, Lock, User, Phone, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from '../components/ThemeToggle';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Array<{
    field: string;
    message: string;
    code: string;
  }>>([]);
  const { signup, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  // Redirect if already signed in
  React.useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);
  const isValidMobileNumber = (number: string): boolean => {
    return /^[6-9]\d{9}$/.test(number);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setValidationErrors([]);

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (mobileNumber && !isValidMobileNumber(mobileNumber)) {
      setError('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    const result = await signup(email, password, name, mobileNumber);
    if (result.success) {
      navigate('/signin', { 
        replace: true, 
        state: { registrationSuccess: true } 
      });
    } else {
      // Try to parse detailed error format
      try {
        const errorData = JSON.parse(result.error || '{}');
        if (errorData.details && Array.isArray(errorData.details)) {
          const parsedErrors = errorData.details.map((detail: any) => ({
            field: detail.path?.[0] || 'general',
            message: detail.message || 'Invalid input',
            code: detail.code || 'unknown'
          }));
          setValidationErrors(parsedErrors);
          setError(errorData.error || 'Please fix the following issues:');
        } else {
          setError(result.error || 'Registration failed');
        }
      } catch {
        // If parsing fails, show the original error
        setError(result.error || 'Registration failed');
      }
    }
  };

  // Helper function to get field-specific errors
  const getFieldErrors = (fieldName: string) => {
    return validationErrors.filter(err => err.field === fieldName);
  };

  // Helper function to check if field has errors
  const hasFieldErrors = (fieldName: string) => {
    return getFieldErrors(fieldName).length > 0;
  };
  // Don't render if user is already signed in
  if (user) {
    return null;
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 transition-colors duration-300">
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
          <div className="w-20 h-20 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <User className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Create Account
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Join our secure file sharing platform
          </p>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-4 py-3 pl-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 ${
                    hasFieldErrors('name') ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter your full name"
                  required
                />
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              </div>
              {hasFieldErrors('name') && (
                <div className="mt-2 space-y-1">
                  {getFieldErrors('name').map((error, index) => (
                    <p key={index} className="text-sm text-red-600 dark:text-red-400 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                      {error.message}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-4 py-3 pl-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 ${
                    hasFieldErrors('email') ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter your email"
                  required
                />
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              </div>
              {hasFieldErrors('email') && (
                <div className="mt-2 space-y-1">
                  {getFieldErrors('email').map((error, index) => (
                    <p key={index} className="text-sm text-red-600 dark:text-red-400 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                      {error.message}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Number Field */}
            <div>
              <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mobile Number (Optional)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  id="mobileNumber"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className={`w-full px-4 py-3 pl-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 ${
                    (mobileNumber && !isValidMobileNumber(mobileNumber)) || hasFieldErrors('mobileNumber')
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter 10-digit mobile number"
                  maxLength={10}
                />
                <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              </div>
              {((mobileNumber && !isValidMobileNumber(mobileNumber)) || hasFieldErrors('mobileNumber')) && (
                <div className="mt-2 space-y-1">
                  {mobileNumber && !isValidMobileNumber(mobileNumber) && (
                    <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                      Please enter a valid 10-digit Indian mobile number
                    </p>
                  )}
                  {getFieldErrors('mobileNumber').map((error, index) => (
                    <p key={index} className="text-sm text-red-600 dark:text-red-400 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                      {error.message}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-4 py-3 pl-12 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 ${
                    hasFieldErrors('password') ? 'border-red-400 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
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
              {hasFieldErrors('password') && (
                <div className="mt-2 space-y-1">
                  {getFieldErrors('password').map((error, index) => (
                    <p key={index} className="text-sm text-red-600 dark:text-red-400 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                      {error.message}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* General Error Messages */}
            {(error || validationErrors.length > 0) && (
              <div className="space-y-3">
                {error && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-center">
                      <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 mr-3 flex-shrink-0" />
                      <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
                    </div>
                  </div>
                )}
                
                {/* General validation errors (not field-specific) */}
                {validationErrors.filter(err => err.field === 'general').length > 0 && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="space-y-2">
                      {validationErrors.filter(err => err.field === 'general').map((error, index) => (
                        <div key={index} className="flex items-center">
                          <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 mr-2 flex-shrink-0" />
                          <p className="text-sm text-red-600 dark:text-red-400">{error.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Create Account</span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/signin"
              className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium transition-colors duration-200"
            >
              Already have an account? Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
