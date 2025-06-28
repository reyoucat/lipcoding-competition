import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Signup from '../pages/Signup';
import { AuthProvider } from '../contexts/AuthContext';

const MockedSignup = () => (
  <BrowserRouter 
    future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }}
  >
    <AuthProvider>
      <Signup />
    </AuthProvider>
  </BrowserRouter>
);

describe('Signup Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders signup form', () => {
    render(<MockedSignup />);
    
    expect(screen.getByRole('heading', { name: '회원가입' })).toBeInTheDocument();
    expect(screen.getByLabelText('이메일')).toBeInTheDocument();
    expect(screen.getByLabelText('비밀번호 (6자 이상)')).toBeInTheDocument();
    expect(screen.getByLabelText('이름')).toBeInTheDocument();
    expect(screen.getByLabelText('역할')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '회원가입' })).toBeInTheDocument();
  });

  test('updates form fields when typing', () => {
    render(<MockedSignup />);
    
    const emailInput = screen.getByLabelText('이메일');
    const passwordInput = screen.getByLabelText('비밀번호 (6자 이상)');
    const nameInput = screen.getByLabelText('이름');
    const roleSelect = screen.getByLabelText('역할');
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'TestPassword123!' } });
    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(roleSelect, { target: { value: 'mentor' } });
    
    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('TestPassword123!');
    expect(nameInput.value).toBe('Test User');
    expect(roleSelect.value).toBe('mentor');
  });

  test('shows login link', () => {
    render(<MockedSignup />);
    
    const loginLink = screen.getByRole('link', { name: '로그인' });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink.getAttribute('href')).toBe('/login');
  });

  test('validates password minimum length', () => {
    render(<MockedSignup />);
    
    const passwordInput = screen.getByLabelText('비밀번호 (6자 이상)');
    expect(passwordInput.getAttribute('minLength')).toBe('6');
  });

  test('has mentor and mentee role options', () => {
    render(<MockedSignup />);
    
    expect(screen.getByRole('option', { name: '멘토' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: '멘티' })).toBeInTheDocument();
  });
});
