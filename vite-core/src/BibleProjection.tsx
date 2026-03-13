import { useEffect, useState } from 'react';
import { Verse } from './components/BibleTab';

interface ProjectionData {
  verses: Verse[];
  theme: string;
}

const themes: { [key: string]: { backgroundColor: string; textColor: string } } = {
  light: { backgroundColor: '#ffffff', textColor: '#000000' },
  dark: { backgroundColor: '#000000', textColor: '#ffffff' },
  blue: { backgroundColor: '#1e3a8a', textColor: '#ffffff' },
};

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

  useEffect(() => {
    const stored = localStorage.getItem('bibleProjectionData');
    if (stored) {
      try {
        setData(JSON.parse(stored));
      } catch (e) {
        console.error('invalid projection data');
      }
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        window.electronAPI?.closeBibleProjection();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const theme = themes[data?.theme || 'dark'] || themes.dark;

  if (!data) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: theme.backgroundColor, color: theme.textColor }}>
        <p>Loading Bible...</p>
      </div>
    );
  }

  if (data.verses.length > 0) {
    // Show selected verses
    const fontSize = Math.max(2, 6 - data.verses.length * 0.2);

    return (
      <div
        className="fixed inset-0 flex flex-col items-center justify-center p-4"
        style={{ backgroundColor: theme.backgroundColor, color: theme.textColor }}
      >
        {data.verses[0] && (
          <h2 className="mb-4 text-xl font-semibold">
            {data.verses[0].book_name} {data.verses[0].chapter}
          </h2>
        )}
        {data.verses.map(v => (
          <p key={v.verse} style={{ fontSize: `${fontSize}rem`, textAlign: 'center', maxWidth: '90%' }}>
            <sup className="align-top">{v.verse}</sup> {v.text}
          </p>
        ))}
      </div>
    );
  }

  // Show periodic table of books
  return (
    <div
      className="fixed inset-0 p-4 overflow-auto"
      style={{ backgroundColor: theme.backgroundColor, color: theme.textColor }}
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
