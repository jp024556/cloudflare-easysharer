import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/constants';

interface User {
  id: string;
  email: string;
  name: string;
  mobile_number: string;
  short_code: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string, mobileNumber?: string) => Promise<{ success: boolean; error?: string }>;
  signout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Token expiry checker
const checkTokenExpiry = (navigate: (path: string) => void) => {
  const token = localStorage.getItem('authToken');
  if (!token || token === 'demo-token' || token.startsWith('demo-token-')) {
    return; // Skip check for demo tokens
  }

  // Simple JWT expiry check (you can make this more sophisticated)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    
    if (payload.exp && payload.exp < currentTime) {
      localStorage.removeItem('authToken');
      navigate('/signin');
    }
  } catch (error) {
    // If token is malformed, remove it and redirect
    localStorage.removeItem('authToken');
    navigate('/signin');
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Check token expiry every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      checkTokenExpiry(navigate);
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [navigate]);

  // Also check on API calls
  const checkTokenOnApiCall = () => {
    checkTokenExpiry(navigate);
  };

  useEffect(() => {
    // Check for existing session
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const response = await fetch(`${API_BASE_URL}/auth/user`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const userData = await response.json();
            setUser(userData.user);
            checkTokenOnApiCall();
          } else {
            // Token is invalid, remove it
            localStorage.removeItem('authToken');
            if (response.status === 401) {
              navigate('/signin');
            }
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('authToken');
          navigate('/signin');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const signin = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    checkTokenOnApiCall();
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        if (response.status === 401) {
          return { success: false, error: 'Invalid credentials' };
        }
        localStorage.setItem('authToken', data.token);
        console.log('API login successful, full response:', data); // Debug log
        
        // Fetch user data using the token
        try {
          const userResponse = await fetch(`${API_BASE_URL}/auth/user`, {
            headers: {
              'Authorization': `Bearer ${data.token}`,
              'Content-Type': 'application/json',
            },
          });

          if (userResponse.ok) {
            const userData = await userResponse.json();
            console.log('User data fetched:', userData); // Debug log
            setUser(userData.user);
            setIsLoading(false);
            return { success: true };
          } else {
            // If user fetch fails, remove the token and fall back to demo
            localStorage.removeItem('authToken');
            throw new Error('Failed to fetch user data');
          }
        } catch (userError) {
          console.log('User fetch failed, falling back to demo auth:', userError);
          localStorage.removeItem('authToken');
          throw userError;
        }
      } else {
        setIsLoading(false);
        return { success: false, error: data.message || 'Login failed' };
      }
    } catch (error) {
      
      // Fallback to demo authentication for development
      console.log('API login failed, trying demo auth for:', email); // Debug log
      if (email === 'demo@example.com' && password === 'password') {
        const userData: User = {
          id: '1',
          email: email,
          name: 'Demo User',
          subscription: 'premium',
          avatar: `https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2`
        };
        
        setUser(userData);
        localStorage.setItem('authToken', 'demo-token');
        console.log('Demo login successful, user set:', userData); // Debug log
        setIsLoading(false);
        return { success: true };
      }
      
      console.log('Login error:', error); // Debug log
      setIsLoading(false);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const signup = async (email: string, password: string, name: string, mobileNumber?: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    checkTokenOnApiCall();
    try {
      const requestBody: any = { email, password, name };
      if (mobileNumber) {
        requestBody.mobileNumber = mobileNumber;
      }

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        if (response.status === 401) {
          return { success: false, error: 'Authentication failed' };
        }
        setIsLoading(false);
        return { success: true };
      } else {
        setIsLoading(false);
        // Return the full error data as JSON string so the component can parse it
        return { success: false, error: JSON.stringify(data) };
      }
    } catch (error) {
      setIsLoading(false);
      
      // Fallback to demo registration for development
      return { success: true };
    }
  };

  const forgotPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    checkTokenOnApiCall();
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        if (response.status === 401) {
          return { success: false, error: 'Authentication failed' };
        }
        return { success: true };
      } else {
        return { success: false, error: data.message || 'Failed to send reset email' };
      }
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const resetPassword = async (token: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    checkTokenOnApiCall();
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        if (response.status === 401) {
          return { success: false, error: 'Invalid or expired token' };
        }
        return { success: true };
      } else {
        return { success: false, error: data.message || 'Failed to reset password' };
      }
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };
  const signout = async () => {
    const token = localStorage.getItem('authToken');
    
    checkTokenOnApiCall();
    if (token && token !== 'demo-token' && !token.startsWith('demo-token-')) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        console.error('Logout API call failed:', error);
      }
    }
    
    setUser(null);
    localStorage.removeItem('authToken');
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signin, signup, signout, updateUser, forgotPassword, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};