import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="navbar">
      <div className="container">
        <h1>멘토-멘티 매칭</h1>
        <div className="navbar-nav">
          <Link to="/profile">프로필</Link>
          {user?.role === 'mentee' && <Link to="/mentors">멘토 찾기</Link>}
          <Link to="/requests">
            {user?.role === 'mentor' ? '받은 요청' : '보낸 요청'}
          </Link>
          <span>안녕하세요, {user?.profile?.name}님</span>
          <button onClick={handleLogout} className="btn btn-secondary">
            로그아웃
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
