import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Monitor, Play, Square, BookOpen, Music, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { ThemeSelector } from './ThemeSelector';

export type Verse = { book: number; book_name: string; chapter: number; verse: number; text: string };
type BibleBook = { id: number; name: string };

interface BibleSongsTabProps {
  availableDisplays: Array<{ id: number; label: string }>;
  selectedDisplay: number | null;
  onDisplayChange: (displayId: number) => void;
  projectBible: (verses: Verse[]) => void;
  testDisplay?: () => void;
  isProjecting: boolean;
  onCloseProjection: () => void;
  selectedTheme: string;
  onThemeChange: (themeId: string) => void;
  onProjectSong: (title: string, body: string) => void;
  onUpdateSongSlide: (title: string, body: string) => void;
}

const bookColors = [
  'bg-rose-600', 'bg-fuchsia-600', 'bg-indigo-600', 'bg-emerald-600',
  'bg-sky-600', 'bg-amber-600', 'bg-lime-600', 'bg-teal-600',
  'bg-violet-600', 'bg-pink-600', 'bg-cyan-600', 'bg-orange-600',
];

const getBookColor = (bookId: number) => bookColors[bookId % bookColors.length];

const bookAbbreviation: Record<string, string> = {
  Genesis: 'Gn', Exodus: 'Ex', Leviticus: 'Lv', Numbers: 'Nm', Deuteronomy: 'Dt',
  Joshua: 'Js', Judges: 'Jz', Ruth: 'Rt', '1 Samuel': '1Sm', '2 Samuel': '2Sm',
  '1 Kings': '1Rs', '2 Kings': '2Rs', '1 Chronicles': '1Cr', '2 Chronicles': '2Cr',
  Ezra: 'Ez', Nehemiah: 'Ne', Esther: 'Et', Job: 'Jó', Psalms: 'Sl',
  Proverbs: 'Pv', Ecclesiastes: 'Ec', 'Song of Solomon': 'Ct', Isaiah: 'Is',
  Jeremiah: 'Jr', Lamentations: 'Lm', Ezekiel: 'Ez', Daniel: 'Dn',
  Hosea: 'Os', Joel: 'Jl', Amos: 'Am', Obadiah: 'Ob', Jonah: 'Jn',
  Micah: 'Mq', Nahum: 'Na', Habakkuk: 'Hc', Zephaniah: 'Sf',
  Haggai: 'Ag', Zechariah: 'Zc', Malachi: 'Ml', Matthew: 'Mt',
  Mark: 'Mc', Luke: 'Lc', John: 'Jo', Acts: 'At', Romans: 'Rm',
  '1 Corinthians': '1Co', '2 Corinthians': '2Co', Galatians: 'Gl',
  Ephesians: 'Ef', Philippians: 'Fp', Colossians: 'Cl', '1 Thessalonians': '1Ts',
  '2 Thessalonians': '2Ts', '1 Timothy': '1Tm', '2 Timothy': '2Tm',
  Titus: 'Tt', Philemon: 'Fm', Hebrews: 'Hb', James: 'Tg',
  '1 Peter': '1Pe', '2 Peter': '2Pe', '1 John': '1Jo', '2 John': '2Jo',
  '3 John': '3Jo', 'Jude': 'Jd', Revelation: 'Ap'
};

