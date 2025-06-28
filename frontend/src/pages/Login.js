import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

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

  const fillTestAccount = (email, password) => {
    setFormData({
      email: email,
      password: password
    });
    setError(''); // 기존 에러 메시지 클리어
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">로그인</CardTitle>
            <CardDescription className="text-center">
              계정에 로그인하여 멘토-멘티 매칭을 시작하세요
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full"
                disabled={loading}
              >
                {loading ? '로그인 중...' : '로그인'}
              </Button>
            </form>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">계정이 없으신가요? </span>
              <Link to="/signup" className="text-primary hover:underline">
                회원가입
              </Link>
            </div>

            {/* 테스트용 계정 안내 */}
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">테스트용 계정</h4>
                  
                  {/* 멘토 계정 */}
                  <div className="flex items-center justify-between p-2 bg-background rounded border">
                    <div className="text-xs">
                      <div className="font-medium text-foreground">멘토 계정</div>
                      <div className="text-muted-foreground">mentor@test.com</div>
                      <div className="text-muted-foreground">password123</div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fillTestAccount('mentor@test.com', 'password123')}
                      className="text-xs px-3 py-1"
                    >
                      자동입력
                    </Button>
                  </div>

                  {/* 멘티 계정 */}
                  <div className="flex items-center justify-between p-2 bg-background rounded border">
                    <div className="text-xs">
                      <div className="font-medium text-foreground">멘티 계정</div>
                      <div className="text-muted-foreground">mentee@test.com</div>
                      <div className="text-muted-foreground">password123</div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fillTestAccount('mentee@test.com', 'password123')}
                      className="text-xs px-3 py-1"
                    >
                      자동입력
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground mt-2">
                    ※ 자동입력 후 로그인 버튼을 누르세요
                  </p>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
