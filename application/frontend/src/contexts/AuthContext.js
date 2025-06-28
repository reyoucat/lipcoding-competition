import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Set up axios interceptors
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUserProfile();
    } else {
      setLoading(false);
    }

    // Response interceptor to handle auth errors
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get('/api/me');
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/login', { email, password });
      const { token } = response.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      await fetchUserProfile();
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
    }
  };

  const signup = async (email, password, name, role) => {
    try {
      await axios.post('/api/signup', { email, password, name, role });
      return { success: true };
    } catch (error) {
      console.error('Signup error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Signup failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    try {
      await axios.put('/api/me', profileData);
      await fetchUserProfile(); // Refresh user data
      return { success: true };
    } catch (error) {
      console.error('Update profile error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Update failed' 
      };
    }
  };

  const uploadImage = async (imageFile) => {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const response = await axios.post('/api/me/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      await fetchUserProfile(); // Refresh user data
      return { success: true, imageUrl: response.data.imageUrl };
    } catch (error) {
      console.error('Upload image error:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Upload failed' 
      };
    }
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    updateProfile,
    uploadImage,
    fetchUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
