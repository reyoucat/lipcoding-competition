import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

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

  const getStatusClass = (status) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'accepted': return 'status-accepted';
      case 'rejected': return 'status-rejected';
      default: return '';
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="container">
      <h2>
        {user?.role === 'mentor' ? '받은 매칭 요청' : '보낸 매칭 요청'}
      </h2>

      {error && <div className="error">{error}</div>}

      {requests.length === 0 ? (
        <div className="card">
          <p>
            {user?.role === 'mentor' 
              ? '받은 매칭 요청이 없습니다.' 
              : '보낸 매칭 요청이 없습니다.'
            }
          </p>
        </div>
      ) : (
        <ul className="request-list">
          {requests.map((request) => (
            <li key={request.id} className="request-item">
              <div>
                <h3>
                  {user?.role === 'mentor' 
                    ? `${request.mentee_name}님의 요청`
                    : `${request.mentor_name}님에게 보낸 요청`
                  }
                </h3>
                
                {user?.role === 'mentor' && request.mentee_bio && (
                  <p><strong>멘티 소개:</strong> {request.mentee_bio}</p>
                )}
                
                {user?.role === 'mentee' && request.mentor_bio && (
                  <p><strong>멘토 소개:</strong> {request.mentor_bio}</p>
                )}

                {user?.role === 'mentee' && request.mentor_skills && (
                  <div>
                    <strong>멘토 기술 스택:</strong>
                    <div className="skills" style={{ marginTop: '8px' }}>
                      {JSON.parse(request.mentor_skills || '[]').map((skill, index) => (
                        <span key={index} className="skill-tag">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {request.message && (
                  <p><strong>메시지:</strong> {request.message}</p>
                )}
                
                <p>
                  <strong>상태:</strong> 
                  <span className={getStatusClass(request.status)}>
                    {getStatusText(request.status)}
                  </span>
                </p>
                
                <p><strong>요청일:</strong> {new Date(request.created_at).toLocaleDateString()}</p>
              </div>

              <div className="request-actions">
                {user?.role === 'mentor' && request.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(request.id, 'accepted')}
                      className="btn btn-success"
                    >
                      수락
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(request.id, 'rejected')}
                      className="btn btn-danger"
                    >
                      거절
                    </button>
                  </>
                )}

                {user?.role === 'mentee' && (
                  <button
                    onClick={() => handleDeleteRequest(request.id)}
                    className="btn btn-danger"
                  >
                    삭제
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Requests;
