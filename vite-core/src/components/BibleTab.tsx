import React, { useState, useEffect, useCallback, useRef } from 'react';

type Verse = { book: number; book_name: string; chapter: number; verse: number; text: string };
type BibleBook = { id: number; name: string };

interface BibleTabProps {
  availableDisplays: Array<{ id: number; label: string }>;
  selectedDisplay: number | null;
  onDisplayChange: (displayId: number) => void;
  project: () => void;
  testDisplay?: () => void;
  isProjecting?: boolean;
  onCloseProjection?: () => void;
  requestDisplaySelection?: () => void;
}

const bookNames = [
  null,
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
  'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther',
  'Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon',
  'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel',
  'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
  'Matthew', 'Mark', 'Luke', 'John',
  'Acts',
  'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon',
  'Hebrews', 'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude',
  'Revelation'
] as const;

const getBookName = (id: number) => (bookNames[id] ?? `Book ${id}`);

const bookColors = [
  'bg-rose-600',
  'bg-fuchsia-600',
  'bg-indigo-600',
  'bg-emerald-600',
  'bg-sky-600',
  'bg-amber-600',
  'bg-lime-600',
  'bg-teal-600',
  'bg-violet-600',
  'bg-pink-600',
  'bg-cyan-600',
  'bg-orange-600',
];

const getBookColor = (bookId: number) => bookColors[bookId % bookColors.length];

const bookAbbreviation: Record<string, string> = {
  Genesis: 'Gn',
  Exodus: 'Ex',
  Leviticus: 'Lv',
  Numbers: 'Nm',
  Deuteronomy: 'Dt',
  Joshua: 'Js',
  Judges: 'Jz',
  Ruth: 'Rt',
  '1 Samuel': '1Sm',
  '2 Samuel': '2Sm',
  '1 Kings': '1Rs',
  '2 Kings': '2Rs',
  '1 Chronicles': '1Cr',
  '2 Chronicles': '2Cr',
  Ezra: 'Ez',
  Nehemiah: 'Ne',
  Esther: 'Et',
  Job: 'Jó',
  Psalms: 'Sl',
  Proverbs: 'Pv',
  Ecclesiastes: 'Ec',
  'Song of Solomon': 'Ct',
  Isaiah: 'Is',
  Jeremiah: 'Jr',
  Lamentations: 'Lm',
  Ezekiel: 'Ez',
  Daniel: 'Dn',
  Hosea: 'Os',
  Joel: 'Jl',
  Amos: 'Am',
  Obadiah: 'Ob',
  Jonah: 'Jn',
  Micah: 'Mq',
  Nahum: 'Na',
  Habakkuk: 'Hc',
  Zephaniah: 'Sf',
  Haggai: 'Ag',
  Zechariah: 'Zc',
  Malachi: 'Ml',
  Matthew: 'Mt',
  Mark: 'Mc',
  Luke: 'Lc',
  John: 'Jo',
  Acts: 'At',
  Romans: 'Rm',
  '1 Corinthians': '1Co',
  '2 Corinthians': '2Co',
  Galatians: 'Gl',
  Ephesians: 'Ef',
  Philippians: 'Fp',
  Colossians: 'Cl',
  '1 Thessalonians': '1Ts',
  '2 Thessalonians': '2Ts',
  '1 Timothy': '1Tm',
  '2 Timothy': '2Tm',
  Titus: 'Tt',
  Philemon: 'Fm',
  Hebrews: 'Hb',
  James: 'Tg',
  '1 Peter': '1Pe',
  '2 Peter': '2Pe',
  '1 John': '1Jo',
  '2 John': '2Jo',
  '3 John': '3Jo',
  Jude: 'Jd',
  Revelation: 'Ap'
};

