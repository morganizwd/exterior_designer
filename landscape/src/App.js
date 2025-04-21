// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Auth from './components/Auth';

function App() {
  return (
    <Router>
      <nav className="main-nav">
        <Link to="/">Главная</Link>
        <Link to="/auth">Войти / Регистрация</Link>
      </nav>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        {/* Здесь другие маршруты вашего приложения */}
        <Route path="/" element={<Navigate to="/auth" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;