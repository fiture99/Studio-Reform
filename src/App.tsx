import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';
import Classes from './pages/Classes';
import Membership from './pages/Membership';
import Contact from './pages/Contact';
import Admin from './pages/Admin';
import Chatbot from './components/Chatbot';
import './index.css';
import Profile from './pages/Profile'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/Studio-Reform/about" element={<About />} />
            <Route path="/Studio-Reform/classes" element={<Classes />} />
            <Route path="/Studio-Reform/membership" element={<Membership />} />
            <Route path="/Studio-Reform/contact" element={<Contact />} />
            <Route path="/Studio-Reform/profile" element={<Profile />} />
            <Route path="/Studio-Reform/admin" element={<Admin />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;