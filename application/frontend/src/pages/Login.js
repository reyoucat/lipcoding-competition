import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      navigate('/profile');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '400px', margin: '100px auto' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>로그인</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">이메일</label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-control"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-control"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {error && <div className="error">{error}</div>}

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <p>
            계정이 없으신가요? <Link to="/signup">회원가입</Link>
          </p>
        </div>

        {/* 테스트용 계정 안내 */}
        <div style={{ 
          marginTop: '30px', 
          padding: '16px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '6px',
          fontSize: '14px'
        }}>
          <h4 style={{ marginBottom: '12px', fontSize: '16px' }}>테스트용 계정:</h4>
          <p style={{ margin: '4px 0' }}><strong>멘토:</strong> mentor@test.com / password123</p>
          <p style={{ margin: '4px 0' }}><strong>멘티:</strong> mentee@test.com / password123</p>
          <p style={{ margin: '8px 0 0 0', color: '#666' }}>
            ※ 위 계정이 없으면 회원가입 후 이용하세요
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
