import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Plus, Save, Trash2, Play, Square, BookOpen, Music, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { ThemeSelector } from './ThemeSelector';

export type Verse = { book: number; book_name: string; chapter: number; verse: number; text: string };
type BibleBook = { id: number; name: string };
type BibleMobilePane = 'books' | 'chapters' | 'verses';
type SavedSong = { id: string; title: string; lyrics: string; updatedAt: number };

const readSongLibrary = (): SavedSong[] => {
  try {
    const saved = localStorage.getItem('bibleSongsLibrary');
    if (saved) {
      const parsed: unknown = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed.filter((song): song is SavedSong => Boolean(song && typeof song.id === 'string' && typeof song.title === 'string' && typeof song.lyrics === 'string'));
    }
  } catch {
    return [];
  }
  const title = localStorage.getItem('songEditorTitle') || '';
  const lyrics = localStorage.getItem('songEditorSlides') || '';
  return title.trim() || lyrics.trim() ? [{ id: 'legacy-song', title: title.trim() || 'Untitled song', lyrics, updatedAt: Date.now() }] : [];
};

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

const bookAliases: Record<string, string[]> = {
  Genesis: ['gen', 'ge', 'gn'], Exodus: ['ex', 'exo'], Leviticus: ['lev', 'lv'],
  Numbers: ['num', 'nm'], Deuteronomy: ['deut', 'deu', 'dt'], Psalms: ['psalm', 'ps', 'psa', 'sl'],
  Proverbs: ['prov', 'pr', 'pv'], 'Song of Solomon': ['song', 'song of songs', 'canticles', 'sos'],
  Matthew: ['matt', 'mt'], Mark: ['mk', 'mrk'], Luke: ['lk', 'luk'], John: ['jn', 'jhn'],
  Acts: ['act'], Romans: ['rom', 'rm'], Revelation: ['rev', 're', 'apoc'],
};

