// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Auth from './components/Auth';
import AdminPanel from './components/AdminPanel';
import LandscapeEditor from './components/LandscapeEditor';

function App() {
  return (
    <Router>
      <Header />

      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/editor" element={<LandscapeEditor />} />

        <Route path="/editor" element={<Navigate to="/auth" replace />} />
        <Route path="*" element={<Navigate to="/editor" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
