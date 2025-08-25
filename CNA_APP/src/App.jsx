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
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';


function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><SignUp /></PublicRoute>} />
          
          <Route path="/resources" element={<ProtectedRoute><Resources /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/learner-home-final" element={<ProtectedRoute><LearnerHomeFinal /></ProtectedRoute>} />
          
          <Route path="/flashcards" element={<Flashcards />} />
          <Route path = "/dashboard" element={<Dashboard />} />
          <Route path = "/auth-callback" element={<AuthCallbackHandler />} />
          <Route path = "/about-us" element={<AboutUs />} />
          <Route path = "/chat" element={<ChatPage />} />
          <Route path = "/combined-learning-hub" element={<CombinedLearningHub />} />
          <Route path = "/help" element={<Help />} />
          <Route path = "/skill-simulation" element={<SkillSimulation />} />
          <Route path = "/admin" element={<AdminPanel />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
