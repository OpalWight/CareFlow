import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Footer.css';

function Footer() {
  return (
    <footer className="footer-container">
      <div className="footer-links">
        <Link to="/contact" className="footer-link">Contact</Link>
        <Link to="/mission" className="footer-link">Mission</Link>
        <Link to="/resources" className="footer-link">Resources</Link>
        <Link to="/signup" className="footer-link">Sign Up</Link>
        <Link to="/login" className="footer-link">Log In</Link>
      </div>
    </footer>
  );
}

export default Footer;
