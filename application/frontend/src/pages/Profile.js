import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
  const { user, updateProfile, uploadImage } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.profile?.name || '',
    bio: user?.profile?.bio || '',
    skills: user?.profile?.skills || []
  });
  const [newSkill, setNewSkill] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, newSkill.trim()]
      });
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(skill => skill !== skillToRemove)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const result = await updateProfile(formData);
    
    if (result.success) {
      setMessage('프로필이 성공적으로 업데이트되었습니다.');
    } else {
      setMessage(`오류: ${result.error}`);
    }
    
    setLoading(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setMessage('JPG 또는 PNG 파일만 업로드 가능합니다.');
      return;
    }

    // Validate file size (1MB)
    if (file.size > 1024 * 1024) {
      setMessage('파일 크기는 1MB 이하여야 합니다.');
      return;
    }

    setImageUploading(true);
    setMessage('');

    const result = await uploadImage(file);
    
    if (result.success) {
      setMessage('프로필 이미지가 성공적으로 업데이트되었습니다.');
    } else {
      setMessage(`오류: ${result.error}`);
    }
    
    setImageUploading(false);
  };

  if (!user) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="container">
      <div className="card">
        <h2>내 프로필</h2>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <img
            src={`http://localhost:8080${user.profile.imageUrl}`}
            alt="프로필"
            className="profile-image"
            style={{ width: '150px', height: '150px' }}
          />
          <div style={{ marginTop: '16px' }}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/jpeg,image/png"
              style={{ display: 'none' }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-secondary"
              disabled={imageUploading}
            >
              {imageUploading ? '업로드 중...' : '이미지 변경'}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>역할</label>
            <input
              type="text"
              className="form-control"
              value={user.role === 'mentor' ? '멘토' : '멘티'}
              disabled
            />
          </div>

          <div className="form-group">
            <label>이메일</label>
            <input
              type="email"
              className="form-control"
              value={user.email}
              disabled
            />
          </div>

          <div className="form-group">
            <label htmlFor="name">이름</label>
            <input
              type="text"
              id="name"
              name="name"
              className="form-control"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="bio">소개글</label>
            <textarea
              id="bio"
              name="bio"
              className="form-control"
              rows="4"
              value={formData.bio}
              onChange={handleChange}
              placeholder="자신을 소개해주세요..."
            />
          </div>

          {user.role === 'mentor' && (
            <div className="form-group">
              <label>기술 스택</label>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="기술 스택 추가"
                    className="form-control"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="btn btn-secondary"
                  >
                    추가
                  </button>
                </div>
                <div className="skills">
                  {formData.skills.map((skill, index) => (
                    <span key={index} className="skill-tag">
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        style={{
                          marginLeft: '8px',
                          background: 'none',
                          border: 'none',
                          color: '#666',
                          cursor: 'pointer'
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {message && (
            <div className={message.includes('오류') ? 'error' : 'success'}>
              {message}
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? '업데이트 중...' : '프로필 업데이트'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
