import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageCircle, Home, User, Upload, LogIn, UserPlus, Menu, X, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ThemeToggle from './ThemeToggle';

const Navigation: React.FC = () => {
  const { user, signout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const publicNavigationItems = [
    { id: 'home', label: 'Home', icon: Home, path: '/' },
    { id: 'upload', label: 'Upload', icon: Upload, path: '/upload' },
  ];

  const protectedNavigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  ];

  const navigationItems = user 
    ? [...publicNavigationItems, ...protectedNavigationItems]
    : publicNavigationItems;

  const handleSignOut = () => {
    signout();
    setIsMobileMenuOpen(false);
  };

  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-9 h-9 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-200 group-hover:scale-105">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                EasySharer
              </span>
            </Link>

            {/* Desktop Navigation Items */}
            <div className="hidden md:flex items-center space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActivePath(item.path);
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    className={`relative flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 text-sm ${
                      isActive
                        ? 'bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/30 dark:to-emerald-900/30 text-teal-700 dark:text-teal-300 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600 dark:text-teal-400' : ''}`} />
                    <span>{item.label}</span>
                    {isActive && (
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-teal-500 rounded-full"></div>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Desktop Right Section */}
            <div className="hidden md:flex items-center space-x-3">
              <ThemeToggle />
              {user ? (
                <>
                  {/* User Profile */}
                  <Link
                    to="/profile"
                    className="flex items-center space-x-3 px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors"
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-600">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="hidden lg:block">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
                    </div>
                  </Link>

                  {/* Sign Out Button */}
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-2 px-3 py-2.5 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 group"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="hidden lg:inline text-sm font-medium">Sign Out</span>
                  </button>
                </>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link
                    to="/signin"
                    className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm ${
                      location.pathname === '/signin'
                        ? 'bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/30 dark:to-emerald-900/30 text-teal-700 dark:text-teal-300 shadow-sm'
                        : 'text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-900/20'
                    }`}
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign In</span>
                  </Link>
                  <Link
                    to="/register"
                    className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm ${
                      location.pathname === '/register'
                        ? 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 text-emerald-700 dark:text-emerald-300 shadow-sm'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md hover:shadow-lg'
                    }`}
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Register</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-3">
              <ThemeToggle />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden pb-4 border-t border-gray-200 dark:border-gray-700">
              <div className="pt-4 space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = isActivePath(item.path);
                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/30 dark:to-emerald-900/30 text-teal-700 dark:text-teal-300'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
                
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  {user ? (
                    <>
                      <div className="flex items-center space-x-3 px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg mb-3">
                        <Link
                          to="/profile"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center space-x-3 w-full"
                        >
                          <div className="w-10 h-10 bg-gradient-to-r from-teal-600 to-emerald-600 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{user.email}</div>
                          </div>
                        </Link>
                      </div>
                      
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center space-x-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                      >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Sign Out</span>
                      </button>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <Link
                        to="/signin"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                          location.pathname === '/signin'
                            ? 'bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/30 dark:to-emerald-900/30 text-teal-700 dark:text-teal-300'
                            : 'text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/20'
                        }`}
                      >
                        <LogIn className="w-5 h-5" />
                        <span className="font-medium">Sign In</span>
                      </Link>
                      <Link
                        to="/register"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                          location.pathname === '/register'
                            ? 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 text-emerald-700 dark:text-emerald-300'
                            : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
                        }`}
                      >
                        <UserPlus className="w-5 h-5" />
                        <span className="font-medium">Register</span>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navigation;