import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavBar from './NavBar';
import Flashcards from './Flashcards';
import ChatSkills from './ChatSkills';
import Resources from './Resources';
import LoginPage from './LoginPage';
import Dashboard from './Dashboard';

function Home() {
  return (
    <div>
      <h1>Welcome to my app!</h1>
      <button onClick={() => alert('Button clicked!')}>Click Me</button>
    </div>
  );
}

function App() {
  return (
    <Router>
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/flashcards" element={<Flashcards />} />
        <Route path="/chat-skills" element={<ChatSkills />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path = "/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
