import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';

const MentorList = () => {
  const { user } = useAuth();
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    skill: '',
    sortBy: 'name',
    sortOrder: 'asc'
  });
  const [requestingMentor, setRequestingMentor] = useState(null);
  const [requestMessage, setRequestMessage] = useState('');

  useEffect(() => {
    fetchMentors();
  }, [filters]);

  const fetchMentors = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.skill) params.append('skill', filters.skill);
      params.append('sortBy', filters.sortBy);
      params.append('sortOrder', filters.sortOrder);

      const response = await axios.get(`/api/mentors?${params}`);
      setMentors(response.data);
      setError('');
    } catch (error) {
      console.error('Failed to fetch mentors:', error);
      setError('멘토 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const handleSendRequest = async (mentorId) => {
    try {
      await axios.post('/api/matching-requests', {
        mentor_id: mentorId,
        message: requestMessage
      });
      
      alert('매칭 요청을 성공적으로 보냈습니다!');
      setRequestingMentor(null);
      setRequestMessage('');
    } catch (error) {
      console.error('Failed to send request:', error);
      alert(error.response?.data?.error || '요청 전송에 실패했습니다.');
    }
  };

  if (user?.role !== 'mentee') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>접근 권한이 없습니다</CardTitle>
            <CardDescription>멘티만 멘토 목록을 볼 수 있습니다.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">멘토 찾기</h1>
          <p className="text-gray-600">당신에게 맞는 멘토를 찾아보세요</p>
        </div>
        
        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">검색 및 정렬</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="skill">기술 스택 검색</Label>
                <Input
                  id="skill"
                  name="skill"
                  placeholder="예: React, Python, Java..."
                  value={filters.skill}
                  onChange={handleFilterChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sortBy">정렬 기준</Label>
                <Select 
                  name="sortBy" 
                  value={filters.sortBy} 
                  onChange={handleFilterChange}
                >
                  <option value="name">이름순</option>
                  <option value="skills">기술스택순</option>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sortOrder">정렬 순서</Label>
                <Select 
                  name="sortOrder" 
                  value={filters.sortOrder} 
                  onChange={handleFilterChange}
                >
                  <option value="asc">오름차순</option>
                  <option value="desc">내림차순</option>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-muted-foreground">멘토 목록을 불러오는 중...</p>
          </div>
        )}
        
        {error && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="text-center text-red-600">
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mentor Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mentors.map((mentor) => (
            <Card key={mentor.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200">
                    <img
                      src={`http://localhost:8080${mentor.imageUrl}`}
                      alt={mentor.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{mentor.name}</CardTitle>
                    <CardDescription>{mentor.bio || '소개글이 없습니다.'}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pb-4">
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">기술 스택</Label>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {mentor.skills.length > 0 ? (
                        mentor.skills.map((skill, index) => (
                          <Badge key={index} variant="secondary">
                            {skill}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">등록된 기술 스택이 없습니다</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter>
                <Button
                  onClick={() => setRequestingMentor(mentor.id)}
                  className="w-full"
                >
                  매칭 요청
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {mentors.length === 0 && !loading && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <p className="text-muted-foreground">조건에 맞는 멘토가 없습니다.</p>
                <p className="text-sm text-muted-foreground mt-2">검색 조건을 변경해보세요.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Request Dialog */}
        <Dialog open={!!requestingMentor} onOpenChange={() => setRequestingMentor(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>매칭 요청 보내기</DialogTitle>
              <DialogDescription>
                멘토에게 전달할 메시지를 작성해주세요. (선택사항)
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="message">메시지</Label>
                <Textarea
                  id="message"
                  rows={4}
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  placeholder="안녕하세요! 멘토링을 받고 싶어서 연락드립니다..."
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setRequestingMentor(null)}
              >
                취소
              </Button>
              <Button
                onClick={() => handleSendRequest(requestingMentor)}
              >
                요청 보내기
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default MentorList;
