import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Monitor, Play, Square } from 'lucide-react';
import { ThemeSelector } from './ThemeSelector';

interface Props {
  selectedTheme: string;
  onThemeChange: (themeId: string) => void;
  availableDisplays: Array<{ id: number; label: string }>;
  selectedDisplay: number | null;
  onDisplayChange: (displayId: number) => void;
  isProjecting: boolean;
  onProject: (title: string, body: string) => void;
  onUpdateSlide: (title: string, body: string) => void;
  onCloseProjection: () => void;
}

export const SongsTab: React.FC<Props> = ({
  selectedTheme,
  onThemeChange,
  availableDisplays,
  selectedDisplay,
  onDisplayChange,
  isProjecting,
  onProject,
  onUpdateSlide,
  onCloseProjection,
}) => {
  const [title, setTitle] = useState(() => localStorage.getItem('songEditorTitle') || '');
  const [lyrics, setLyrics] = useState(() => localStorage.getItem('songEditorSlides') || '');
  const [activeSlide, setActiveSlide] = useState(0);
  const slides = lyrics.split(/\n\s*\n/).map(slide => slide.trim()).filter(Boolean);
  const currentSlide = slides[activeSlide] || '';

  useEffect(() => {
    setActiveSlide(index => Math.min(index, Math.max(0, slides.length - 1)));
  }, [slides.length]);

  useEffect(() => {
    localStorage.setItem('songEditorTitle', title);
    localStorage.setItem('songEditorSlides', lyrics);
  }, [lyrics, title]);

  useEffect(() => {
    if (isProjecting && currentSlide) onUpdateSlide(title, currentSlide);
  }, [activeSlide, currentSlide, isProjecting, onUpdateSlide, title]);

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)]">
      <section className="space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-700 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Song Slides</h2>
            <p className="mt-1 text-sm text-gray-400">Prepare lyrics you are authorized to display. Separate slides with a blank line.</p>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <Monitor size={16} />
            <select
              aria-label="Projection display"
              value={selectedDisplay ?? ''}
              onChange={event => onDisplayChange(Number(event.target.value))}
              className="max-w-56 bg-gray-800 px-3 py-2 text-white"
            >
              <option value="">Choose display</option>
              {availableDisplays.map(display => <option key={display.id} value={display.id}>{display.label}</option>)}
            </select>
          </label>
        </header>

        <label className="block space-y-2 text-sm font-semibold text-gray-300">
          Song title
          <input
            value={title}
            onChange={event => setTitle(event.target.value)}
            placeholder="Enter a song title"
            className="w-full border border-gray-700 bg-gray-900 px-4 py-3 text-white placeholder:text-gray-500"
          />
        </label>

        <label className="block space-y-2 text-sm font-semibold text-gray-300">
          Slide text
          <textarea
            value={lyrics}
            onChange={event => setLyrics(event.target.value)}
            placeholder={'Paste or type authorized lyrics here.\n\nUse a blank line between slides.'}
            rows={12}
            className="w-full resize-y border border-gray-700 bg-gray-900 px-4 py-3 leading-relaxed text-white placeholder:text-gray-500"
          />
        </label>

        <ThemeSelector selectedTheme={selectedTheme} onChange={onThemeChange} />
      </section>

      <section className="space-y-5 border-t border-gray-700 pt-5 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold uppercase text-gray-400">Slide Preview</h3>
          <span className="font-mono text-sm text-gray-400">{slides.length ? activeSlide + 1 : 0} / {slides.length}</span>
        </div>
        <div className="flex aspect-video min-h-60 flex-col items-center justify-center gap-4 overflow-hidden px-8 text-center" style={{ backgroundColor: selectedTheme === 'light' ? '#ffffff' : selectedTheme === 'blue' ? '#1e3a8a' : '#000000', color: selectedTheme === 'light' ? '#000000' : '#ffffff' }}>
          {title && <div className="text-base font-semibold opacity-70">{title}</div>}
          <p className="max-w-full whitespace-pre-line break-words text-2xl font-bold leading-tight sm:text-4xl">{currentSlide || 'Your current slide will appear here'}</p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            title="Previous slide"
            aria-label="Previous slide"
            disabled={activeSlide === 0 || slides.length === 0}
            onClick={() => setActiveSlide(index => Math.max(0, index - 1))}
            className="inline-flex items-center gap-2 border border-gray-700 px-4 py-3 text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
          ><ChevronLeft size={18} /> Previous</button>
          <button
            type="button"
            title="Next slide"
            aria-label="Next slide"
            disabled={activeSlide >= slides.length - 1}
            onClick={() => setActiveSlide(index => Math.min(slides.length - 1, index + 1))}
            className="inline-flex items-center gap-2 border border-gray-700 px-4 py-3 text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
          >Next <ChevronRight size={18} /></button>
        </div>

        <div className="flex flex-wrap gap-3 border-t border-gray-700 pt-5">
          {isProjecting ? (
            <button type="button" onClick={onCloseProjection} className="inline-flex items-center gap-2 bg-red-700 px-5 py-3 font-bold text-white hover:bg-red-600"><Square size={16} /> Stop Projection</button>
          ) : (
            <button type="button" disabled={!currentSlide || selectedDisplay === null} onClick={() => onProject(title, currentSlide)} className="inline-flex items-center gap-2 bg-green-700 px-5 py-3 font-bold text-white hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-40"><Play size={16} /> Project Current Slide</button>
          )}
        </div>
      </section>
    </div>
  );
};
