import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

const Requests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/matching-requests');
      setRequests(response.data);
      setError('');
    } catch (error) {
      console.error('Failed to fetch requests:', error);
      setError('요청 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (requestId, status) => {
    try {
      await axios.put(`/api/matching-requests/${requestId}`, { status });
      alert(`요청을 ${status === 'accepted' ? '수락' : '거절'}했습니다.`);
      fetchRequests(); // Refresh the list
    } catch (error) {
      console.error('Failed to update status:', error);
      alert(error.response?.data?.error || '상태 업데이트에 실패했습니다.');
    }
  };

  const handleDeleteRequest = async (requestId) => {
    if (!window.confirm('정말로 이 요청을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await axios.delete(`/api/matching-requests/${requestId}`);
      alert('요청을 삭제했습니다.');
      fetchRequests(); // Refresh the list
    } catch (error) {
      console.error('Failed to delete request:', error);
      alert(error.response?.data?.error || '요청 삭제에 실패했습니다.');
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return '대기중';
      case 'accepted': return '수락됨';
      case 'rejected': return '거절됨';
      default: return status;
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'accepted': return 'default';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {user?.role === 'mentor' ? '받은 매칭 요청' : '보낸 매칭 요청'}
          </h1>
          <p className="mt-2 text-gray-600">
            {user?.role === 'mentor' 
              ? '멘티들로부터 받은 매칭 요청을 관리하세요.' 
              : '멘토에게 보낸 매칭 요청 상태를 확인하세요.'
            }
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        {requests.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {user?.role === 'mentor' 
                  ? '받은 매칭 요청이 없습니다.' 
                  : '보낸 매칭 요청이 없습니다.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">
                        {user?.role === 'mentor' 
                          ? `${request.mentee_name}님의 요청`
                          : `${request.mentor_name}님에게 보낸 요청`
                        }
                      </CardTitle>
                      <CardDescription className="mt-1">
                        요청일: {new Date(request.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusVariant(request.status)}>
                      {getStatusText(request.status)}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {user?.role === 'mentor' && request.mentee_bio && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">멘티 소개:</h4>
                      <p className="text-gray-700">{request.mentee_bio}</p>
                    </div>
                  )}
                  
                  {user?.role === 'mentee' && request.mentor_bio && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">멘토 소개:</h4>
                      <p className="text-gray-700">{request.mentor_bio}</p>
                    </div>
                  )}

                  {user?.role === 'mentee' && request.mentor_skills && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">멘토 기술 스택:</h4>
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          try {
                            const skills = typeof request.mentor_skills === 'string' 
                              ? JSON.parse(request.mentor_skills || '[]')
                              : request.mentor_skills || [];
                            return skills.map((skill, index) => (
                              <Badge key={index} variant="outline">
                                {skill}
                              </Badge>
                            ));
                          } catch (e) {
                            console.error('Failed to parse mentor skills:', e);
                            return <span className="text-gray-500">기술 스택 정보를 불러올 수 없습니다.</span>;
                          }
                        })()}
                      </div>
                    </div>
                  )}
                  
                  {request.message && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">메시지:</h4>
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-md">{request.message}</p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    {user?.role === 'mentor' && request.status === 'pending' && (
                      <>
                        <Button
                          onClick={() => handleUpdateStatus(request.id, 'accepted')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          수락
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleUpdateStatus(request.id, 'rejected')}
                        >
                          거절
                        </Button>
                      </>
                    )}

                    {user?.role === 'mentee' && (
                      <Button
                        variant="destructive"
                        onClick={() => handleDeleteRequest(request.id)}
                      >
                        삭제
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Requests;
