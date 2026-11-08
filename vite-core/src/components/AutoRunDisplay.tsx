import React, { useEffect, useState } from 'react';

interface AutoRunDisplayProps {
  programName: string;
  deadline: number;
  compact?: boolean;
  animationClass?: string;
}

export function AutoRunDisplay({ programName, deadline, compact = false, animationClass = 'animate-handoff-in' }: AutoRunDisplayProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, []);

  const seconds = Math.max(0, Math.ceil((deadline - now) / 1000));

  return (
    <div className={`${compact ? 'absolute inset-0 z-30 px-2 py-2 [container-type:inline-size]' : 'fixed inset-0 z-40 px-6 pb-28 pt-12 sm:px-10'} flex flex-col items-center justify-center overflow-hidden bg-black text-center text-white ${animationClass}`}>
      <div className={`w-full ${compact ? 'max-w-full' : 'max-w-[94vw]'} animate-next-program-enter`}>
        <p className={`font-black uppercase tracking-[0.25em] text-amber-300 ${compact ? 'text-[10px]' : 'text-sm sm:text-xl'}`}>Next Program</p>
        <h1
          className={`break-words font-black leading-[0.92] text-white ${compact ? 'mt-1' : 'mt-6'}`}
          style={{
            fontSize: compact ? 'clamp(1.1rem, 5cqw, 2rem)' : 'clamp(5rem, 14vw, 12rem)',
            textShadow: '3px 3px 8px rgba(0,0,0,0.8)',
          }}
        >
          {programName}
        </h1>
        <p className={`font-semibold text-white/80 ${compact ? 'mt-1 text-[10px]' : 'mt-7 text-xl sm:text-3xl'}`}>{seconds <= 0 ? 'Starting now' : 'Starts in'}</p>
        <p
          className={`mt-0.5 font-black tabular-nums text-amber-300 ${compact ? 'text-2xl' : ''}`}
          style={{
            fontSize: compact ? 'clamp(1.25rem, 6cqw, 2.25rem)' : 'clamp(3rem, 7vw, 6rem)',
            textShadow: '2px 2px 6px rgba(0,0,0,0.8)',
          }}
        >
          {seconds} <span className={compact ? 'text-[10px] font-bold text-white/60' : 'text-xl font-bold text-white/60 sm:text-3xl'}>seconds</span>
        </p>
      </div>
      <div className={`absolute inset-x-0 flex flex-col items-center justify-center text-white/60 ${compact ? 'bottom-1 gap-0.5' : 'bottom-6 gap-1 sm:bottom-8 sm:flex-row sm:gap-3'}`}>
        <span className={`font-bold uppercase tracking-widest ${compact ? 'text-[7px]' : 'text-xs sm:text-sm'}`}>Previous program ended</span>
        <span className={`font-mono font-black text-white/80 ${compact ? 'text-sm' : 'text-3xl sm:text-5xl'}`}>00:00</span>
      </div>
    </div>
  );
}