const normalizeBookQuery = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]/gi, '')
  .toLowerCase();

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
  const [mobileBiblePane, setMobileBiblePane] = useState<BibleMobilePane>('books');

  // Bible State
  const [allVerses, setAllVerses] = useState<Verse[]>([]);
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [selectedBookName, setSelectedBookName] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [selectedVerseNumbers, setSelectedVerseNumbers] = useState<number[]>([]);
  const [quickSearch, setQuickSearch] = useState('');
  const [quickSearchMessage, setQuickSearchMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [bookFilter, setBookFilter] = useState('');
  const pendingReferenceRef = useRef<{ bookId: number; chapter: number; verseNumbers: number[] } | null>(null);

  // Songs State
  const [savedSongs, setSavedSongs] = useState<SavedSong[]>(readSongLibrary);
  const [songTitle, setSongTitle] = useState(() => localStorage.getItem('songEditorTitle') || '');
  const [songLyrics, setSongLyrics] = useState(() => localStorage.getItem('songEditorSlides') || '');
  const [songSearch, setSongSearch] = useState('');
  const [selectedSongId, setSelectedSongId] = useState<string | null>(() => {
    const savedId = localStorage.getItem('songEditorSelectedId');
    if (savedSongs.some(song => song.id === savedId)) return savedId;
    const title = localStorage.getItem('songEditorTitle') || '';
    const lyrics = localStorage.getItem('songEditorSlides') || '';
    return savedSongs.find(song => song.title === title && song.lyrics === lyrics)?.id ?? null;
  });
  const [songSaveMessage, setSongSaveMessage] = useState('');
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
        } catch {
          continue;
        }
      }
    };
    loadBible();
  }, []);

  const chapters = useMemo(() => {
    if (selectedBookId === null) return [];
    return [...new Set(allVerses.filter(verse => verse.book === selectedBookId).map(verse => verse.chapter))].sort((a, b) => a - b);
  }, [allVerses, selectedBookId]);

  const chapterVerses = useMemo(() => {
    if (selectedBookId === null || selectedChapter === null) return [];
    return allVerses.filter(verse => verse.book === selectedBookId && verse.chapter === selectedChapter);
  }, [allVerses, selectedBookId, selectedChapter]);

  useEffect(() => {
    if (chapters.length === 0) {
      if (selectedChapter !== null) setSelectedChapter(null);
    } else if (!chapters.includes(selectedChapter ?? -1)) {
      const pending = pendingReferenceRef.current;
      setSelectedChapter(pending?.bookId === selectedBookId && chapters.includes(pending.chapter) ? pending.chapter : chapters[0]);
    }
  }, [chapters, selectedBookId, selectedChapter]);

  useEffect(() => {
    const pending = pendingReferenceRef.current;
    if (pending?.bookId === selectedBookId && pending.chapter === selectedChapter) {
      setSelectedVerseNumbers(pending.verseNumbers);
      pendingReferenceRef.current = null;
      return;
    }
    setSelectedVerseNumbers(chapterVerses.length > 0 ? [chapterVerses[0].verse] : []);
  }, [chapterVerses, selectedBookId, selectedChapter]);

  // Quick Reference Parser
  const handleQuickSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (allVerses.length === 0) {
      setQuickSearchMessage({ type: 'error', text: 'Bible data is still loading. Try again in a moment.' });
      return;
    }
    const trimmed = quickSearch.trim();
    const match = trimmed.match(/^(.+?)\s+(\d+)(?:\s*[:.]\s*(\d+)(?:\s*[-–—]\s*(\d+))?)?$/i);
    if (!match) {
      setQuickSearchMessage({ type: 'error', text: 'Enter a reference such as John 3:16, Psalm 23, or Romans 8:28-30.' });
      return;
    }
    const [, bookQuery, chStr, vStartStr, vEndStr] = match;
    const chapter = parseInt(chStr, 10);
    const vStart = vStartStr ? parseInt(vStartStr, 10) : null;
    const vEnd = vEndStr ? parseInt(vEndStr, 10) : vStart;

    const bookKey = normalizeBookQuery(bookQuery);
    const foundBook = books.find(book => {
      const names = [book.name, bookAbbreviation[book.name] || '', ...(bookAliases[book.name] || [])];
      return names.some(name => normalizeBookQuery(name) === bookKey);
    });
    if (!foundBook) {
      setQuickSearchMessage({ type: 'error', text: `Could not find the book "${bookQuery.trim()}" in the KJV Bible.` });
      return;
    }

    const inChapter = allVerses.filter(verse => verse.book === foundBook.id && verse.chapter === chapter);
    if (inChapter.length === 0) {
      setQuickSearchMessage({ type: 'error', text: `${foundBook.name} does not have a chapter ${chapter}.` });
      return;
    }
    if (vStart !== null && (vStart < 1 || vEnd === null || vEnd < vStart || vEnd > inChapter[inChapter.length - 1].verse)) {
      setQuickSearchMessage({ type: 'error', text: `That verse range is not valid. ${foundBook.name} ${chapter} has verses 1-${inChapter[inChapter.length - 1].verse}.` });
      return;
    }

    const matching = vStart === null
      ? inChapter
      : inChapter.filter(verse => verse.verse >= vStart && verse.verse <= (vEnd ?? vStart));
    const selected = matching.map(verse => verse.verse);
    const samePassage = selectedBookId === foundBook.id && selectedChapter === chapter;
    pendingReferenceRef.current = samePassage ? null : { bookId: foundBook.id, chapter, verseNumbers: selected };
    setSelectedBookId(foundBook.id);
    setSelectedBookName(foundBook.name);
    setSelectedChapter(chapter);
    setMobileBiblePane('verses');
    if (samePassage) setSelectedVerseNumbers(selected);
    setQuickSearchMessage({ type: 'success', text: `${foundBook.name} ${chapter}${vStart === null ? '' : `:${vStart}${vEnd !== null && vEnd !== vStart ? `-${vEnd}` : ''}`} selected. Review the passage, then project when ready.` });
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
    localStorage.setItem('bibleSongsLibrary', JSON.stringify(savedSongs));
  }, [savedSongs]);

  useEffect(() => {
    if (selectedSongId) localStorage.setItem('songEditorSelectedId', selectedSongId);
    else localStorage.removeItem('songEditorSelectedId');
  }, [selectedSongId]);

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
  const filteredSongs = savedSongs
    .filter(song => song.title.toLowerCase().includes(songSearch.trim().toLowerCase()))
    .sort((left, right) => right.updatedAt - left.updatedAt);

  const saveSong = () => {
    const title = songTitle.trim();
    if (!title) {
      setSongSaveMessage('Add a song title before saving.');
      return;
    }
    const id = selectedSongId || `song-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const song = { id, title, lyrics: songLyrics, updatedAt: Date.now() };
    setSavedSongs(previous => previous.some(item => item.id === id)
      ? previous.map(item => item.id === id ? song : item)
      : [song, ...previous]);
    setSelectedSongId(id);
    setSongSaveMessage(`Saved "${title}".`);
  };

  const startNewSong = () => {
    setSelectedSongId(null);
    setSongTitle('');
    setSongLyrics('');
    setActiveSlide(0);
    setSongSaveMessage('New song draft. Save it to add it to your library.');
  };

  const openSong = (song: SavedSong) => {
    setSelectedSongId(song.id);
    setSongTitle(song.title);
    setSongLyrics(song.lyrics);
    setActiveSlide(0);
    setSongSaveMessage('');
  };

  const deleteSong = (song: SavedSong) => {
    if (!window.confirm(`Delete "${song.title}" from the song library?`)) return;
    setSavedSongs(previous => previous.filter(item => item.id !== song.id));
    if (selectedSongId === song.id) startNewSong();
    setSongSaveMessage(`Deleted "${song.title}".`);
  };

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
          <form onSubmit={handleQuickSearchSubmit} className="flex flex-col gap-2 border-b border-gray-700 bg-gray-800/60 p-3 sm:flex-row sm:items-center sm:gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={quickSearch}
                onChange={e => { setQuickSearch(e.target.value); setQuickSearchMessage(null); }}
                aria-label="Search a Bible passage"
                placeholder="Find passage, e.g. John 3:16 or Ps 23"
                className="w-full rounded-lg border border-gray-700 bg-gray-900 py-3 pl-9 pr-4 text-sm font-semibold text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-500"
            >
              <Search size={16} /> Go to passage
            </button>
          </form>
          {quickSearchMessage && (
            <p role={quickSearchMessage.type === 'error' ? 'alert' : 'status'} className={`border-b px-3 py-2 text-xs ${quickSearchMessage.type === 'error' ? 'border-red-900 bg-red-950/40 text-red-200' : 'border-emerald-900 bg-emerald-950/30 text-emerald-200'}`}>
              {quickSearchMessage.text}
            </p>
          )}

          <nav className="grid grid-cols-3 gap-1 border-b border-gray-700 bg-gray-900 p-2 md:hidden" aria-label="Bible navigation">
            {([
              ['books', 'Books', selectedBookName || 'Browse'],
              ['chapters', 'Chapters', selectedChapter ? `${chapters.length} available` : 'Choose a book'],
              ['verses', 'Verses', `${selectedVerseNumbers.length} selected`],
            ] as const).map(([pane, label, detail]) => (
              <button
                key={pane}
                type="button"
                onClick={() => setMobileBiblePane(pane)}
                disabled={pane !== 'books' && selectedBookId === null || pane === 'verses' && selectedChapter === null}
                aria-current={mobileBiblePane === pane ? 'step' : undefined}
                className={`min-h-14 rounded-lg px-2 py-1 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${mobileBiblePane === pane ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'}`}
              >
                <span className="block text-xs font-bold">{label}</span>
                <span className={`mt-0.5 block truncate text-[10px] ${mobileBiblePane === pane ? 'text-blue-100' : 'text-gray-500'}`}>{detail}</span>
              </button>
            ))}
          </nav>

          {/* Main 3-Column Bible Workspace */}
          <div className="grid grid-cols-1 md:grid-cols-12 flex-1 min-h-0 overflow-hidden">
            {/* Column 1: Books (3 cols) */}
            <div className={`${mobileBiblePane === 'books' ? 'flex' : 'hidden'} md:col-span-3 md:flex flex-col border-r border-gray-700 bg-gray-900/90 min-h-0`}>
              <div className="p-3 border-b border-gray-800">
                <input
                  type="text"
                  value={bookFilter}
                  onChange={e => setBookFilter(e.target.value)}
                  placeholder="Filter books..."
                  aria-label="Filter Bible books"
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-3 text-sm font-semibold text-white outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {filteredBooks.map(b => (
                  <button
                    key={b.id}
                    onClick={() => {
                      setSelectedBookId(b.id);
                      setSelectedBookName(b.name);
                      setMobileBiblePane('chapters');
                    }}
                    className={`w-full min-h-11 flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-bold transition-all ${
                      selectedBookId === b.id ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    <span className="truncate">{b.name}</span>
                    <span className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${getBookColor(b.id)}`} />
                      <ChevronRight className="h-4 w-4 text-gray-500 md:hidden" />
                    </span>
                  </button>
                ))}
                {filteredBooks.length === 0 && <p className="px-3 py-6 text-center text-sm text-gray-500">No books match that search.</p>}
              </div>
            </div>

            {/* Column 2: Chapters (2 cols) */}
            <div className={`${mobileBiblePane === 'chapters' ? 'flex' : 'hidden'} md:col-span-2 md:flex flex-col border-r border-gray-700 bg-gray-900/60 min-h-0`}>
              <div className="flex items-center justify-between gap-2 border-b border-gray-800 p-3 text-xs font-black uppercase tracking-widest text-gray-400">
                Chapters ({chapters.length})
                <button type="button" onClick={() => setMobileBiblePane('books')} className="rounded px-2 py-1 text-[10px] font-bold text-blue-300 hover:bg-gray-800 md:hidden">Change book</button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 grid grid-cols-4 md:grid-cols-3 content-start gap-1.5 custom-scrollbar">
                {chapters.map(ch => (
                  <button
                    key={ch}
                    onClick={() => { setSelectedChapter(ch); setMobileBiblePane('verses'); }}
                    className={`h-11 rounded-lg text-sm font-bold transition-all flex items-center justify-center ${
                      selectedChapter === ch ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            </div>

            {/* Column 3: Verses & Live Preview (7 cols) */}
            <div className={`${mobileBiblePane === 'verses' ? 'flex' : 'hidden'} md:col-span-7 md:flex flex-col min-h-0 bg-gray-900`}>
              <div className="flex items-center justify-between gap-2 border-b border-gray-800 p-3">
                <div className="text-xs font-bold text-white">
                  {selectedBookName} {selectedChapter} <span className="text-gray-400 font-normal">({chapterVerses.length} verses)</span>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    onClick={() => setSelectedVerseNumbers(chapterVerses.map(v => v.verse))}
                    className="min-h-9 rounded bg-gray-800 px-2.5 py-1 text-[11px] font-bold text-blue-400 hover:bg-gray-700"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => setSelectedVerseNumbers([])}
                    className="min-h-9 rounded bg-gray-800 px-2.5 py-1 text-[11px] font-bold text-gray-400 hover:bg-gray-700"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                {chapterVerses.map(v => {
                  const isSelected = selectedVerseNumbers.includes(v.verse);
                  return (
                    <button
                      key={v.verse}
                      onClick={() => toggleVerseSelection(v.verse)}
                      type="button"
                      aria-pressed={isSelected}
                      className={`w-full p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
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
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-2 border-t border-gray-700 bg-gray-900/95 px-3 py-2.5 backdrop-blur sm:px-4">
            <div className="min-w-0 text-xs text-gray-400">
              <span className="font-bold text-white">{selectedVerseNumbers.length} selected</span>
              <span className="hidden sm:inline"> · {selectedBookName} {selectedChapter}</span>
              {selectedDisplay === null && <span className="block text-amber-300 sm:inline sm:ml-2">Choose a screen above to project</span>}
            </div>
            <div className="flex shrink-0 gap-2">
              {testDisplay && (
                <button type="button" onClick={testDisplay} disabled={selectedDisplay === null} className="min-h-10 rounded-lg bg-gray-800 px-3 text-xs font-bold text-gray-200 hover:bg-gray-700 disabled:opacity-40">Test</button>
              )}
              {isProjecting ? (
                <button type="button" onClick={onCloseProjection} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-bold text-white hover:bg-red-500"><Square size={14} /> Stop projection</button>
              ) : (
                <button type="button" onClick={() => projectBible(currentSelectedVerses)} disabled={currentSelectedVerses.length === 0 || selectedDisplay === null} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-green-600 px-4 text-sm font-bold text-white hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-40"><Play size={15} /> Project selected</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Songs Tab Content */}
      {innerTab === 'songs' && (
        <div className="flex-1 min-h-0 overflow-y-auto p-6">
          <section className="mx-auto mb-5 w-full max-w-7xl border-b border-gray-700 pb-4" aria-label="Song library">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white">Song library</h2>
                <p className="mt-0.5 text-xs text-gray-400">{savedSongs.length} saved {savedSongs.length === 1 ? 'song' : 'songs'} on this device</p>
              </div>
              <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                <label className="relative min-w-[9rem] flex-1 sm:w-56 sm:flex-none">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={15} />
                  <input
                    type="search"
                    value={songSearch}
                    onChange={event => setSongSearch(event.target.value)}
                    placeholder="Search saved songs"
                    aria-label="Search saved songs"
                    className="min-h-10 w-full rounded-lg border border-gray-700 bg-gray-900 py-2 pl-9 pr-3 text-sm text-white outline-none focus:border-blue-500"
                  />
                </label>
                <button type="button" onClick={startNewSong} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-gray-600 px-3 text-sm font-semibold text-gray-200 hover:bg-gray-800"><Plus size={15} /> New</button>
                <button type="button" onClick={saveSong} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white hover:bg-blue-500"><Save size={15} /> {selectedSongId ? 'Save changes' : 'Save song'}</button>
              </div>
            </div>

            {songSaveMessage && <p role="status" className="mt-2 text-xs text-emerald-300">{songSaveMessage}</p>}

            {savedSongs.length > 0 ? (
              <div className="mt-3 grid max-h-36 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2 xl:grid-cols-3">
                {filteredSongs.map(song => {
                  const slideCount = song.lyrics.split(/\n\s*\n/).map(slide => slide.trim()).filter(Boolean).length;
                  return (
                    <div key={song.id} className={`flex min-w-0 items-center rounded-lg border ${selectedSongId === song.id ? 'border-blue-500 bg-blue-950/30' : 'border-gray-700 bg-gray-900/60'}`}>
                      <button type="button" onClick={() => openSong(song)} aria-pressed={selectedSongId === song.id} className="min-h-12 min-w-0 flex-1 px-3 py-2 text-left hover:bg-white/5">
                        <span className="block truncate text-sm font-semibold text-white">{song.title}</span>
                        <span className="mt-0.5 block text-[11px] text-gray-500">{slideCount} {slideCount === 1 ? 'slide' : 'slides'}</span>
                      </button>
                      <button type="button" onClick={() => deleteSong(song)} title={`Delete ${song.title}`} aria-label={`Delete ${song.title}`} className="mr-1 rounded p-2 text-gray-500 hover:bg-red-950 hover:text-red-300"><Trash2 size={15} /></button>
                    </div>
                  );
                })}
                {filteredSongs.length === 0 && <p className="px-2 py-4 text-sm text-gray-500">No saved songs match that search.</p>}
              </div>
            ) : (
              <p className="mt-3 rounded-lg bg-gray-900/60 px-3 py-3 text-sm text-gray-400">No saved songs yet. Add a title and slide text below, then choose Save song.</p>
            )}
          </section>

          <div className="mx-auto grid w-full max-w-7xl gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)]">
            <section className="space-y-5">
              <header className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-700 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Song editor</h2>
                  <p className="mt-1 text-sm text-gray-400">Prepare lyrics you are authorized to display. Separate slides with a blank line.</p>
                </div>
              </header>

              <label className="block space-y-2 text-sm font-semibold text-gray-300">
                Song title
                <input
                  value={songTitle}
                  onChange={event => { setSongTitle(event.target.value); setSongSaveMessage(''); }}
                  placeholder="Enter a song title"
                  className="w-full border border-gray-700 bg-gray-900 px-4 py-3 text-white placeholder:text-gray-500 rounded-xl"
                />
              </label>

              <label className="block space-y-2 text-sm font-semibold text-gray-300">
                Slide text
                <textarea
                  value={songLyrics}
                  onChange={event => { setSongLyrics(event.target.value); setSongSaveMessage(''); }}
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
