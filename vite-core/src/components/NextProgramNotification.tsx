import React, { useEffect, useState } from 'react';
import { ChevronRight, Clock } from 'lucide-react';

interface NextProgramNotificationProps {
  programName: string;
  fullscreen?: boolean;
  compact?: boolean;
  duration?: number; // Duration in minutes
}

export function NextProgramNotification({ programName, fullscreen = false, compact = false, duration = 0 }: NextProgramNotificationProps) {
  const [scale, setScale] = useState(100);
  const [isVisible, setIsVisible] = useState(true);
  const [showColors, setShowColors] = useState(true);
  const [currentColor, setCurrentColor] = useState(0);

  useEffect(() => {
    const savedSizes = localStorage.getItem('displaySizes');
    if (savedSizes) {
      const sizes = JSON.parse(savedSizes);
      setScale(sizes.nextProgram || 100);
    }
  }, []);

  useEffect(() => {
    // Sharp, bright color sequence for maximum attention grabbing (1.5 seconds)
    const colors = [
      'from-red-600 to-red-800', 
      'from-orange-500 to-orange-700', 
      'from-yellow-400 to-yellow-600', 
      'from-green-500 to-green-700', 
      'from-blue-600 to-blue-800', 
      'from-purple-600 to-purple-800', 
      'from-pink-500 to-pink-700', 
      'from-cyan-500 to-cyan-700'
    ];
    let colorIndex = 0;
    
    const colorInterval = setInterval(() => {
      setCurrentColor(colorIndex);
      colorIndex = (colorIndex + 1) % colors.length;
    }, 150);

    // Stop color sequence after 1.5 seconds
    const colorTimer = setTimeout(() => {
      clearInterval(colorInterval);
      setShowColors(false);
    }, 1500);

    // Auto-hide after 6 seconds total
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
    }, 6000);

    return () => {
      clearInterval(colorInterval);
      clearTimeout(colorTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (fullscreen) {
    const colors = [
      'from-red-600 to-red-800', 
      'from-orange-500 to-orange-700', 
      'from-yellow-400 to-yellow-600', 
      'from-green-500 to-green-700', 
      'from-blue-600 to-blue-800', 
      'from-purple-600 to-purple-800', 
      'from-pink-500 to-pink-700', 
      'from-cyan-500 to-cyan-700'
    ];
    const currentBgGradient = showColors ? colors[currentColor] : 'from-gray-900 via-blue-900 to-indigo-950';
    
    return (
      <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br ${currentBgGradient} transition-all duration-500 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-110 pointer-events-none'}`}>
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/20 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/20 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative z-10 text-center space-y-8 px-10">
          <div className="inline-flex items-center space-x-4 bg-white/10 backdrop-blur-md px-8 py-3 rounded-full border border-white/20 animate-slideInFromTop">
            <Clock className="text-blue-400 w-8 h-8" />
            <span className="text-white text-3xl font-bold tracking-[0.2em] uppercase">Coming Up Next</span>
          </div>

          <h1 className="text-white font-black leading-tight tracking-tight animate-scaleIn" style={{ fontSize: `${12 * scale / 100}vw`, textShadow: '0 20px 80px rgba(0,0,0,0.5)' }}>
            {programName}
          </h1>

          {duration > 0 && (
            <div className="flex items-center justify-center space-x-6 animate-slideInFromBottom">
              <div className="h-[2px] w-20 bg-gradient-to-r from-transparent to-white/30" />
              <span className="text-blue-200 text-5xl font-light tracking-widest">
                <span className="font-bold text-white">{duration}</span> {duration === 1 ? 'MINUTE' : 'MINUTES'}
              </span>
              <div className="h-[2px] w-20 bg-gradient-to-l from-transparent to-white/30" />
            </div>
          )}
        </div>

        {/* Progress Bar at Bottom */}
        <div className="absolute bottom-0 left-0 h-2 bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all duration-[6000ms] ease-linear" style={{ width: isVisible ? '100%' : '0%' }} />
      </div>
    );
  }

  if (compact) {
    return (isVisible ? (
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-2xl bg-gray-900/90 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-4 shadow-2xl animate-slideInFromTopNotification">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
            <ChevronRight className="text-white w-8 h-8 animate-pulse" />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-blue-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-0.5">Coming Up Next</p>
            <h3 className="text-white text-xl font-bold truncate">{programName}</h3>
          </div>
          {duration > 0 && (
            <div className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
              <span className="text-white font-mono font-bold">{duration}m</span>
            </div>
          )}
        </div>
      </div>
    ) : null);
  }

  return null;
}