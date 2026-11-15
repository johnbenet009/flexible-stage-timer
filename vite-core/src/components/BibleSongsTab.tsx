import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Plus, Save, Trash2, Play, Square, BookOpen, Music, Check, ChevronLeft, ChevronRight, History, Keyboard, RefreshCw, Settings2 } from 'lucide-react';
import { ThemeSelector } from './ThemeSelector';
import { ProjectionSettingsPanel } from './ProjectionSettingsPanel';
import { useProjectionSettings } from './projectionSettings';

export type Verse = { book: number; book_name: string; chapter: number; verse: number; text: string };
type BibleBook = { id: number; name: string };
type BibleMobilePane = 'books' | 'chapters' | 'verses';
type SavedSong = { id: string; title: string; lyrics: string; updatedAt: number };
type BibleTool = 'browse' | 'search' | 'history';
type BibleReference = { id: string; label: string; verses: Verse[]; addedAt: number };

const readBibleReferences = (key: string): BibleReference[] => {
  try {
    const saved: unknown = JSON.parse(sessionStorage.getItem(key) || '[]');
    return Array.isArray(saved) ? saved.filter((item): item is BibleReference => Boolean(item && typeof item.id === 'string' && Array.isArray(item.verses))) : [];
  } catch {
    return [];
  }
};