export const BibleSongsTab: React.FC<BibleSongsTabProps> = ({
  availableDisplays,
  selectedDisplay,
  onDisplayChange,
  projectBible,
  testDisplay,
  isProjecting,
  onCloseProjection,
  selectedTheme,
  onThemeChange,
  onProjectSong,
  onUpdateSongSlide,
}) => {
  const [innerTab, setInnerTab] = useState<'bible' | 'songs'>('bible');

  // Bible State
  const [allVerses, setAllVerses] = useState<Verse[]>([]);
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [chapters, setChapters] = useState<number[]>([]);
  const [chapterVerses, setChapterVerses] = useState<Verse[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [selectedBookName, setSelectedBookName] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [selectedVerseNumbers, setSelectedVerseNumbers] = useState<number[]>([]);
  const [quickSearch, setQuickSearch] = useState('');
  const [bookFilter, setBookFilter] = useState('');

  // Songs State
  const [songTitle, setSongTitle] = useState(() => localStorage.getItem('songEditorTitle') || '');
  const [songLyrics, setSongLyrics] = useState(() => localStorage.getItem('songEditorSlides') || '');
  const [activeSlide, setActiveSlide] = useState(0);
  const songSlides = songLyrics.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
  const currentSongSlide = songSlides[activeSlide] || '';

  // Load Bible Data
  useEffect(() => {
    const loadBible = async () => {
      const paths = ['kjv.json', 'vite-core/public/kjv.json'];
      for (const p of paths) {
        try {
          const res = await fetch(p);
          if (!res.ok) continue;
          const text = await res.text();
          if (text.trimStart().startsWith('<')) continue;
          const data = JSON.parse(text);
          const list: Verse[] = Array.isArray(data) ? data : data?.verses ?? [];
          if (list.length > 0) {
            setAllVerses(list);
            const bMap = new Map<number, string>();
            list.forEach(v => { if (!bMap.has(v.book)) bMap.set(v.book, v.book_name); });
            const sorted = Array.from(bMap.entries()).sort((a, b) => a[0] - b[0]).map(([id, name]) => ({ id, name }));
            setBooks(sorted);
            if (sorted.length > 0) {
              setSelectedBookId(sorted[0].id);
              setSelectedBookName(sorted[0].name);
            }
            break;
          }
        } catch {}
      }
    };
    loadBible();
  }, []);

  // Update chapters when book changes
  useEffect(() => {
    if (selectedBookId === null) {
      setChapters([]);
      setSelectedChapter(null);
      return;
    }
    const chSet = new Set<number>();
    allVerses.forEach(v => { if (v.book === selectedBookId) chSet.add(v.chapter); });
    const chs = Array.from(chSet).sort((a, b) => a - b);
    setChapters(chs);
    if (chs.length > 0) {
      setSelectedChapter(chs[0]);
    }
  }, [selectedBookId, allVerses]);

  // Update verses when chapter changes
  useEffect(() => {
    if (selectedBookId === null || selectedChapter === null) {
      setChapterVerses([]);
      setSelectedVerseNumbers([]);
      return;
    }
    const verses = allVerses
      .filter(v => v.book === selectedBookId && v.chapter === selectedChapter)
      .sort((a, b) => a.verse - b.verse);
    setChapterVerses(verses);
    if (verses.length > 0) {
      setSelectedVerseNumbers([verses[0].verse]);
    }
  }, [selectedBookId, selectedChapter, allVerses]);

  // Quick Reference Parser
  const handleQuickSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSearch.trim() || allVerses.length === 0) return;
    const trimmed = quickSearch.trim();
    // Parse e.g. "John 3:16", "Romans 8:28-30", "Psalm 23"
    const match = trimmed.match(/^([\d\s\w]+?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/i);
    if (!match) return;
    const [, bookQuery, chStr, vStartStr, vEndStr] = match;
    const chapter = parseInt(chStr, 10);
    const vStart = vStartStr ? parseInt(vStartStr, 10) : null;
    const vEnd = vEndStr ? parseInt(vEndStr, 10) : vStart;

    const foundBook = books.find(b => b.name.toLowerCase() === bookQuery.toLowerCase() || (bookAbbreviation[b.name] && bookAbbreviation[b.name].toLowerCase() === bookQuery.toLowerCase()));
    if (!foundBook) return;

    setSelectedBookId(foundBook.id);
    setSelectedBookName(foundBook.name);
    setSelectedChapter(chapter);

    const matching = allVerses.filter(v => v.book === foundBook.id && v.chapter === chapter && (vStart === null || (vEnd !== null ? v.verse >= vStart && v.verse <= vEnd : v.verse === vStart)));
    if (matching.length > 0) {
      setSelectedVerseNumbers(matching.map(v => v.verse));
      projectBible(matching);
    }
  };

  const currentSelectedVerses = React.useMemo(() => {
    return chapterVerses.filter(v => selectedVerseNumbers.includes(v.verse));
  }, [chapterVerses, selectedVerseNumbers]);

  // Sync projection data
  useEffect(() => {
    if (currentSelectedVerses.length > 0) {
      localStorage.setItem('bibleProjectionData', JSON.stringify({ verses: currentSelectedVerses, theme: selectedTheme }));
    }
  }, [currentSelectedVerses, selectedTheme]);

  // Song effects
  useEffect(() => {
    localStorage.setItem('songEditorTitle', songTitle);
    localStorage.setItem('songEditorSlides', songLyrics);
  }, [songTitle, songLyrics]);

  useEffect(() => {
    setActiveSlide(idx => Math.min(idx, Math.max(0, songSlides.length - 1)));
  }, [songSlides.length]);

  useEffect(() => {
    if (isProjecting && currentSongSlide && innerTab === 'songs') {
      onUpdateSongSlide(songTitle, currentSongSlide);
    }
  }, [activeSlide, currentSongSlide, isProjecting, onUpdateSongSlide, songTitle, innerTab]);

  const toggleVerseSelection = (verseNum: number) => {
    setSelectedVerseNumbers(prev =>
      prev.includes(verseNum)
        ? prev.filter(n => n !== verseNum)
        : [...prev, verseNum].sort((a, b) => a - b)
    );
  };

  const filteredBooks = books.filter(b => b.name.toLowerCase().includes(bookFilter.toLowerCase()));

  return (
    <div className="flex flex-col h-full min-h-0 bg-gray-900 text-white">
      {/* Top Header & Inner Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="flex bg-gray-900 p-1 rounded-xl border border-gray-700">
            <button
              onClick={() => setInnerTab('bible')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                innerTab === 'bible' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
              }`}
            >
              <BookOpen size={16} />
              <span>Bible</span>
            </button>
            <button
              onClick={() => setInnerTab('songs')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                innerTab === 'songs' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Music size={16} />
              <span>Songs</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedDisplay === null ? '' : selectedDisplay}
            onChange={e => onDisplayChange(Number(e.target.value))}
            className="px-3 py-2 bg-gray-900 text-white border border-gray-700 rounded-lg text-xs font-bold"
          >
            <option value="" disabled>Choose Screen...</option>
            {availableDisplays.map(d => (
              <option key={d.id} value={d.id}>{d.label}</option>
            ))}
          </select>
          <span className="bg-gray-900 border border-gray-700 px-3 py-2 rounded-lg text-xs font-bold text-gray-300">KJV</span>
        </div>
      </div>

      {/* Bible Tab Content */}
      {innerTab === 'bible' && (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Quick Passage Search Bar */}
          <form onSubmit={handleQuickSearchSubmit} className="flex items-center gap-3 p-3 bg-gray-800/60 border-b border-gray-700">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={quickSearch}
                onChange={e => setQuickSearch(e.target.value)}
                placeholder="Quick jump: e.g. John 3:16, Psalm 23, Romans 8:28-30"
                className="w-full bg-gray-900 text-white pl-9 pr-4 py-2.5 rounded-lg border border-gray-700 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-xs font-black transition-colors"
            >
              Jump & Project
            </button>
            {isProjecting && onCloseProjection ? (
              <button
                type="button"
                onClick={onCloseProjection}
                className="bg-red-600 hover:bg-red-500 text-white px-5 py-2.5 rounded-lg text-xs font-black transition-colors flex items-center gap-1.5"
              >
                <Square size={14} /> Stop
              </button>
            ) : (
              <button
                type="button"
                onClick={() => projectBible(currentSelectedVerses)}
                disabled={currentSelectedVerses.length === 0 || selectedDisplay === null}
                className="bg-green-600 hover:bg-green-500 text-white px-5 py-2.5 rounded-lg text-xs font-black transition-colors disabled:opacity-40 flex items-center gap-1.5"
              >
                <Play size={14} /> Project Selected
              </button>
            )}
            {testDisplay && (
              <button
                type="button"
                onClick={testDisplay}
                disabled={selectedDisplay === null}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-lg text-xs font-bold disabled:opacity-40"
              >
                Test
              </button>
            )}
          </form>

          {/* Main 3-Column Bible Workspace */}
          <div className="grid grid-cols-1 md:grid-cols-12 flex-1 min-h-0 overflow-hidden">
            {/* Column 1: Books (3 cols) */}
            <div className="md:col-span-3 flex flex-col border-r border-gray-700 bg-gray-900/90 min-h-0">
              <div className="p-3 border-b border-gray-800">
                <input
                  type="text"
                  value={bookFilter}
                  onChange={e => setBookFilter(e.target.value)}
                  placeholder="Filter 66 books..."
                  className="w-full bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-700 text-xs font-bold outline-none"
                />
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {filteredBooks.map(b => (
                  <button
                    key={b.id}
                    onClick={() => {
                      setSelectedBookId(b.id);
                      setSelectedBookName(b.name);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                      selectedBookId === b.id ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    <span className="truncate">{b.name}</span>
                    <span className={`w-2 h-2 rounded-full ${getBookColor(b.id)}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* Column 2: Chapters (2 cols) */}
            <div className="md:col-span-2 flex flex-col border-r border-gray-700 bg-gray-900/60 min-h-0">
              <div className="p-3 border-b border-gray-800 text-xs font-black text-gray-400 uppercase tracking-widest">
                Chapters ({chapters.length})
              </div>
              <div className="flex-1 overflow-y-auto p-2 grid grid-cols-3 gap-1.5 custom-scrollbar align-content-start">
                {chapters.map(ch => (
                  <button
                    key={ch}
                    onClick={() => setSelectedChapter(ch)}
                    className={`h-10 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${
                      selectedChapter === ch ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>

            {/* Column 3: Verses & Live Preview (7 cols) */}
            <div className="md:col-span-7 flex flex-col min-h-0 bg-gray-900">
              <div className="p-3 border-b border-gray-800 flex items-center justify-between">
                <div className="text-xs font-bold text-white">
                  {selectedBookName} {selectedChapter} <span className="text-gray-400 font-normal">({chapterVerses.length} verses)</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedVerseNumbers(chapterVerses.map(v => v.verse))}
                    className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-blue-400 rounded text-[11px] font-bold"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => setSelectedVerseNumbers([])}
                    className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded text-[11px] font-bold"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                {chapterVerses.map(v => {
                  const isSelected = selectedVerseNumbers.includes(v.verse);
                  return (
                    <div
                      key={v.verse}
                      onClick={() => toggleVerseSelection(v.verse)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                        isSelected ? 'bg-blue-900/40 border-blue-500 shadow-md' : 'bg-gray-800/60 border-gray-700/60 hover:bg-gray-800'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center border mt-0.5 shrink-0 ${
                        isSelected ? 'bg-blue-600 border-blue-400 text-white' : 'border-gray-600 bg-gray-900'
                      }`}>
                        {isSelected && <Check size={12} />}
                      </div>
                      <div>
                        <span className="text-xs font-black text-blue-400 mr-2">{v.verse}</span>
                        <span className="text-sm text-gray-200 leading-relaxed font-serif">{v.text}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Songs Tab Content */}
      {innerTab === 'songs' && (
        <div className="flex-1 min-h-0 overflow-y-auto p-6">
          <div className="mx-auto grid w-full max-w-7xl gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)]">
            <section className="space-y-5">
              <header className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-700 pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">Song Slides</h2>
                  <p className="mt-1 text-sm text-gray-400">Prepare lyrics you are authorized to display. Separate slides with a blank line.</p>
                </div>
              </header>

              <label className="block space-y-2 text-sm font-semibold text-gray-300">
                Song title
                <input
                  value={songTitle}
                  onChange={event => setSongTitle(event.target.value)}
                  placeholder="Enter a song title"
                  className="w-full border border-gray-700 bg-gray-900 px-4 py-3 text-white placeholder:text-gray-500 rounded-xl"
                />
              </label>

              <label className="block space-y-2 text-sm font-semibold text-gray-300">
                Slide text
                <textarea
                  value={songLyrics}
                  onChange={event => setSongLyrics(event.target.value)}
                  placeholder={'Paste or type authorized lyrics here.\n\nUse a blank line between slides.'}
                  rows={10}
                  className="w-full resize-y border border-gray-700 bg-gray-900 px-4 py-3 leading-relaxed text-white placeholder:text-gray-500 rounded-xl"
                />
              </label>

              <ThemeSelector selectedTheme={selectedTheme} onChange={onThemeChange} />
            </section>

            <section className="space-y-5 border-t border-gray-700 pt-5 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold uppercase text-gray-400">Slide Preview</h3>
                <span className="font-mono text-sm text-gray-400">{songSlides.length ? activeSlide + 1 : 0} / {songSlides.length}</span>
              </div>
              <div className="flex aspect-video min-h-60 flex-col items-center justify-center gap-4 overflow-hidden px-8 text-center rounded-2xl shadow-inner border border-gray-700" style={{ backgroundColor: selectedTheme === 'light' ? '#ffffff' : selectedTheme === 'blue' ? '#1e3a8a' : '#000000', color: selectedTheme === 'light' ? '#000000' : '#ffffff' }}>
                {songTitle && <div className="text-base font-semibold opacity-70">{songTitle}</div>}
                <p className="max-w-full whitespace-pre-line break-words text-2xl font-bold leading-tight sm:text-4xl">{currentSongSlide || 'Your current slide will appear here'}</p>
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  title="Previous slide"
                  aria-label="Previous slide"
                  disabled={activeSlide === 0 || songSlides.length === 0}
                  onClick={() => setActiveSlide(index => Math.max(0, index - 1))}
                  className="inline-flex items-center gap-2 border border-gray-700 px-4 py-3 text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40 rounded-xl"
                ><ChevronLeft size={18} /> Previous</button>
                <button
                  type="button"
                  title="Next slide"
                  aria-label="Next slide"
                  disabled={activeSlide >= songSlides.length - 1}
                  onClick={() => setActiveSlide(index => Math.min(songSlides.length - 1, index + 1))}
                  className="inline-flex items-center gap-2 border border-gray-700 px-4 py-3 text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40 rounded-xl"
                >Next <ChevronRight size={18} /></button>
              </div>

              <div className="flex flex-wrap gap-3 border-t border-gray-700 pt-5">
                {isProjecting ? (
                  <button type="button" onClick={onCloseProjection} className="inline-flex items-center gap-2 bg-red-700 px-5 py-3 font-bold text-white hover:bg-red-600 rounded-xl"><Square size={16} /> Stop Projection</button>
                ) : (
                  <button type="button" disabled={!currentSongSlide || selectedDisplay === null} onClick={() => onProjectSong(songTitle, currentSongSlide)} className="inline-flex items-center gap-2 bg-green-700 px-5 py-3 font-bold text-white hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-40 rounded-xl"><Play size={16} /> Project Current Slide</button>
                )}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
};
