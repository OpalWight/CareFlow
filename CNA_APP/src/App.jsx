import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Flashcards from './Flashcards';
import ChatSkills from './ChatSkills';
import Resources from './Resources';
import LoginPage from './LoginPage';
import Dashboard from './Dashboard';
import LandingPage from './LandingPage';
import AboutUs from './AboutUs';
import SignUp from './SignUp';
import { AuthProvider } from './api/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
        <Route path="/flashcards" element={<Flashcards />} />
        <Route path="/chat-skills" element={<ChatSkills />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path = "/dashboard" element={<Dashboard />} />
        <Route path = "/about-us" element={<AboutUs />} />
        <Route path = "/signup" element={<SignUp />} />
      </Routes>
    </Router>
    </AuthProvider>
  );
}

export default App;
