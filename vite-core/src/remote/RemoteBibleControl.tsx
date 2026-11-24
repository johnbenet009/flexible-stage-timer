import { useEffect, useRef, useState } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, Eye, EyeOff, Home, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useRemoteState } from './useRemoteState';
import { ConnectionBadge, PinGate } from './RemoteShell';

type Verse = { book: number; book_name: string; chapter: number; verse: number; text: string };

export default function RemoteBibleControl() {
	const conn = useRemoteState();
	const remoteBible = conn.state.bible;
	const [allVerses, setAllVerses] = useState<Verse[]>([]);
	const [bookId, setBookId] = useState<number | null>(null);
	const [chapter, setChapter] = useState<number | null>(null);
	const [verse, setVerse] = useState<number | null>(null);
	const [searchText, setSearchText] = useState('');
	const [bookQuery, setBookQuery] = useState('');
	const [chapterQuery, setChapterQuery] = useState('');
	const [verseQuery, setVerseQuery] = useState('');
	const hasLocalSelection = useRef(false);
	const derivedBooks = [...new Map(allVerses.map(item => [item.book, { id: item.book, name: item.book_name }])).values()];
	const books = remoteBible?.books?.length ? remoteBible.books : derivedBooks;
	const chapters = [...new Set(allVerses.filter(item => item.book === bookId).map(item => item.chapter))].sort((a, b) => a - b);
	const verses = allVerses.filter(item => item.book === bookId && item.chapter === chapter);
	const currentVerse = verses.find(item => item.verse === verse);
	const searchResults = searchText.trim().length >= 2
		? allVerses.filter(item => item.text.toLowerCase().includes(searchText.trim().toLowerCase()) || `${item.book_name} ${item.chapter}:${item.verse}`.toLowerCase().includes(searchText.trim().toLowerCase())).slice(0, 8)
		: [];
	const currentIndex = allVerses.findIndex(item => item.book === bookId && item.chapter === chapter && item.verse === verse);
	const previousVerse = currentIndex > 0 ? allVerses[currentIndex - 1] : undefined;
	const nextVerse = currentIndex >= 0 ? allVerses[currentIndex + 1] : undefined;
	const nextChapterVerse = allVerses.find(item => item.book === bookId && item.chapter === (chapter ?? 0) + 1 && item.verse === 1);

	useEffect(() => {
		let active = true;
		void fetch('/kjv.json').then(response => response.ok ? response.json() : []).then((data: Verse[] | { verses?: Verse[] }) => {
			if (active) setAllVerses(Array.isArray(data) ? data : data.verses || []);
		}).catch(() => undefined);
		return () => { active = false; };
	}, []);

	useEffect(() => {
		if (!hasLocalSelection.current && remoteBible?.bookId != null) {
			setBookId(remoteBible.bookId);
			setChapter(remoteBible.chapter ?? null);
			setVerse(remoteBible.verse ?? null);
		}
	}, [remoteBible]);

	const sendSelection = (item: Verse) => {
		hasLocalSelection.current = true;
		setBookId(item.book);
		setChapter(item.chapter);
		setVerse(item.verse);
		setBookQuery(item.book_name);
		setChapterQuery(String(item.chapter));
		setVerseQuery(String(item.verse));
		conn.sendCommand('bible', 'select', { bookId: item.book, chapter: item.chapter, verse: item.verse, verseData: item });
	};

	const showVerse = (item: Verse | undefined) => {
		if (!item) return;
		hasLocalSelection.current = true;
		setBookId(item.book);
		setChapter(item.chapter);
		setVerse(item.verse);
		setBookQuery(item.book_name);
		setChapterQuery(String(item.chapter));
		setVerseQuery(String(item.verse));
		conn.sendCommand('bible', 'show', { bookId: item.book, chapter: item.chapter, verse: item.verse, verseData: item });
	};

	const navigateToVerse = (item: Verse | undefined) => {
		if (item) sendSelection(item);
	};

	const chooseBook = (nextBook: number) => {
		const first = allVerses.find(item => item.book === nextBook);
		if (first) sendSelection(first);
	};

	const chooseChapter = (nextChapter: number) => {
		const first = allVerses.find(item => item.book === bookId && item.chapter === nextChapter);
		if (first) sendSelection(first);
	};

	return (
		<PinGate conn={conn}>
			<div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-slate-950 text-white">
				<header className="z-20 flex shrink-0 items-center gap-2 border-b border-slate-800 bg-slate-950 px-2 py-2 sm:gap-3 sm:px-5">
					<Link to="/remote" className="rounded p-2 text-slate-300 hover:bg-slate-800" title="Remote home"><Home className="h-4 w-4" /></Link>
					<BookOpen className="h-5 w-5 text-amber-300" />
					<h1 className="flex-1 text-sm font-bold sm:text-base">Bible Control</h1>
					<ConnectionBadge connected={conn.connected} />
				</header>
				<main className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col gap-3 overflow-y-auto p-3 sm:p-5 lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
					<section className="order-1 min-w-0 border-b border-slate-800 pb-3 lg:order-2 lg:border-b-0 lg:border-l lg:pl-5">
						<div className="flex items-center justify-between gap-3">
							<h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Passage preview</h2>
							<span className={`text-[11px] font-semibold ${remoteBible?.isShowing ? 'text-emerald-300' : 'text-slate-500'}`}>{remoteBible?.isShowing ? 'On screen' : 'Hidden'}</span>
						</div>
						<p className="mt-1 text-base font-bold text-amber-200">{currentVerse ? `${currentVerse.book_name} ${currentVerse.chapter}:${currentVerse.verse}` : 'Select a verse'}</p>
						<p className="mt-1 max-h-28 overflow-y-auto text-sm leading-relaxed text-slate-100">{currentVerse?.text || 'Passage text will appear here.'}</p>
						{remoteBible?.presented && <p className="mt-1 truncate text-[11px] text-slate-500">Projected: {remoteBible.presented}</p>}
					</section>
					<section className="order-2 min-w-0 space-y-3 pb-3 lg:order-1">
						<label className="relative block">
							<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
							<input type="search" value={searchText} onChange={event => setSearchText(event.target.value)} placeholder="Search Bible text or reference" className="min-h-12 w-full rounded border border-slate-700 bg-slate-900 pl-9 pr-3 text-base text-white placeholder:text-slate-500 focus:border-amber-500 focus:outline-none" />
						</label>
						{searchText.trim().length >= 2 && <div className="max-h-36 divide-y divide-slate-800 overflow-y-auto rounded border border-slate-800 bg-slate-900">
							{searchResults.map(item => <button key={`${item.book}-${item.chapter}-${item.verse}`} type="button" onClick={() => { sendSelection(item); setSearchText(''); }} className="block w-full px-3 py-2 text-left hover:bg-slate-800"><span className="block text-xs font-bold text-amber-200">{item.book_name} {item.chapter}:{item.verse}</span><span className="line-clamp-2 text-xs text-slate-300">{item.text}</span></button>)}
							{searchResults.length === 0 && <p className="px-3 py-2 text-xs text-slate-500">No matching verses.</p>}
						</div>}
						<div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
							<label className="col-span-2 text-xs font-semibold text-slate-400 sm:col-span-1">Book
								<input list="bible-books" value={bookQuery || (books.find(item => item.id === bookId)?.name ?? '')} onChange={event => { setBookQuery(event.target.value); const match = books.find(item => item.name.toLowerCase() === event.target.value.trim().toLowerCase()); if (match) chooseBook(match.id); }} placeholder="Search books" className="mt-1 min-h-12 w-full rounded border border-slate-700 bg-slate-900 px-3 text-base text-white" />
								<datalist id="bible-books">{books.map(book => <option key={book.id} value={book.name} />)}</datalist>
							</label>
							<label className="text-xs font-semibold text-slate-400">Chapter
								<input list="bible-chapters" inputMode="numeric" value={chapterQuery || (chapter == null ? '' : String(chapter))} onChange={event => { setChapterQuery(event.target.value); if (chapters.includes(Number(event.target.value))) chooseChapter(Number(event.target.value)); }} placeholder="Search chapters" className="mt-1 min-h-12 w-full rounded border border-slate-700 bg-slate-900 px-3 text-base text-white" />
								<datalist id="bible-chapters">{chapters.map(number => <option key={number} value={number} />)}</datalist>
							</label>
							<label className="text-xs font-semibold text-slate-400">Verse
								<input list="bible-verses" inputMode="numeric" value={verseQuery || (verse == null ? '' : String(verse))} onChange={event => { setVerseQuery(event.target.value); const selected = verses.find(item => item.verse === Number(event.target.value)); if (selected) sendSelection(selected); }} placeholder="Search verses" className="mt-1 min-h-12 w-full rounded border border-slate-700 bg-slate-900 px-3 text-base text-white" />
								<datalist id="bible-verses">{verses.map(item => <option key={item.verse} value={item.verse} />)}</datalist>
							</label>
						</div>
					</section>
				</main>
				<nav className="z-10 grid shrink-0 grid-cols-5 gap-1 border-t border-slate-700 bg-slate-950/95 p-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:gap-2">
					<button type="button" disabled={!previousVerse} onClick={() => navigateToVerse(previousVerse)} aria-label="Previous verse" className="min-h-14 rounded bg-slate-800 px-1 text-xs font-semibold text-slate-200 disabled:opacity-35 sm:text-sm"><ChevronLeft className="mr-0.5 inline h-4 w-4" />Prev</button>
					<button type="button" disabled={!currentVerse} onClick={() => navigateToVerse(currentVerse)} className="min-h-14 rounded bg-slate-800 px-1 text-xs font-semibold text-slate-200 disabled:opacity-35 sm:text-sm"><Eye className="mr-0.5 inline h-4 w-4" />Preview</button>
					<button type="button" disabled={!nextVerse} onClick={() => navigateToVerse(nextVerse)} className="min-h-14 rounded bg-slate-800 px-1 text-xs font-semibold text-slate-200 disabled:opacity-35 sm:text-sm">Next<ChevronRight className="ml-0.5 inline h-4 w-4" /></button>
					<button type="button" disabled={!currentVerse} onClick={() => showVerse(currentVerse)} className="min-h-14 rounded bg-emerald-700 px-1 text-xs font-bold text-white disabled:opacity-35 sm:text-sm"><Eye className="mr-0.5 inline h-4 w-4" />Show</button>
					<button type="button" onClick={() => conn.sendCommand('bible', 'hide')} className="min-h-14 rounded bg-slate-700 px-1 text-xs font-semibold text-white sm:text-sm"><EyeOff className="mr-0.5 inline h-4 w-4" />Hide</button>
					<button type="button" disabled={!nextChapterVerse} onClick={() => navigateToVerse(nextChapterVerse)} className="col-span-5 min-h-12 rounded bg-amber-700 text-sm font-semibold text-white disabled:opacity-35">Next chapter<BookOpen className="ml-1 inline h-4 w-4" /></button>
				</nav>
			</div>
		</PinGate>
	);
}