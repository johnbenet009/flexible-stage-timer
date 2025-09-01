import React, { useEffect, useState } from 'react';
import { ChevronRight, Clock } from 'lucide-react';

interface NextProgramNotificationProps {
  programName: string;
  fullscreen?: boolean;
}

export function NextProgramNotification({ programName, fullscreen = false }: NextProgramNotificationProps) {
  const [scale, setScale] = useState(100);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const savedSizes = localStorage.getItem('displaySizes');
    if (savedSizes) {
      const sizes = JSON.parse(savedSizes);
      setScale(sizes.nextProgram);
    }
  }, []);

  useEffect(() => {
    // Auto-hide after 5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (fullscreen) {
    // Fullscreen overlay for secondary display
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900 ${
        isVisible ? 'animate-scaleIn' : 'animate-scaleOut'
      }`}>
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_0%,transparent_50%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_49%,rgba(255,255,255,0.05)_50%,transparent_51%)] bg-[length:20px_20px]" />
        </div>
        
        {/* Main content */}
        <div className="relative text-center animate-pulse">
          {/* Icon */}
          <div className="flex justify-center mb-8">
            <div className="bg-white/20 rounded-full p-8 backdrop-blur-sm">
              <Clock size={80} className="text-white" />
            </div>
          </div>
          
          {/* Title */}
          <div className="text-white/90 text-6xl font-light mb-4 tracking-wider uppercase">
            Up Next
          </div>
          
          {/* Program name */}
          <div className="text-white text-8xl font-bold mb-8 leading-tight max-w-4xl mx-auto break-words" style={{
            fontSize: `${4 * scale/100}rem`,
            textShadow: '0 4px 20px rgba(0,0,0,0.5)'
          }}>
            {programName}
          </div>
          
          {/* Decorative elements */}
          <div className="flex justify-center items-center space-x-4 text-white/60">
            <div className="h-px bg-white/30 w-20" />
            <ChevronRight size={32} className="animate-pulse" />
            <div className="h-px bg-white/30 w-20" />
          </div>
        </div>
        
        {/* Corner accent */}
        <div className="absolute top-8 right-8 text-white/40">
          <div className="text-2xl font-light">Stage Timer</div>
        </div>
      </div>
    );
  }

  // Compact version for main display
  return (
    <div className={`fixed top-0 left-0 right-0 z-40 ${
      isVisible ? 'animate-slideInFromBottom' : 'animate-slideOutToBottom'
    }`}>
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 text-white shadow-2xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 rounded-full p-3">
                <Clock size={24} className="text-white" />
              </div>
              <div>
                <div className="text-sm font-medium opacity-90">Up Next</div>
                <div className="text-xl font-bold" style={{
                  fontSize: `${1.25 * scale/100}rem`
                }}>
                  {programName}
                </div>
              </div>
            </div>
            <ChevronRight size={28} className="text-white/70 animate-pulse" />
          </div>
        </div>
        
        {/* Progress bar animation */}
        <div className="h-1 bg-white/20">
          <div className="h-full bg-white/60 animate-[slideIn_5s_linear_forwards]" />
        </div>
      </div>
    </div>
  );
}