const BIBLE_SECTIONS: Array<{ name: string; color: string; books: string[] }> = [
  { name: 'Law', color: 'bg-sky-700', books: ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy'] },
  { name: 'History', color: 'bg-emerald-700', books: ['Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther'] },
  { name: 'Poetry', color: 'bg-amber-700', books: ['Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon'] },
  { name: 'Major Prophets', color: 'bg-rose-700', books: ['Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel'] },
  { name: 'Minor Prophets', color: 'bg-orange-700', books: ['Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'] },
  { name: 'Gospels', color: 'bg-teal-700', books: ['Matthew', 'Mark', 'Luke', 'John'] },
  { name: 'Church History', color: 'bg-cyan-700', books: ['Acts'] },
  { name: 'Letters', color: 'bg-indigo-700', books: ['Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude'] },
  { name: 'Revelation', color: 'bg-slate-700', books: ['Revelation'] },
];

const bookSectionColor = new Map(BIBLE_SECTIONS.flatMap(section => section.books.map(book => [book, section.color] as const)));
const numberGridColumns = (count: number) => Math.max(1, Math.ceil(Math.sqrt(count * 1.6)));

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
  onRefreshDisplays: () => void;
  projectBible: (verses: Verse[], options?: { referenceOnly?: boolean; description?: string }) => void;
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
  Joshua: 'Jos', Judges: 'Jg', Ruth: 'Ru', '1 Samuel': '1Sm', '2 Samuel': '2Sm',
  '1 Kings': '1Ki', '2 Kings': '2Ki', '1 Chronicles': '1Ch', '2 Chronicles': '2Ch',
  Ezra: 'Ezr', Nehemiah: 'Ne', Esther: 'Es', Job: 'Jb', Psalms: 'Ps',
  Proverbs: 'Pr', Ecclesiastes: 'Ec', 'Song of Solomon': 'So', Isaiah: 'Is',
  Jeremiah: 'Jr', Lamentations: 'La', Ezekiel: 'Eze', Daniel: 'Dn',
  Hosea: 'Ho', Joel: 'Jl', Amos: 'Am', Obadiah: 'Ob', Jonah: 'Jon',
  Micah: 'Mic', Nahum: 'Na', Habakkuk: 'Hab', Zephaniah: 'Zp',
  Haggai: 'Hg', Zechariah: 'Zc', Malachi: 'Ml', Matthew: 'Mt',
  Mark: 'Mk', Luke: 'Lk', John: 'Jn', Acts: 'Ac', Romans: 'Rm',
  '1 Corinthians': '1Co', '2 Corinthians': '2Co', Galatians: 'Ga',
  Ephesians: 'Eph', Philippians: 'Php', Colossians: 'Col', '1 Thessalonians': '1Th',
  '2 Thessalonians': '2Th', '1 Timothy': '1Ti', '2 Timothy': '2Ti',
  Titus: 'Tit', Philemon: 'Phm', Hebrews: 'Heb', James: 'Jm',
  '1 Peter': '1Pe', '2 Peter': '2Pe', '1 John': '1Jo', '2 John': '2Jo',
  '3 John': '3Jo', Jude: 'Jud', Revelation: 'Rev'
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

const bibleSearchWords = (value: string) => value.toLocaleLowerCase().match(/[a-z0-9]+/g) || [];

export const BibleSongsTab: React.FC<BibleSongsTabProps> = ({
  availableDisplays,
  selectedDisplay,
  onDisplayChange,
  onRefreshDisplays,
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
  const [bibleTool, setBibleTool] = useState<BibleTool>('browse');
  const [projectionSettings, updateProjectionSettings] = useProjectionSettings();
  const [showBibleSettings, setShowBibleSettings] = useState(false);

  // Bible State
  const [allVerses, setAllVerses] = useState<Verse[]>([]);
  const [books, setBooks] = useState<BibleBook[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [selectedBookName, setSelectedBookName] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [selectedVerseNumbers, setSelectedVerseNumbers] = useState<number[]>([]);
  const [quickLookupOpen, setQuickLookupOpen] = useState(false);
  const [quickLookupStage, setQuickLookupStage] = useState<'book' | 'chapter' | 'verse'>('book');
  const [quickLookupQuery, setQuickLookupQuery] = useState('');
  const [quickLookupBook, setQuickLookupBook] = useState<BibleBook | null>(null);
  const [bookFilter, setBookFilter] = useState('');
  const searchTextRef = useRef<HTMLInputElement>(null);
  const verseReaderRef = useRef<HTMLDivElement>(null);
  const [presentedVerses, setPresentedVerses] = useState<Verse[]>([]);
  const [bibleHistory, setBibleHistory] = useState<BibleReference[]>(() => readBibleReferences('bibleHistory'));
  const [searchText, setSearchText] = useState('');
  const [searchMode, setSearchMode] = useState<'exact' | 'all' | 'any'>('all');
  const [searchTestament, setSearchTestament] = useState<'all' | 'old' | 'new'>('all');
  const [searchBookId, setSearchBookId] = useState('all');
  const [searchResults, setSearchResults] = useState<Verse[]>([]);
  const [searchMessage, setSearchMessage] = useState('');
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

  const quickBookMatches = useMemo(() => {
    const query = normalizeBookQuery(quickLookupQuery);
    if (!query) return [];
    return books.filter(book => [book.name, bookAbbreviation[book.name] || '', ...(bookAliases[book.name] || [])]
      .some(name => normalizeBookQuery(name).startsWith(query))).slice(0, 8);
  }, [books, quickLookupQuery]);

  const quickLookupChapterCandidates = useMemo(() => {
    const query = quickLookupQuery.trim();
    return chapters.filter(chapter => query === '' || String(chapter).startsWith(query));
  }, [chapters, quickLookupQuery]);

  const quickLookupVerseCandidates = useMemo(() => {
    const query = quickLookupQuery.trim();
    return chapterVerses.filter(verse => query === '' || String(verse.verse).startsWith(query));
  }, [chapterVerses, quickLookupQuery]);

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

  const chooseQuickBook = (book: BibleBook) => {
    setQuickLookupBook(book);
    setSelectedBookId(book.id);
    setSelectedBookName(book.name);
    setSelectedChapter(null);
    setSelectedVerseNumbers([]);
    setQuickLookupStage('chapter');
    setQuickLookupQuery('');
  };

  const chooseQuickChapter = (chapter: number) => {
    setSelectedChapter(chapter);
    setQuickLookupStage('verse');
    setQuickLookupQuery('');
    setMobileBiblePane('verses');
  };

  const chooseQuickVerse = (verseNumber: number, closeLookup = false, projectVerse = false) => {
    if (!chapterVerses.some(verse => verse.verse === verseNumber)) return;
    setSelectedVerseNumbers([verseNumber]);
    setMobileBiblePane('verses');
    if (closeLookup && projectVerse) {
      const verse = chapterVerses.find(item => item.verse === verseNumber);
      if (verse) presentVerses([verse]);
    }
    if (closeLookup) {
      setQuickLookupOpen(false);
      setQuickLookupStage('book');
      setQuickLookupQuery('');
    }
  };

  const currentSelectedVerses = React.useMemo(() => {
    return chapterVerses.filter(v => selectedVerseNumbers.includes(v.verse));
  }, [chapterVerses, selectedVerseNumbers]);

  useEffect(() => {
    if (!isProjecting || presentedVerses.length === 0) return;
    const reader = verseReaderRef.current;
    const activeVerse = reader?.querySelector<HTMLElement>('[data-projected-verse="true"]');
    if (!reader || !activeVerse) return;
    const readerRect = reader.getBoundingClientRect();
    const activeRect = activeVerse.getBoundingClientRect();
    const top = reader.scrollTop + activeRect.top - readerRect.top - (reader.clientHeight - activeRect.height) / 2;
    reader.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }, [isProjecting, presentedVerses, selectedBookId, selectedChapter]);

  useEffect(() => {
    sessionStorage.setItem('bibleHistory', JSON.stringify(bibleHistory));
  }, [bibleHistory]);

  const navigateToVerses = (verses: Verse[]) => {
    if (verses.length === 0) return;
    const first = verses[0];
    pendingReferenceRef.current = { bookId: first.book, chapter: first.chapter, verseNumbers: verses.map(verse => verse.verse) };
    setSelectedBookId(first.book);
    setSelectedBookName(first.book_name);
    setSelectedChapter(first.chapter);
    setSelectedVerseNumbers(verses.map(verse => verse.verse));
    setMobileBiblePane('verses');
    setBibleTool('browse');
  };

  const referenceLabel = (verses: Verse[]) => {
    if (verses.length === 0) return 'No passage selected';
    const first = verses[0];
    const last = verses[verses.length - 1];
    const range = verses.length > 1 ? `:${first.verse}-${last.verse}` : `:${first.verse}`;
    return `${first.book_name} ${first.chapter}${range}`;
  };

  const rememberPresentation = (verses: Verse[]) => {
    if (verses.length === 0) return;
    const entry: BibleReference = { id: `${Date.now()}-${verses[0].book}-${verses[0].chapter}-${verses[0].verse}`, label: referenceLabel(verses), verses, addedAt: Date.now() };
    setBibleHistory(previous => [entry, ...previous.filter(item => item.label !== entry.label)].slice(0, 100));
  };

  const presentVerses = (verses = currentSelectedVerses) => {
    if (verses.length === 0 || selectedDisplay === null) return;
    const first = verses[0];
    const firstIndex = allVerses.findIndex(verse => verse.book === first.book && verse.chapter === first.chapter && verse.verse === first.verse);
    const sequence = firstIndex >= 0 ? [allVerses[firstIndex]] : [first];
    pendingReferenceRef.current = { bookId: first.book, chapter: first.chapter, verseNumbers: [first.verse] };
    setSelectedBookId(first.book);
    setSelectedBookName(first.book_name);
    setSelectedChapter(first.chapter);
    setSelectedVerseNumbers([first.verse]);
    setMobileBiblePane('verses');
    setPresentedVerses(sequence);
    rememberPresentation(sequence);
    projectBible(sequence);
  };

  const stepPresentedVerse = (direction: -1 | 1) => {
    if (presentedVerses.length === 0) return;
    const firstVerse = presentedVerses[0];
    const firstIndex = allVerses.findIndex(verse => verse.book === firstVerse.book && verse.chapter === firstVerse.chapter && verse.verse === firstVerse.verse);
    const nextIndex = firstIndex + direction;
    if (nextIndex < 0 || nextIndex >= allVerses.length) return;
    const nextVerse = allVerses[nextIndex];
    const nextVerses = [nextVerse];
    pendingReferenceRef.current = { bookId: nextVerse.book, chapter: nextVerse.chapter, verseNumbers: [nextVerse.verse] };
    setSelectedBookId(nextVerse.book);
    setSelectedBookName(nextVerse.book_name);
    setSelectedChapter(nextVerse.chapter);
    setSelectedVerseNumbers([nextVerse.verse]);
    setMobileBiblePane('verses');
    setPresentedVerses(nextVerses);
    projectBible(nextVerses);
    rememberPresentation(nextVerses);
  };

  const searchBible = (event: React.FormEvent) => {
    event.preventDefault();
    const terms = [...new Set(bibleSearchWords(searchText.trim()))];
    if (terms.length === 0) {
      setSearchResults([]);
      setSearchMessage('Enter a word or phrase to search the Bible.');
      return;
    }
    const phrase = terms.join(' ');
    const result = allVerses.filter(verse => {
      if (searchTestament === 'old' && verse.book > 39) return false;
      if (searchTestament === 'new' && verse.book <= 39) return false;
      if (searchBookId !== 'all' && verse.book !== Number(searchBookId)) return false;
      const words = bibleSearchWords(verse.text);
      if (searchMode === 'exact') return words.join(' ').includes(phrase);
      const wordSet = new Set(words);
      return searchMode === 'all' ? terms.every(term => wordSet.has(term)) : terms.some(term => wordSet.has(term));
    });
    setSearchResults(result.slice(0, 200));
    setSearchMessage(result.length > 200 ? `${result.length} matches found. Showing the first 200; narrow your search to see fewer results.` : `${result.length} ${result.length === 1 ? 'verse' : 'verses'} found.`);
  };

  const bibleKeyboardActionsRef = useRef({ presentVerses, stepPresentedVerse });
  bibleKeyboardActionsRef.current = { presentVerses, stepPresentedVerse };
  const quickLookupActionsRef = useRef({ chooseQuickBook, chooseQuickChapter, chooseQuickVerse });
  quickLookupActionsRef.current = { chooseQuickBook, chooseQuickChapter, chooseQuickVerse };

  useEffect(() => {
    if (innerTab !== 'bible') return;
    return window.electronAPI?.onBibleProjectionNavigate?.(direction => {
      if (isProjecting) bibleKeyboardActionsRef.current.stepPresentedVerse(direction);
    });
  }, [innerTab, isProjecting]);

  // When the projection window is focused, it intercepts all keyboard input.
  // This listener receives forwarded keypresses from the projection window and
  // re-dispatches them on this window so the quick-lookup handler picks them up.
  useEffect(() => {
    if (innerTab !== 'bible') return;
    return window.electronAPI?.onBibleProjectionKey?.(key => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    });
  }, [innerTab]);

  useEffect(() => {
    if (innerTab !== 'bible') return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      const editing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
        event.preventDefault();
        setBibleTool('search');
        window.setTimeout(() => searchTextRef.current?.focus(), 0);
        return;
      }
      if (quickLookupOpen) {
        if (event.key === 'Escape') {
          event.preventDefault();
          setQuickLookupOpen(false);
          setQuickLookupStage('book');
          setQuickLookupQuery('');
          return;
        }
        if (event.key === 'Backspace') {
          event.preventDefault();
          if (quickLookupQuery) setQuickLookupQuery(query => query.slice(0, -1));
          else if (quickLookupStage === 'verse') setQuickLookupStage('chapter');
          else if (quickLookupStage === 'chapter') {
            setQuickLookupStage('book');
            setQuickLookupBook(null);
          }
          return;
        }
        if (event.key === 'Enter' || event.key === 'Tab') {
          event.preventDefault();
          if (quickLookupStage === 'chapter') {
            const chapter = Number(quickLookupQuery);
            if (chapters.includes(chapter)) quickLookupActionsRef.current.chooseQuickChapter(chapter);
          } else if (quickLookupStage === 'verse' && event.key === 'Enter') {
            const verse = Number(quickLookupQuery);
            if (chapterVerses.some(item => item.verse === verse)) quickLookupActionsRef.current.chooseQuickVerse(verse, true, true);
          } else if (quickLookupStage === 'book') {
            const query = normalizeBookQuery(quickLookupQuery);
            const exact = books.find(book => [book.name, bookAbbreviation[book.name] || '', ...(bookAliases[book.name] || [])].some(name => normalizeBookQuery(name) === query));
            if (exact) quickLookupActionsRef.current.chooseQuickBook(exact);
          }
          return;
        }
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();
          const candidates = quickLookupStage === 'book'
            ? quickBookMatches
            : quickLookupStage === 'chapter'
              ? quickLookupChapterCandidates
              : quickLookupVerseCandidates.map(verse => verse.verse);
          if (candidates.length > 0) {
            const current = quickLookupStage === 'book'
              ? quickBookMatches.findIndex(book => book.id === quickLookupBook?.id)
              : quickLookupStage === 'chapter'
                ? quickLookupChapterCandidates.indexOf(selectedChapter ?? -1)
                : quickLookupVerseCandidates.findIndex(verse => selectedVerseNumbers.includes(verse.verse));
            const next = (Math.max(0, current) + (event.key === 'ArrowDown' ? 1 : -1) + candidates.length) % candidates.length;
            if (quickLookupStage === 'book') quickLookupActionsRef.current.chooseQuickBook(quickBookMatches[next]);
            else if (quickLookupStage === 'chapter') {
              setSelectedChapter(quickLookupChapterCandidates[next]);
              setQuickLookupQuery(String(quickLookupChapterCandidates[next]));
            }
            else quickLookupActionsRef.current.chooseQuickVerse(quickLookupVerseCandidates[next]);
          }
          return;
        }
        if (event.key.length === 1 && /^[a-z0-9]$/i.test(event.key)) {
          event.preventDefault();
          if (quickLookupStage === 'book') {
            const query = quickLookupQuery + event.key;
            setQuickLookupQuery(query);
            const normalized = normalizeBookQuery(query);
            const exact = books.find(book => [book.name, bookAbbreviation[book.name] || '', ...(bookAliases[book.name] || [])].some(name => normalizeBookQuery(name) === normalized));
            if (exact) quickLookupActionsRef.current.chooseQuickBook(exact);
          } else if (/^\d$/.test(event.key)) {
            const query = quickLookupQuery + event.key;
            setQuickLookupQuery(query);
            if (quickLookupStage === 'chapter') {
              const normalizedQuery = query.replace(/^0+(?=\d)/, '');
              const exactChapter = chapters.find(chapter => chapter === Number(query));
              const hasLongerMatch = !query.startsWith('0') && chapters.some(chapter => {
                const chapterText = String(chapter);
                return chapterText.startsWith(normalizedQuery) && chapterText.length > normalizedQuery.length;
              });
              if (exactChapter !== undefined) {
                setSelectedChapter(exactChapter);
                if (query.startsWith('0') || !hasLongerMatch) quickLookupActionsRef.current.chooseQuickChapter(exactChapter);
              }
            } else {
              const normalizedQuery = query.replace(/^0+(?=\d)/, '');
              const exactVerse = chapterVerses.find(verse => verse.verse === Number(query));
              const hasLongerMatch = !query.startsWith('0') && chapterVerses.some(verse => {
                const verseText = String(verse.verse);
                return verseText.startsWith(normalizedQuery) && verseText.length > normalizedQuery.length;
              });
              if (exactVerse) {
                quickLookupActionsRef.current.chooseQuickVerse(exactVerse.verse, query.startsWith('0') || !hasLongerMatch);
              } else {
                const paddedVerse = query.startsWith('0')
                  ? chapterVerses.find(verse => verse.verse === Number(normalizedQuery))
                  : undefined;
                if (paddedVerse) quickLookupActionsRef.current.chooseQuickVerse(paddedVerse.verse);
                else if (!hasLongerMatch) {
                  const normalizedVerse = chapterVerses.find(verse => String(verse.verse) === normalizedQuery);
                  if (normalizedVerse) quickLookupActionsRef.current.chooseQuickVerse(normalizedVerse.verse);
                }
              }
            }
          }
        }
        return;
      }
      // Alphanumeric keys always open the quick lookup modal, even when focus is on a UI element.
      // This ensures navigation with arrow keys (which may move focus to buttons) doesn't break typing.
      if (!event.ctrlKey && !event.metaKey && !event.altKey && event.key.length === 1 && /^[a-z0-9]$/i.test(event.key)) {
        event.preventDefault();
        setBibleTool('browse');
        setQuickLookupOpen(true);
        setQuickLookupStage('book');
        setQuickLookupBook(null);
        setQuickLookupQuery(event.key);
        const normalized = normalizeBookQuery(event.key);
        const exact = books.find(book => [book.name, bookAbbreviation[book.name] || '', ...(bookAliases[book.name] || [])].some(name => normalizeBookQuery(name) === normalized));
        if (exact) chooseQuickBook(exact);
        return;
      }
      if (editing) return;

      if (event.key === 'Escape' && isProjecting) {
        setPresentedVerses([]);
        onCloseProjection();
        return;
      }
      if (event.key === 'Enter' || event.key === 'F5') {
        if (currentSelectedVerses.length > 0) {
          event.preventDefault();
          bibleKeyboardActionsRef.current.presentVerses();
        }
        return;
      }
      if (isProjecting && ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(event.key)) {
        event.preventDefault();
        bibleKeyboardActionsRef.current.stepPresentedVerse(event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1);
        return;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [books, chapterVerses, chapters, currentSelectedVerses, innerTab, isProjecting, onCloseProjection, presentedVerses, quickBookMatches, quickLookupBook?.id, quickLookupChapterCandidates, quickLookupOpen, quickLookupQuery, quickLookupStage, quickLookupVerseCandidates, selectedChapter, selectedVerseNumbers]);

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
      {innerTab === 'songs' && (
        <div className="flex min-h-10 items-center justify-between gap-2 border-b border-gray-700 bg-gray-800 px-2 py-1">
          <button type="button" onClick={() => setInnerTab('bible')} className="inline-flex min-h-8 items-center gap-1.5 rounded px-3 text-xs font-bold text-gray-200 hover:bg-gray-700"><BookOpen size={14} /> Bible</button>
          <span className="text-xs font-semibold text-gray-400">Songs</span>
        </div>
      )}

      {/* Bible Tab Content */}
      {innerTab === 'bible' && (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <nav className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-gray-700 bg-gray-900 px-2 py-1" aria-label="Bible tools">
            {([
              ['browse', BookOpen, 'Bible'],
              ['search', Search, 'Search'],
              ['history', History, `History${bibleHistory.length ? ` · ${bibleHistory.length}` : ''}`],
            ] as const).map(([tool, Icon, label]) => (
              <button key={tool} type="button" onClick={() => setBibleTool(tool)} aria-pressed={bibleTool === tool} className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded px-2.5 text-xs font-bold transition-colors ${bibleTool === tool ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                <Icon size={14} /> {label}
              </button>
            ))}
            <button type="button" onClick={() => setInnerTab('songs')} className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded px-2.5 text-xs font-bold text-gray-400 hover:bg-gray-800 hover:text-white"><Music size={14} /> Songs</button>
            <button type="button" onClick={() => setShowBibleSettings(true)} title="Bible projection settings" aria-label="Bible projection settings" className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded bg-gray-800 text-gray-300 hover:bg-gray-700"><Settings2 size={14} /></button>
            <span className="ml-auto hidden items-center gap-1 whitespace-nowrap px-2 text-[10px] text-gray-500 xl:inline-flex"><Keyboard size={12} /> Type to jump</span>
            <select value={availableDisplays.some(display => display.id === selectedDisplay) ? selectedDisplay ?? '' : ''} onChange={event => onDisplayChange(Number(event.target.value))} aria-label="Projection display" className="min-h-8 max-w-36 shrink-0 rounded border border-gray-700 bg-gray-900 px-2 text-[10px] font-bold text-gray-200">
              <option value="" disabled>{availableDisplays.length ? 'Choose screen' : window.electronAPI?.getDisplays ? 'No displays found' : 'Desktop app required'}</option>
              {availableDisplays.map(display => <option key={display.id} value={display.id}>{display.label}</option>)}
            </select>
            <button type="button" onClick={onRefreshDisplays} disabled={!window.electronAPI?.getDisplays} title="Refresh display list" aria-label="Refresh display list" className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-40"><RefreshCw size={13} /></button>
            {testDisplay && <button type="button" onClick={testDisplay} disabled={selectedDisplay === null || !window.electronAPI?.testDisplay} title="Test selected display" aria-label="Test selected display" className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-40"><Play size={13} /></button>}
            <span className="shrink-0 px-1 text-[10px] font-bold text-gray-400">KJV</span>
          </nav>

          {quickLookupOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" onMouseDown={event => { if (event.target === event.currentTarget) { setQuickLookupOpen(false); setQuickLookupStage('book'); setQuickLookupQuery(''); } }}>
              <section role="dialog" aria-modal="true" aria-label="Quick Bible passage lookup" className="relative w-full max-w-2xl overflow-hidden border border-slate-600 bg-slate-950 text-center text-slate-100 shadow-2xl shadow-black/60">
                <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-5 py-3">
                  <div className="flex items-center gap-2 text-left">
                    <BookOpen size={16} className="text-cyan-300" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Quick Bible lookup</span>
                  </div>
                  <button type="button" onClick={() => { setQuickLookupOpen(false); setQuickLookupStage('book'); setQuickLookupQuery(''); }} className="text-xs text-slate-400 hover:text-white">Esc to cancel</button>
                </header>
                <div className="grid grid-cols-3 divide-x divide-slate-800">
                  <section aria-label="Book selection" className={`min-w-0 px-3 py-5 sm:px-5 ${quickLookupStage === 'book' ? 'bg-slate-800/70' : ''}`}>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Book</p>
                    <h2 className={`min-h-8 break-words text-xl font-semibold sm:text-2xl ${quickLookupStage === 'book' ? 'text-cyan-200' : 'text-white'}`}>{quickLookupBook?.name || (quickLookupStage === 'book' ? quickLookupQuery : '')}</h2>
                    {quickLookupStage === 'book' && (
                      quickBookMatches.length > 0
                        ? <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                            {quickBookMatches.map(book => <button key={book.id} type="button" onClick={() => chooseQuickBook(book)} className={`rounded border px-2 py-1 text-[11px] transition-colors ${quickLookupBook?.id === book.id ? 'border-cyan-400 bg-cyan-400/15 text-cyan-100' : 'border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-800'}`}>{book.name}{bookAbbreviation[book.name] ? ` (${bookAbbreviation[book.name]})` : ''}</button>)}
                          </div>
                        : quickLookupQuery && <p className="mt-3 text-xs text-rose-300">No books found</p>
                    )}
                  </section>
                  <section aria-label="Chapter selection" className={`min-w-0 px-3 py-5 sm:px-5 ${quickLookupStage === 'chapter' ? 'bg-slate-800/70' : ''}`}>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Chapter</p>
                    <h2 className={`min-h-8 text-xl font-semibold sm:text-2xl ${quickLookupStage === 'chapter' ? 'text-cyan-200' : 'text-white'}`}>{quickLookupStage === 'chapter' ? quickLookupQuery : selectedChapter || ''}</h2>
                    {quickLookupBook && <p className="mt-1 text-xs text-slate-400">Chapters: {chapters.length}</p>}
                    {quickLookupStage === 'chapter' && quickLookupQuery && quickLookupChapterCandidates.length > 0 && <div className="mt-3 flex flex-wrap justify-center gap-1">{quickLookupChapterCandidates.slice(0, 20).map(chapter => <button key={chapter} type="button" onClick={() => chooseQuickChapter(chapter)} className={`min-w-7 rounded px-1.5 py-1 text-xs ${selectedChapter === chapter ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:bg-slate-700'}`}>{chapter}</button>)}</div>}
                    {quickLookupStage === 'chapter' && quickLookupQuery && quickLookupChapterCandidates.length === 0 && <p className="mt-3 text-xs text-rose-300">No chapters found</p>}
                  </section>
                  <section aria-label="Verse selection" className={`min-w-0 px-3 py-5 sm:px-5 ${quickLookupStage === 'verse' ? 'bg-slate-800/70' : ''}`}>
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Verse</p>
                    <h2 className={`min-h-8 text-xl font-semibold sm:text-2xl ${quickLookupStage === 'verse' ? 'text-cyan-200' : 'text-white'}`}>{quickLookupStage === 'verse' ? quickLookupQuery : ''}</h2>
                    {selectedChapter && <p className="mt-1 text-xs text-slate-400">Verses: {chapterVerses.length}</p>}
                    {quickLookupStage === 'verse' && quickLookupQuery && quickLookupVerseCandidates.length > 0 && <div className="mt-3 flex flex-wrap justify-center gap-1">{quickLookupVerseCandidates.slice(0, 20).map(verse => <button key={verse.verse} type="button" onClick={() => quickLookupActionsRef.current.chooseQuickVerse(verse.verse)} className={`min-w-7 rounded px-1.5 py-1 text-xs ${selectedVerseNumbers.includes(verse.verse) ? 'bg-cyan-500 text-slate-950' : 'text-slate-300 hover:bg-slate-700'}`}>{verse.verse}</button>)}</div>}
                    {quickLookupStage === 'verse' && quickLookupQuery && quickLookupVerseCandidates.length === 0 && !quickLookupQuery.startsWith('0') && <p className="mt-3 text-xs text-rose-300">No verses found</p>}
                  </section>
                </div>
                <footer className="flex items-center justify-between border-t border-slate-800 bg-slate-900/80 px-5 py-3 text-[10px] text-slate-500">
                  <span>{quickLookupStage === 'book' ? 'Type book name or abbreviation' : quickLookupStage === 'chapter' ? 'Enter or Tab to choose chapter' : 'Enter to show selected verse'}</span>
                  <span className="font-mono text-slate-400">↑ ↓ Select · Enter Continue</span>
                </footer>
              </section>
            </div>
          )}

          {showBibleSettings && (
            <div className="fixed inset-0 z-[70] bg-black/55 backdrop-blur-[2px]" onMouseDown={event => { if (event.target === event.currentTarget) setShowBibleSettings(false); }}>
              <ProjectionSettingsPanel settings={projectionSettings} onChange={updateProjectionSettings} onClose={() => setShowBibleSettings(false)} />
            </div>
          )}

          {bibleTool === 'search' ? (
            <section className="flex min-h-0 flex-1 flex-col overflow-hidden" aria-label="Search Bible text">
              <form onSubmit={searchBible} className="grid shrink-0 gap-2 border-b border-gray-700 bg-gray-800/50 p-3 sm:grid-cols-[minmax(12rem,1fr)_auto_auto_auto]">
                <input ref={searchTextRef} type="search" value={searchText} onChange={event => setSearchText(event.target.value)} placeholder="Search words or an exact phrase" aria-label="Search Bible text" className="min-h-11 rounded-lg border border-gray-700 bg-gray-900 px-3 text-sm text-white outline-none focus:border-blue-500" />
                <select value={searchMode} onChange={event => setSearchMode(event.target.value as 'exact' | 'all' | 'any')} aria-label="Search matching mode" className="min-h-11 rounded-lg border border-gray-700 bg-gray-900 px-3 text-xs font-semibold text-white">
                  <option value="exact">Exact phrase</option><option value="all">All words</option><option value="any">Any word</option>
                </select>
                <select value={searchTestament} onChange={event => setSearchTestament(event.target.value as 'all' | 'old' | 'new')} aria-label="Filter testament" className="min-h-11 rounded-lg border border-gray-700 bg-gray-900 px-3 text-xs font-semibold text-white">
                  <option value="all">Whole Bible</option><option value="old">Old Testament</option><option value="new">New Testament</option>
                </select>
                <select value={searchBookId} onChange={event => setSearchBookId(event.target.value)} aria-label="Filter book" className="min-h-11 rounded-lg border border-gray-700 bg-gray-900 px-3 text-xs font-semibold text-white">
                  <option value="all">All books</option>{books.map(book => <option key={book.id} value={book.id}>{book.name}</option>)}
                </select>
                <button type="submit" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-500 sm:col-span-4 sm:justify-self-end"><Search size={15} /> Search verses</button>
              </form>
              {searchMessage && <p role="status" className="shrink-0 border-b border-gray-700 px-3 py-2 text-xs text-gray-400">{searchMessage}</p>}
              <div className="min-h-0 flex-1 divide-y divide-gray-800 overflow-y-auto">
                {searchResults.map(verse => (
                  <button key={`${verse.book}-${verse.chapter}-${verse.verse}`} type="button" onClick={() => navigateToVerses([verse])} onDoubleClick={() => { navigateToVerses([verse]); presentVerses([verse]); }} className="w-full px-4 py-3 text-left hover:bg-gray-800/70">
                    <span className="mr-2 text-xs font-black text-blue-400">{verse.book_name} {verse.chapter}:{verse.verse}</span><span className="font-serif text-sm leading-relaxed text-gray-200">{verse.text}</span>
                  </button>
                ))}
                {searchResults.length === 0 && <p className="p-6 text-center text-sm text-gray-500">Search across the KJV Bible. Double-click a result to show it.</p>}
              </div>
            </section>
          ) : bibleTool === 'history' ? (
            <section className="min-h-0 flex-1 overflow-y-auto p-3" aria-label="Bible presentation history">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-white">Presented this session</h2>
                {bibleHistory.length > 0 && <button type="button" onClick={() => setBibleHistory([])} className="rounded px-2 py-1 text-xs font-semibold text-gray-400 hover:bg-gray-800">Clear all</button>}
              </div>
              <div className="space-y-1.5">
                {bibleHistory.map(reference => (
                  <div key={reference.id} className="flex items-center gap-2 rounded-lg border border-gray-700 bg-gray-800/60 p-2">
                    <button type="button" onClick={() => navigateToVerses(reference.verses)} onDoubleClick={() => { navigateToVerses(reference.verses); presentVerses(reference.verses); }} className="min-h-11 min-w-0 flex-1 px-2 text-left">
                      <span className="block text-sm font-bold text-white">{reference.label}</span>
                      <span className="mt-0.5 block truncate text-xs text-gray-400">{reference.verses.map(verse => verse.text).join(' ')}</span>
                    </button>
                    <button type="button" onClick={() => presentVerses(reference.verses)} title={`Show ${reference.label}`} aria-label={`Show ${reference.label}`} className="rounded-lg bg-green-700 p-2.5 text-white hover:bg-green-600"><Play size={15} /></button>
                  </div>
                ))}
              </div>
              {bibleHistory.length === 0 && <p className="rounded-lg border border-dashed border-gray-700 px-4 py-8 text-center text-sm text-gray-500">Presented Bible passages will appear here for this session.</p>}
            </section>
          ) : (
          <>
              <div className={`hidden min-h-0 flex-1 grid-cols-[minmax(190px,0.22fr)_minmax(0,0.78fr)] grid-rows-[minmax(0,1.2fr)_minmax(0,0.8fr)] overflow-hidden ${bibleTool === 'browse' ? 'md:grid' : 'md:hidden'}`}>
                <section className="col-start-1 row-span-2 flex min-h-0 flex-col border-r border-gray-700 bg-gray-900/80" aria-label="Selected chapter verses">
                  <div className="flex items-center justify-between gap-2 border-b border-gray-800 px-2 py-2">
                    <h3 className="truncate text-sm font-bold text-white">{selectedBookName} {selectedChapter}</h3>
                    <span className="shrink-0 text-xs text-gray-400">{chapterVerses.length}</span>
                  </div>
                  <div ref={verseReaderRef} className="min-h-0 flex-1 overflow-y-auto divide-y divide-gray-800 custom-scrollbar">
                    {chapterVerses.map(verse => {
                      const selected = selectedVerseNumbers.includes(verse.verse);
                      const onScreen = isProjecting && presentedVerses.some(item => item.book === verse.book && item.chapter === verse.chapter && item.verse === verse.verse);
                      return <button key={verse.verse} type="button" data-projected-verse={onScreen ? 'true' : undefined} onClick={() => toggleVerseSelection(verse.verse)} onDoubleClick={() => presentVerses([verse])} aria-pressed={selected} className={`w-full px-3 py-2.5 text-left text-sm leading-relaxed ${onScreen ? 'bg-emerald-800/70 text-white ring-1 ring-inset ring-emerald-400' : selected ? 'bg-blue-950/60 text-white' : 'text-gray-300 hover:bg-gray-800'}`}><span className={`mr-1.5 font-black ${onScreen ? 'text-emerald-200' : 'text-blue-400'}`}>{verse.verse}</span>{verse.text}</button>;
                    })}
                  </div>
                </section>

                <section className="col-start-2 row-start-1 flex min-h-0 flex-col overflow-hidden border-b border-gray-700 bg-gray-900/70" aria-label="Bible books">
                  <div className="flex min-h-8 items-center gap-2 border-b border-gray-800 px-2">
                    <h3 className="shrink-0 text-xs font-black uppercase tracking-widest text-gray-300">Books</h3>
                    <input type="search" value={bookFilter} onChange={event => setBookFilter(event.target.value)} aria-label="Filter Bible books" placeholder="Filter books" className="min-h-7 min-w-0 flex-1 border-0 bg-transparent px-1 text-sm text-white outline-none placeholder:text-gray-400 focus:ring-0" />
                  </div>
                  <div className="min-h-0 flex-1 overflow-hidden p-1.5">
                    <div className="grid h-full grid-cols-11 grid-rows-6 gap-px">
                      {books.filter(book => book.name.toLowerCase().includes(bookFilter.trim().toLowerCase())).map(book => {
                        const selected = selectedBookId === book.id;
                        const color = bookSectionColor.get(book.name) || 'bg-gray-700';
                        return (
                          <button key={book.id} type="button" onClick={() => { setSelectedBookId(book.id); setSelectedBookName(book.name); }} aria-pressed={selected} title={book.name} className={`flex h-full min-h-0 min-w-0 flex-col items-center justify-center overflow-hidden border border-white/10 px-0.5 text-center text-white transition-colors ${color} ${selected ? 'z-10 ring-2 ring-white' : 'opacity-85 hover:opacity-100'}`}>
                            <span className="text-base font-semibold leading-none">{bookAbbreviation[book.name] || book.name.slice(0, 3)}</span>
                            <span className="mt-1 w-full truncate text-[10px] leading-none">{book.name}</span>
                          </button>
                        );
                      })}
                    </div>
                    {books.filter(book => book.name.toLowerCase().includes(bookFilter.trim().toLowerCase())).length === 0 && <p className="p-4 text-center text-xs text-gray-500">No books match that filter.</p>}
                  </div>
                </section>

                <div className="col-start-2 row-start-2 grid min-h-0 grid-cols-2 overflow-hidden">
                <section className="flex min-h-0 flex-col overflow-hidden border-r border-gray-700 bg-gray-900/60" aria-label="Bible chapters">
                  <h3 className="border-b border-gray-800 px-2 py-2 text-xs font-black uppercase tracking-widest text-gray-300">Chapters · {chapters.length}</h3>
                  <div className="min-h-0 flex-1 overflow-hidden p-2">
                    <div className="grid h-full gap-1" style={{ gridTemplateColumns: `repeat(${numberGridColumns(chapters.length)}, minmax(0, 1fr))`, gridAutoRows: 'minmax(0, 1fr)' }}>
                      {chapters.map(chapter => <button key={chapter} type="button" onClick={() => setSelectedChapter(chapter)} aria-pressed={selectedChapter === chapter} className={`h-full min-h-0 rounded text-sm font-bold ${selectedChapter === chapter ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-200 hover:bg-gray-700'}`}>{chapter}</button>)}
                    </div>
                  </div>
                </section>

                <section className="flex min-h-0 flex-col overflow-hidden bg-gray-900" aria-label="Bible verse numbers">
                  <div className="flex items-center justify-between gap-2 border-b border-gray-800 px-2 py-2">
                    <h3 className="truncate text-xs font-black uppercase tracking-widest text-gray-300">Verses · {chapterVerses.length}</h3>
                  </div>
                  <div className="min-h-0 flex-1 overflow-hidden p-2">
                    <div className="grid h-full gap-1" style={{ gridTemplateColumns: `repeat(${numberGridColumns(chapterVerses.length)}, minmax(0, 1fr))`, gridAutoRows: 'minmax(0, 1fr)' }}>
                      {chapterVerses.map(verse => {
                        const selected = selectedVerseNumbers.includes(verse.verse);
                        const onScreen = isProjecting && presentedVerses.some(item => item.book === verse.book && item.chapter === verse.chapter && item.verse === verse.verse);
                        return <button key={verse.verse} type="button" data-projected-verse={onScreen ? 'true' : undefined} onClick={() => toggleVerseSelection(verse.verse)} onDoubleClick={() => presentVerses([verse])} aria-pressed={selected} aria-label={`Verse ${verse.verse}`} className={`h-full min-h-0 rounded text-sm font-bold ${onScreen ? 'bg-emerald-700 text-white ring-1 ring-emerald-300' : selected ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-200 hover:bg-gray-700'}`}>{verse.verse}</button>;
                      })}
                    </div>
                  </div>
                </section>
                </div>
              </div>

          <nav className={`grid grid-cols-3 gap-1 border-b border-gray-700 bg-gray-900 p-2 md:hidden ${bibleTool === 'browse' ? '' : 'hidden'}`} aria-label="Bible navigation">
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

          {/* Mobile Bible browser */}
          <div className="grid grid-cols-1 md:hidden flex-1 min-h-0 overflow-hidden">
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
          </>
          )}

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
                  <button type="button" onClick={() => { setPresentedVerses([]); onCloseProjection(); }} className="inline-flex items-center gap-2 bg-red-700 px-5 py-3 font-bold text-white hover:bg-red-600 rounded-xl"><Square size={16} /> Stop Projection</button>
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
