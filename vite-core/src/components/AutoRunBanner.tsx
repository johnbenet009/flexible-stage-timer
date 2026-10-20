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
    <section className="flex flex-wrap items-center justify-between gap-4 border-l-4 border-amber-400 bg-amber-500/10 px-5 py-4" aria-live="assertive">
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-widest text-amber-300">Auto-run ready · {categoryName}</p>
        <p className="mt-1 text-lg font-bold text-white">Next up: {programName}</p>
        <p className="mt-1 text-sm text-gray-300">The app will start this program in <span className="font-mono font-black text-amber-300">{seconds}</span> seconds.</p>
      </div>
      <button type="button" onClick={onStartNow} className="inline-flex shrink-0 items-center gap-2 bg-amber-500 px-5 py-3 font-bold text-gray-950 transition-colors hover:bg-amber-400">
        <Play size={16} fill="currentColor" /> Start next now <ArrowRight size={16} />
      </button>
    </section>
  );
};
