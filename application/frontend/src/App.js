import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import MentorList from './pages/MentorList';
import Requests from './pages/Requests';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppContent />
        </div>
      </Router>
    </AuthProvider>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <>
      {user && <Navbar />}
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/profile" />} />
        <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/profile" />} />
        <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/mentors" element={user && user.role === 'mentee' ? <MentorList /> : <Navigate to="/profile" />} />
        <Route path="/requests" element={user ? <Requests /> : <Navigate to="/login" />} />
        <Route path="/" element={user ? <Navigate to="/profile" /> : <Navigate to="/login" />} />
      </Routes>
    </>
  );
}

export default App;
