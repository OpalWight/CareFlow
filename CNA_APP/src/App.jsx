import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Flashcards from './pages/Flashcards';
import Resources from './pages/Resources';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import LandingPage from './pages/LandingPage';
import AboutUs from './pages/AboutUs';
import SignUp from './pages/SignUp';
import ChatPage from './pages/ChatPage';
import CombinedLearningHub from './pages/CombinedLearningHub';
import { AuthProvider } from './api/AuthContext';
import Help from './pages/Help';
import Settings from './pages/Settings';
import LearnerHomeFinal from './pages/LearnerHomeFinal';
import SkillSimulation from './pages/SkillSimulation';
import AuthCallbackHandler from './components/AuthCallbackHandler';
import AdminPanel from './components/admin/AdminPanel';


function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
        <Route path="/flashcards" element={<Flashcards />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path = "/dashboard" element={<Dashboard />} />
        <Route path = "/auth-callback" element={<AuthCallbackHandler />} />
        <Route path = "/about-us" element={<AboutUs />} />
        <Route path = "/signup" element={<SignUp />} />
        <Route path = "/chat" element={<ChatPage />} />
        <Route path = "/combined-learning-hub" element={<CombinedLearningHub />} />
        <Route path = "/help" element={<Help />} />
        <Route path = "/settings" element={<Settings />} />
        <Route path = "/learner-home-final" element={<LearnerHomeFinal />} />
        <Route path = "/skill-simulation" element={<SkillSimulation />} />
        <Route path = "/admin" element={<AdminPanel />} />
      </Routes>
    </Router>
    </AuthProvider>
  );
}

export default App;
