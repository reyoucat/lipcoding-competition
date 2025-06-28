import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';

const Navbar = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-gray-900">
              멘토-멘티 매칭
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link 
              to="/profile" 
              className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              프로필
            </Link>
            
            {user?.role === 'mentee' && (
              <Link 
                to="/mentors" 
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                멘토 찾기
              </Link>
            )}
            
            <Link 
              to="/requests" 
              className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              {user?.role === 'mentor' ? '받은 요청' : '보낸 요청'}
            </Link>
            
            <span className="text-sm text-gray-600">
              안녕하세요, {user?.profile?.name}님
            </span>
            
            <Button 
              variant="outline"
              size="sm"
              onClick={handleLogout}
            >
              로그아웃
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
