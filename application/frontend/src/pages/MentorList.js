import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

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
      <div className="container">
        <div className="card">
          <h2>접근 권한이 없습니다</h2>
          <p>멘티만 멘토 목록을 볼 수 있습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h2>멘토 찾기</h2>
      
      <div className="filters">
        <input
          type="text"
          name="skill"
          placeholder="기술 스택으로 검색..."
          value={filters.skill}
          onChange={handleFilterChange}
        />
        
        <select name="sortBy" value={filters.sortBy} onChange={handleFilterChange}>
          <option value="name">이름순</option>
          <option value="skills">기술스택순</option>
        </select>
        
        <select name="sortOrder" value={filters.sortOrder} onChange={handleFilterChange}>
          <option value="asc">오름차순</option>
          <option value="desc">내림차순</option>
        </select>
      </div>

      {loading && <div className="loading">Loading...</div>}
      {error && <div className="error">{error}</div>}

      <div className="mentor-grid">
        {mentors.map((mentor) => (
          <div key={mentor.id} className="mentor-card">
            <img
              src={`http://localhost:8080${mentor.imageUrl}`}
              alt={mentor.name}
            />
            <h3>{mentor.name}</h3>
            <p>{mentor.bio}</p>
            
            <div className="skills">
              {mentor.skills.map((skill, index) => (
                <span key={index} className="skill-tag">
                  {skill}
                </span>
              ))}
            </div>
            
            <button
              onClick={() => setRequestingMentor(mentor.id)}
              className="btn btn-primary"
            >
              매칭 요청
            </button>
          </div>
        ))}
      </div>

      {mentors.length === 0 && !loading && (
        <div className="card">
          <p>조건에 맞는 멘토가 없습니다.</p>
        </div>
      )}

      {/* Request Modal */}
      {requestingMentor && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
          onClick={() => setRequestingMentor(null)}
        >
          <div 
            className="card"
            style={{ maxWidth: '500px', margin: '20px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>매칭 요청 보내기</h3>
            <div className="form-group">
              <label htmlFor="message">메시지 (선택사항)</label>
              <textarea
                id="message"
                className="form-control"
                rows="4"
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                placeholder="멘토에게 전달할 메시지를 입력해주세요..."
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setRequestingMentor(null)}
                className="btn btn-secondary"
              >
                취소
              </button>
              <button
                onClick={() => handleSendRequest(requestingMentor)}
                className="btn btn-primary"
              >
                요청 보내기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentorList;
