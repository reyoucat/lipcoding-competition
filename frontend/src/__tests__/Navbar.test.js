import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../components/Navbar';

const MockedNavbar = ({ userRole = 'mentor' }) => {
  // Mock useAuth hook
  const mockUser = {
    id: userRole === 'mentor' ? 1 : 2,
    email: `${userRole}@example.com`,
    role: userRole,
    profile: {
      name: userRole === 'mentor' ? 'Test Mentor' : 'Test Mentee'
    }
  };

  React.useMemo(() => {
    require('../contexts/AuthContext').useAuth = jest.fn(() => ({
      user: mockUser,
      logout: jest.fn()
    }));
  }, []);

  return (
    <BrowserRouter 
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <Navbar />
    </BrowserRouter>
  );
};

describe('Navbar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders navigation elements for mentor', () => {
    render(<MockedNavbar userRole="mentor" />);
    
    expect(screen.getByText('멘토-멘티 매칭')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '프로필' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '로그아웃' })).toBeInTheDocument();
    expect(screen.getByText('안녕하세요, Test Mentor님')).toBeInTheDocument();
  });

  test('shows mentor-specific navigation', () => {
    render(<MockedNavbar userRole="mentor" />);
    
    expect(screen.getByRole('link', { name: '받은 요청' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '멘토 찾기' })).not.toBeInTheDocument();
  });

  test('shows mentee-specific navigation', () => {
    render(<MockedNavbar userRole="mentee" />);
    
    expect(screen.getByRole('link', { name: '멘토 찾기' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '보낸 요청' })).toBeInTheDocument();
  });
});
