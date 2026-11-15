import { useEffect, useState } from 'react';
import type { Verse } from './components/BibleSongsTab';
import { ProjectionSurface } from './components/ProjectionSurface';
import { useProjectionSettings } from './components/projectionSettings';

interface ProjectionData {
  verses: Verse[];
  theme: string;
  referenceOnly?: boolean;
  description?: string;
}

interface SongProjectionData {
  title: string;
  body: string;
  theme: string;
}

// Define book categories for periodic table layout
const bookCategories = {
  'Torah': ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy'],
  'History': ['Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah', 'Esther'],
  'Poetry': ['Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon'],
  'Major Prophets': ['Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel'],
  'Minor Prophets': ['Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'],
  'Gospels': ['Matthew', 'Mark', 'Luke', 'John'],
  'History (NT)': ['Acts'],
  'Pauline Epistles': ['Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon'],
  'General Epistles': ['Hebrews', 'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude'],
  'Apocalypse': ['Revelation']
};

const categoryColors = {
  'Torah': 'bg-blue-600',
  'History': 'bg-green-600',
  'Poetry': 'bg-purple-600',
  'Major Prophets': 'bg-red-600',
  'Minor Prophets': 'bg-orange-600',
  'Gospels': 'bg-yellow-600',
  'History (NT)': 'bg-teal-600',
  'Pauline Epistles': 'bg-indigo-600',
  'General Epistles': 'bg-pink-600',
  'Apocalypse': 'bg-gray-600'
};

export default function BibleProjection() {
  const [data, setData] = useState<ProjectionData | null>(null);
  const [song, setSong] = useState<SongProjectionData | null>(null);
  const [projectionType, setProjectionType] = useState(() => localStorage.getItem('activeProjection') || 'bible');
  const [settings] = useProjectionSettings();

  useEffect(() => {
    const loadProjection = (stored: string | null) => {
      if (!stored) return;
      try {
        setData(JSON.parse(stored));
      } catch {
        console.error('invalid projection data');
      }
    };
    loadProjection(localStorage.getItem('bibleProjectionData'));
    const loadSong = (stored: string | null) => {
      if (!stored) return;
      try {
        setSong(JSON.parse(stored));
      } catch {
        console.error('invalid song projection data');
      }
    };
    loadSong(localStorage.getItem('songProjectionData'));
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'bibleProjectionData') loadProjection(event.newValue);
      if (event.key === 'songProjectionData') loadSong(event.newValue);
      if (event.key === 'activeProjection' && event.newValue) setProjectionType(event.newValue);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        window.electronAPI?.closeBibleProjection();
        return;
      }
      if (projectionType === 'bible' && ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key)) {
        e.preventDefault();
        window.electronAPI?.navigateBibleProjection?.(e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1);
        return;
      }
      // Forward alphanumeric keys and Backspace to the control window so the
      // quick-lookup modal can be opened/operated while the projection is active.
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        if ((e.key.length === 1 && /^[a-z0-9]$/i.test(e.key)) || e.key === 'Backspace' || e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault();
          window.electronAPI?.typeBibleProjectionKey?.(e.key);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [projectionType]);

  if (!data) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: settings.bgColor, color: settings.textColor }}>
        <p>Loading Bible...</p>
      </div>
    );
  }

  if (projectionType === 'songs' && song) {
    return <ProjectionSurface settings={settings} songTitle={song.title} songBody={song.body} className="fixed inset-0" />;
  }

  if (data.verses.length > 0) {
    return (
      <div className="fixed inset-0">
        {data.description && <div className="absolute left-0 right-0 top-[5%] z-10 text-center text-[3cqh] font-semibold" style={{ color: settings.textColor }}>{data.description}</div>}
        <ProjectionSurface settings={settings} verses={data.verses} referenceOnly={data.referenceOnly} className="h-full w-full" />
      </div>
    );
  }

  // Show periodic table of books
  return (
    <div
      className="fixed inset-0 p-4 overflow-auto"
      style={{ backgroundColor: settings.bgColor, color: settings.textColor }}
    >
      <h1 className="text-3xl font-bold text-center mb-8">The Holy Bible</h1>
      <div className="grid grid-cols-1 gap-6">
        {Object.entries(bookCategories).map(([category, books]) => (
          <div key={category} className="space-y-4">
            <h2 className="text-xl font-bold text-center">{category}</h2>
            <div className="grid grid-cols-5 gap-4 justify-items-center">
              {books.map(book => (
                <div
                  key={book}
                  className={`${categoryColors[category as keyof typeof categoryColors]} text-white p-4 rounded-lg shadow-lg text-center min-h-[80px] flex flex-col justify-center`}
                  style={{ minWidth: '120px' }}
                >
                  <div className="font-bold text-lg">{book}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
