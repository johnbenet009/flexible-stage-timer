import React, { useEffect, useState } from 'react';
import { ArrowRight, Play } from 'lucide-react';

interface AutoRunBannerProps {
  programName: string;
  categoryName: string;
  deadline: number;
  onStartNow: () => void;
}

export const AutoRunBanner: React.FC<AutoRunBannerProps> = ({ programName, categoryName, deadline, onStartNow }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, []);

  const seconds = Math.max(0, Math.ceil((deadline - now) / 1000));

  return (
    <section className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-l-2 border-amber-400 bg-amber-500/10 px-3 py-2" aria-live="assertive">
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-0.5">
        <p className="text-[10px] font-black uppercase tracking-wider text-amber-300">Auto-run · {categoryName}</p>
        <p className="text-sm font-bold text-white">Next: {programName}</p>
        <p className="text-xs text-gray-300">Starting in <span className="font-mono font-black text-amber-300">{seconds}s</span></p>
      </div>
      <button type="button" onClick={onStartNow} className="inline-flex shrink-0 items-center gap-1.5 bg-amber-500 px-3 py-2 text-xs font-bold text-gray-950 transition-colors hover:bg-amber-400">
        <Play size={13} fill="currentColor" /> Start now <ArrowRight size={13} />
      </button>
    </section>
  );
};
