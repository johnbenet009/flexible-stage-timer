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
      setScale(sizes.nextProgram);
    }
  }, []);

  useEffect(() => {
    // Sharp, bright color sequence for maximum attention grabbing (1.5 seconds)
    const colors = ['bg-red-500', 'bg-orange-400', 'bg-yellow-300', 'bg-green-400', 'bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-cyan-400'];
    let colorIndex = 0;
    
    const colorInterval = setInterval(() => {
      setCurrentColor(colorIndex);
      colorIndex = (colorIndex + 1) % colors.length;
    }, 200); // Much faster - 200ms per color

    // Stop color sequence after 1.6 seconds (8 colors × 200ms)
    const colorTimer = setTimeout(() => {
      clearInterval(colorInterval);
      setShowColors(false);
    }, 1600);

    // Auto-hide after 5 seconds total
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
    }, 5000);

    return () => {
      clearInterval(colorInterval);
      clearTimeout(colorTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (fullscreen) {
    // Fullscreen overlay for secondary display - MASSIVE and attention-grabbing
    const colors = ['bg-red-500', 'bg-orange-400', 'bg-yellow-300', 'bg-green-400', 'bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-cyan-400'];
    const currentBgColor = showColors ? colors[currentColor] : 'bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900';
    
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center ${
        showColors ? currentBgColor : 'bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900'
      } transition-all duration-200 ${isVisible ? 'animate-scaleIn' : 'animate-scaleOut'}`}>
        {/* Background pattern - only show when not in color sequence */}
        {!showColors && (
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_0%,transparent_50%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_49%,rgba(255,255,255,0.05)_50%,transparent_51%)] bg-[length:20px_20px]" />
        </div>
        )}
        
        {/* Main content - MASSIVE and attention-grabbing */}
        <div className="relative text-center animate-pulse w-full h-full flex flex-col items-center justify-center">
          {/* UP NEXT - HUGE title */}
          <div className={`${showColors ? 'text-white text-9xl font-black' : 'text-white text-8xl font-black'} mb-8 tracking-wider uppercase animate-pulse`} style={{
            fontSize: showColors ? '8rem' : '7rem',
            textShadow: '0 10px 60px rgba(0,0,0,0.9)',
            lineHeight: '0.8'
          }}>
            UP NEXT
          </div>
          
          {/* Program name - MASSIVE */}
          <div className={`${showColors ? 'text-white text-9xl font-black' : 'text-white text-8xl font-black'} mb-12 leading-none max-w-7xl mx-auto break-words animate-pulse`} style={{
            fontSize: showColors ? '12rem' : '10rem',
            textShadow: '0 15px 80px rgba(0,0,0,0.9)',
            lineHeight: '0.8'
          }}>
            {programName}
          </div>
          
          {/* Duration - LARGE and prominent */}
          {duration > 0 && (
            <div className={`${showColors ? 'text-white text-6xl font-black' : 'text-white text-5xl font-bold'} mb-8 animate-pulse`} style={{
              fontSize: showColors ? '5rem' : '4rem',
              textShadow: '0 8px 40px rgba(0,0,0,0.9)',
              lineHeight: '1'
            }}>
              {duration} {duration === 1 ? 'MINUTE' : 'MINUTES'}
            </div>
          )}
          
          {/* Decorative elements - only show when not in color sequence */}
          {!showColors && (
            <div className="flex justify-center items-center space-x-8 text-white/60 mt-8">
              <div className="h-2 bg-white/30 w-32 rounded-full" />
              <Clock size={64} className="text-white/70 animate-pulse" />
              <div className="h-2 bg-white/30 w-32 rounded-full" />
          </div>
          )}
        </div>
        
        {/* Corner accent - only show when not in color sequence */}
        {!showColors && (
        <div className="absolute top-8 right-8 text-white/40">
            <div className="text-3xl font-light">Stage Timer</div>
        </div>
        )}
      </div>
    );
  }

  // Enhanced compact version for main display
  const colors = ['bg-red-500', 'bg-orange-400', 'bg-yellow-300', 'bg-green-400', 'bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-cyan-400'];
  const currentBgColor = showColors ? colors[currentColor] : 'bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600';
  
  // If compact mode, make it much smaller and less intrusive
  if (compact) {
  return (
    <div className={`fixed top-0 left-0 right-0 z-40 ${
        isVisible ? 'animate-slideInFromTop' : 'animate-slideOutToTop'
      }`}>
        <div className={`${currentBgColor} text-white shadow-lg animate-pulse transition-all duration-300`}>
          <div className="container mx-auto px-4 py-2">
            <div className="flex items-center justify-center">
              <div className="text-center">
                {/* Title - smaller than program name */}
                <div className={`${showColors ? 'text-white text-sm font-black' : 'text-white text-xs font-bold opacity-90'} mb-1 animate-pulse uppercase tracking-wider`}>
                  {showColors ? 'Up Next' : 'ATTENTION'}
              </div>
                
                {/* Program name - bigger than title even in compact mode */}
                <div className={`${showColors ? 'text-white text-2xl font-black' : 'text-white text-sm font-bold'} leading-tight animate-pulse`} style={{
                  animation: showColors ? 'none' : 'attentionPulse 2s ease-in-out infinite'
                }}>
                  {programName}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`fixed top-0 left-0 right-0 z-40 ${
      isVisible ? 'animate-slideInFromTop' : 'animate-slideOutToTop'
    }`}>
        <div className={`${currentBgColor} text-white shadow-2xl animate-pulse transition-all duration-200`}>
        <div className="container mx-auto px-8 py-6">
          <div className="flex items-center justify-center">
            <div className="text-center">
              {/* Animated icon - only show when not in color sequence */}
              {!showColors && (
                <div className="bg-white/20 rounded-full p-4 mx-auto mb-4 animate-bounce">
                  <Clock size={32} className="text-white animate-spin" style={{ animationDuration: '3s' }} />
                </div>
              )}
              
              {/* Title with attention-grabbing animation - smaller than program name */}
              <div className={`${showColors ? 'text-white text-3xl font-black' : 'text-lg font-bold opacity-90'} mb-2 animate-pulse uppercase tracking-wider`} style={{
                fontSize: showColors ? '2rem' : `${1 * scale/100}rem`,
                textShadow: '0 3px 15px rgba(0,0,0,0.8)'
              }}>
                {showColors ? 'Up Next' : 'ATTENTION'}
              </div>
              
              {/* Program name - MUCH BIGGER than attention title */}
              <div className={`${showColors ? 'text-white text-6xl font-black' : 'text-3xl font-bold'} leading-tight animate-pulse`} style={{
                fontSize: showColors ? '4rem' : `${4 * scale/100}rem`,
                textShadow: '0 6px 30px rgba(0,0,0,0.9)',
                animation: showColors ? 'none' : 'attentionPulse 2s ease-in-out infinite'
              }}>
                {programName}
              </div>
              
              {/* Decorative arrows - only show when not in color sequence */}
              {!showColors && (
                <div className="flex justify-center items-center space-x-2 mt-4">
                  <ChevronRight size={24} className="text-white/70 animate-bounce" />
                  <ChevronRight size={24} className="text-white/70 animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <ChevronRight size={24} className="text-white/70 animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Enhanced progress bar animation - only show when not in color sequence */}
        {!showColors && (
          <div className="h-2 bg-white/20">
            <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 animate-[slideIn_5s_linear_forwards] shadow-lg" />
        </div>
        )}
      </div>
    </div>
  );
}