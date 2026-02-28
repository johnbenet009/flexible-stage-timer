import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import App from './App.tsx';
import TimerDisplay from './TimerDisplay.tsx';
import GreenScreenTimer from './GreenScreenTimer.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/timer" element={<TimerDisplay />} />
        <Route path="/green-screen" element={<GreenScreenTimer />} />
      </Routes>
    </HashRouter>
  </StrictMode>
);