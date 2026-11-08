import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import App from './App.tsx';
import TimerDisplay from './TimerDisplay.tsx';
import GreenScreenTimer from './GreenScreenTimer.tsx';
import BibleProjection from './BibleProjection.tsx';
import RemoteHome from './remote/RemoteHome.tsx';
import RemoteTimerDisplay from './remote/RemoteTimerDisplay.tsx';
import RemoteTimerControl from './remote/RemoteTimerControl.tsx';
import RemoteTranscribeDisplay from './remote/RemoteTranscribeDisplay.tsx';
import RemoteTranscribeControl from './remote/RemoteTranscribeControl.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/timer" element={<TimerDisplay />} />
        <Route path="/green-screen" element={<GreenScreenTimer />} />
        <Route path="/bible-projection" element={<BibleProjection />} />
        <Route path="/remote" element={<RemoteHome />} />
        <Route path="/remote/timer/display" element={<RemoteTimerDisplay />} />
        <Route path="/remote/timer/control" element={<RemoteTimerControl />} />
        <Route path="/remote/transcribe/display" element={<RemoteTranscribeDisplay />} />
        <Route path="/remote/transcribe/control" element={<RemoteTranscribeControl />} />
      </Routes>
    </HashRouter>
  </StrictMode>
);