export const BibleTab: React.FC<BibleTabProps> = ({
  availableDisplays,
  selectedDisplay,
  onDisplayChange,
  project,
  testDisplay,
  isProjecting,
  onCloseProjection,
  requestDisplaySelection,
}) => {
  const [allVerses, setAllVerses] = useState<Verse[]>([]);
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [chapters, setChapters] = useState<number[]>([]);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [results, setResults] = useState<Verse[]>([]);

  useEffect(() => {
    const loadJson = async () => {
      try {
        const resp = await fetch('kjv.json');
        const data = await resp.json();
        const verses: Verse[] = Array.isArray(data) ? data : data?.verses ?? [];

        setAllVerses(verses);

        const booksMap = new Map<number, string>();
        verses.forEach(v => {
          if (!booksMap.has(v.book)) booksMap.set(v.book, v.book_name);
        });

        const sortedBooks = Array.from(booksMap.entries())
          .sort((a, b) => a[0] - b[0])
          .map(([id, name]) => ({ id, name }));

        setBooks(sortedBooks);
      } catch (err) {
        console.error('Failed to load bible JSON', err);
      }
    };

    loadJson();
  }, []);

  const [leftWidthPercent, setLeftWidthPercent] = useState<number>(() => {
    const stored = localStorage.getItem('bibleTabLeftWidthPercent');
    return stored ? Number(stored) : 33;
  });
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [selectedBookName, setSelectedBookName] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [activeVerse, setActiveVerse] = useState<number | null>(null);
  const [searchString, setSearchString] = useState('');

  const containerRef = useRef<HTMLDivElement | null>(null);
  const verseListRef = useRef<HTMLDivElement | null>(null);
  const bookListRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);

  const startDragging = () => {
    isDraggingRef.current = true;
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const clamped = Math.max(0.15, Math.min(0.7, percent));
      setLeftWidthPercent(clamped * 100);
    };

    const onMouseUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      localStorage.setItem('bibleTabLeftWidthPercent', String(leftWidthPercent));
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [leftWidthPercent]);

  useEffect(() => {
    if (!books.length || selectedBookId !== null) return;
    const genesis = books.find(b => b.id === 1);
    if (genesis) {
      setSelectedBookId(genesis.id);
      setSelectedBookName(genesis.name);
    }
  }, [books, selectedBookId]);

  useEffect(() => {
    if (selectedBookId === null) {
      setChapters([]);
      setSelectedChapter(null);
      return;
    }

    const chapterSet = new Set<number>();
    allVerses.forEach(v => {
      if (v.book === selectedBookId) chapterSet.add(v.chapter);
    });

    const chs = Array.from(chapterSet).sort((a, b) => a - b);
    setChapters(chs);
    if (chs.length > 0) setSelectedChapter(chs[0]);
  }, [selectedBookId, allVerses]);

  useEffect(() => {
    if (selectedBookId === null || selectedChapter === null) {
      setVerses([]);
      setResults([]);
      setActiveVerse(null);
      return;
    }

    const chapterVerses = allVerses
      .filter(v => v.book === selectedBookId && v.chapter === selectedChapter)
      .sort((a, b) => a.verse - b.verse);

    setVerses(chapterVerses);

    // Default to the first verse in a chapter if nothing is selected yet.
    if (activeVerse === null && chapterVerses.length > 0) {
      const first = chapterVerses[0];
      setActiveVerse(first.verse);
      setResults([first]);
    } else if (activeVerse !== null) {
      const current = chapterVerses.find(v => v.verse === activeVerse);
      if (current) setResults([current]);
    }
  }, [selectedBookId, selectedChapter, allVerses, activeVerse]);


  const filteredBooks = React.useMemo(() => {
    if (!searchString) return books;
    const lower = searchString.toLowerCase();
    return books.filter(b => b.name.toLowerCase().includes(lower));
  }, [books, searchString]);

  const [projectionTheme] = useState<string>(() => {
    return localStorage.getItem('projectionTheme') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('bibleProjectionData', JSON.stringify({ verses: results, theme: projectionTheme }));
  }, [results, projectionTheme]);

  const translations = ['KJV', 'NIV', 'NVT'];
  const [translation, setTranslation] = useState(translations[0]);

  const selectBook = (book: BibleBook) => {
    setSelectedBookId(book.id);
    setSelectedBookName(book.name);
    setSelectedChapter(null);
    setActiveVerse(null);
    setResults([]);

    // make sure header and verses are visible when switching books
    setTimeout(() => {
      verseListRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      bookListRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, 0);
  };

  const selectVerse = (verse: Verse) => {
    setActiveVerse(verse.verse);
    setResults([verse]);
    if (selectedDisplay !== null) {
      project();
    } else if (requestDisplaySelection) {
      requestDisplaySelection();
    }
  };

  const navigateChapter = useCallback(
    (direction: 'prev' | 'next') => {
      if (!selectedBookId || chapters.length === 0) return;
      const currentIndex = chapters.indexOf(selectedChapter ?? chapters[0]);
      if (currentIndex === -1) return;
      const nextIndex = direction === 'prev' ? Math.max(0, currentIndex - 1) : Math.min(chapters.length - 1, currentIndex + 1);
      const nextChapter = chapters[nextIndex];

      if (nextChapter !== selectedChapter) {
        setSelectedChapter(nextChapter);
        const nextVerse = allVerses.find(v => v.book === selectedBookId && v.chapter === nextChapter);
        if (nextVerse) {
          setActiveVerse(nextVerse.verse);
          setResults([nextVerse]);
        } else {
          setActiveVerse(null);
          setResults([]);
        }
      }
    },
    [chapters, selectedBookId, selectedChapter, allVerses]
  );

  const navigateVerse = useCallback(
    (direction: 'prev' | 'next') => {
      if (verses.length === 0) return;
      const currentIndex = verses.findIndex(v => v.verse === activeVerse);
      const nextIndex = direction === 'prev' ? Math.max(0, (currentIndex === -1 ? 0 : currentIndex) - 1) : Math.min(verses.length - 1, (currentIndex === -1 ? 0 : currentIndex) + 1);
      const nextVerse = verses[nextIndex];
      if (nextVerse) {
        selectVerse(nextVerse);
      }
    },
    [verses, activeVerse, selectVerse]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const active = (document.activeElement?.tagName || '').toUpperCase();

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        const input = document.querySelector<HTMLInputElement>('input[placeholder^="Filter books"]');
        input?.focus();
        input?.select();
        e.preventDefault();
        return;
      }

      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        // Allow arrow navigation even while typing in the filter input
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(active)) {
          e.preventDefault();
        }

        if (e.key === 'ArrowLeft') {
          navigateVerse('prev');
        } else if (e.key === 'ArrowRight') {
          navigateVerse('next');
        } else if (e.key === 'ArrowUp') {
          navigateChapter('prev');
        } else if (e.key === 'ArrowDown') {
          navigateChapter('next');
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [navigateChapter, navigateVerse]);

  useEffect(() => {
    if (activeVerse === null) return;
    const el = document.getElementById(`verse-${activeVerse}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [activeVerse]);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-900 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <select
            value={selectedDisplay === null ? '' : selectedDisplay}
            onChange={e => onDisplayChange(Number(e.target.value))}
            className="px-3 py-2 bg-gray-800 text-white"
          >
            <option value="" disabled>
              Display
            </option>
            {availableDisplays.map(d => (
              <option key={d.id} value={d.id}>{d.label}</option>
            ))}
          </select>
        </div>

        {isProjecting && onCloseProjection ? (
          <button
            onClick={onCloseProjection}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-500"
          >
            Stop Projection
          </button>
        ) : (
          <button
            onClick={project}
            disabled={results.length === 0}
            className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Project
          </button>
        )}
        {selectedDisplay === null && requestDisplaySelection ? (
          <button
            onClick={requestDisplaySelection}
            className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Choose Screen
          </button>
        ) : null}
        {testDisplay ? (
          <button
            onClick={testDisplay}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-500"
          >
            Test Display
          </button>
        ) : null}
      </div>

      <div ref={containerRef} className="flex flex-1 overflow-hidden min-h-0">
        {/* Left: preview (verse text) */}
        <div
          style={{ width: `${leftWidthPercent}%` }}
          className="flex flex-col border-r border-gray-700/60 bg-gray-900 min-h-0"
        >
          <div className="p-3 border-b border-gray-700/60">
            <div className="text-xs text-gray-400">Preview</div>
            <div className="text-white text-base font-semibold">
              {selectedBookName ? `${bookAbbreviation[selectedBookName] ?? selectedBookName} ${selectedChapter ?? ''}` : 'Select a book'}
            </div>
          </div>

          <div ref={verseListRef} className="flex-1 min-h-0 overflow-y-auto p-3 space-y-1">
            {selectedBookId !== null && selectedChapter !== null ? (
              verses.map(v => (
                <div
                  id={`verse-${v.verse}`}
                  key={v.verse}
                  className={`p-2 cursor-pointer ${
                    activeVerse === v.verse ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
                  }`}
                  onClick={() => selectVerse(v)}
                >
                  <div className="text-sm font-semibold">{v.verse}</div>
                  <div className="text-sm leading-relaxed">{v.text}</div>
                </div>
              ))
            ) : (
              <div className="text-gray-400">Select a book and chapter on the right to view verses.</div>
            )}
          </div>
        </div>

        {/* Resize handler */}
        <div
          className="w-2 cursor-col-resize bg-gray-800/60 hover:bg-gray-700"
          onMouseDown={startDragging}
          onDoubleClick={() => setLeftWidthPercent(33)}
          title="Drag to resize panels"
        />

        {/* Right: Book grid + chapter/verse selectors */}
        <div className="flex-1 flex flex-col bg-gray-900 min-h-0 overflow-hidden">
          <div ref={bookListRef} className="flex-none overflow-y-auto p-2">
            <div className="grid grid-cols-10 gap-1">
              {filteredBooks.map(book => (
                <button
                  key={book.id}
                  className={`flex flex-col items-center justify-center p-2 text-white transition ${
                    selectedBookId === book.id
                      ? 'ring-2 ring-white'
                      : `${getBookColor(book.id)} bg-opacity-90`
                  }`}
                  onClick={() => selectBook(book)}
                >
                  <div className="text-sm font-bold">{bookAbbreviation[book.name] ?? book.name.slice(0, 3)}</div>
                  <div className="text-[10px] opacity-80 mt-1 text-center">{book.name}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-none border-t border-gray-700/60">
            <div className="flex flex-col md:flex-row">
              <div className="flex-1 border-r border-gray-700/60 p-3">
                <div className="text-gray-300 mb-1 text-xs">Chapters</div>
                <div className="grid gap-1 grid-cols-[repeat(auto-fit,minmax(36px,1fr))]">
                  {chapters.map(ch => (
                    <button
                      key={ch}
                      className={`px-2 py-2 text-xs font-semibold text-center ${
                        selectedChapter === ch ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
                      }`}
                      onClick={() => {
                        setSelectedChapter(ch);
                        setActiveVerse(null);
                      }}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 p-3">
                <div className="text-gray-300 mb-1 text-xs">Verses</div>
                <div className="grid gap-1 grid-cols-[repeat(auto-fit,minmax(36px,1fr))]">
                  {verses.map(v => (
                    <button
                      key={v.verse}
                      className={`px-2 py-2 text-xs font-semibold text-center ${
                        activeVerse === v.verse ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
                      }`}
                      onClick={() => selectVerse(v)}
                    >
                      {v.verse}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
