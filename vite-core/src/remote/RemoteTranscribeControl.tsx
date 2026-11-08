import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Home, Mic, MicOff, Copy, Download, Trash2, Check, Send } from 'lucide-react';
import { useRemoteState, type RemoteConnection } from './useRemoteState';
import { PinGate, ConnectionBadge } from './RemoteShell';
import { CaptionFeed } from './RemoteTranscribeDisplay';

export default function RemoteTranscribeControl() {
	const conn = useRemoteState();
	const [params] = useSearchParams();
	const mini = params.get('view') === 'mini';
	const t = conn.state.transcribe;
	const listening = !!t?.isListening;

	return (
		<PinGate conn={conn}>
			<div className="min-h-screen bg-slate-950 text-white flex flex-col">
				<header className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur border-b border-slate-800 px-4 py-2.5 flex items-center gap-3">
					<Link to="/remote" className="p-2 rounded-lg hover:bg-slate-800 text-slate-300" title="Remote home"><Home className="w-4 h-4" /></Link>
					<h1 className="font-bold flex-1">Transcribe Control {mini && <span className="text-xs font-medium text-slate-500">· mini</span>}</h1>
					<ConnectionBadge connected={conn.connected} />
				</header>

				<div className={`flex-1 w-full mx-auto p-4 space-y-4 ${mini ? 'max-w-xl' : 'max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-4 space-y-0'}`}>
					<div className="space-y-4">
						{!mini && (
							<div className="relative h-64 bg-black rounded-2xl overflow-hidden border border-slate-800">
								<CaptionFeed conn={conn} compact />
								<span className="absolute top-2 right-3 text-[10px] uppercase tracking-widest text-slate-500 font-bold">Live preview</span>
							</div>
						)}
						<section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
							<div className="flex items-center justify-between">
								<h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Microphone</h2>
								<span className={`text-xs font-semibold ${listening ? 'text-red-400' : 'text-slate-500'}`}>{t?.status || (listening ? 'Listening' : 'Idle')}</span>
							</div>
							{listening ? (
								<button onClick={() => conn.sendCommand('transcribe', 'stop')} className="w-full py-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
									<MicOff className="w-6 h-6" /> Stop listening
								</button>
							) : (
								<button onClick={() => conn.sendCommand('transcribe', 'start')} className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
									<Mic className="w-6 h-6" /> Start listening
								</button>
							)}
							<p className="text-xs text-slate-500 leading-relaxed">Audio is captured on the main computer. This device only sends commands and shows the live text.</p>
						</section>
						<TranscriptActions conn={conn} />
					</div>
					<TranscriptPanel conn={conn} tall={!mini} />
				</div>
			</div>
		</PinGate>
	);
}

function TranscriptPanel({ conn, tall }: { conn: RemoteConnection; tall: boolean }) {
	const t = conn.state.transcribe;
	const listening = !!t?.isListening;
	const [draft, setDraft] = useState('');
	const [pushed, setPushed] = useState(false);
	const transcript = t?.transcript || '';

	useEffect(() => {
		if (!listening) setDraft(transcript);
	}, [listening, transcript]);

	const words = useMemo(() => transcript.trim() ? transcript.trim().split(/\s+/).length : 0, [transcript]);

	return (
		<section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col">
			<div className="flex items-center justify-between mb-3">
				<h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Transcript</h2>
				<span className="text-xs text-slate-500 tabular-nums">{words} words</span>
			</div>
			{listening ? (
				<div className={`flex-1 overflow-y-auto custom-scrollbar rounded-xl bg-slate-950 border border-slate-800 p-3 text-sm leading-relaxed whitespace-pre-wrap ${tall ? 'min-h-[300px] max-h-[60vh]' : 'min-h-[200px] max-h-[40vh]'}`}>
					{transcript || <span className="text-slate-600">Listening for speech…</span>}
					{t?.interim && <span className="text-slate-500 italic"> {t.interim}</span>}
					<span className="inline-block w-2 h-4 bg-red-500 animate-pulse align-middle ml-1 rounded-sm" />
				</div>
			) : (
				<div className="flex flex-col gap-2 flex-1">
					<textarea
						value={draft}
						onChange={(e) => { setDraft(e.target.value); setPushed(false); }}
						placeholder="Nothing captured yet. Start listening, or type text here and push it to the main computer."
						className={`flex-1 w-full rounded-xl bg-slate-950 border border-slate-700 focus:border-emerald-500 focus:outline-none p-3 text-sm text-white leading-relaxed resize-none ${tall ? 'min-h-[300px]' : 'min-h-[200px]'}`}
					/>
					<button
						onClick={() => { conn.sendCommand('transcribe', 'set', { text: draft }); setPushed(true); }}
						disabled={draft === transcript}
						className={`py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${pushed && draft === transcript ? 'bg-emerald-700 text-white' : draft !== transcript ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
					>
						{pushed && draft === transcript ? <><Check className="w-4 h-4" /> Pushed to main computer</> : <><Send className="w-4 h-4" /> Push edits to main computer</>}
					</button>
				</div>
			)}
		</section>
	);
}

function TranscriptActions({ conn }: { conn: RemoteConnection }) {
	const transcript = conn.state.transcribe?.transcript || '';
	const [copied, setCopied] = useState(false);
	const [confirmClear, setConfirmClear] = useState(false);

	const copy = async () => {
		try {
			await navigator.clipboard.writeText(transcript);
		} catch {
			const ta = document.createElement('textarea');
			ta.value = transcript;
			document.body.appendChild(ta);
			ta.select();
			document.execCommand('copy');
			ta.remove();
		}
		setCopied(true);
		setTimeout(() => setCopied(false), 1800);
	};

	const download = () => {
		const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `transcript-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.txt`;
		a.click();
		URL.revokeObjectURL(url);
	};

	return (
		<section className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
			<h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Export</h2>
			<div className="grid grid-cols-3 gap-2">
				<button onClick={copy} disabled={!transcript} className="py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 text-white text-sm font-semibold flex items-center justify-center gap-1.5">
					{copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />} {copied ? 'Copied' : 'Copy'}
				</button>
				<button onClick={download} disabled={!transcript} className="py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 text-white text-sm font-semibold flex items-center justify-center gap-1.5">
					<Download className="w-4 h-4" /> .txt
				</button>
				{confirmClear ? (
					<button
						onClick={() => { conn.sendCommand('transcribe', 'clear'); setConfirmClear(false); }}
						onBlur={() => setConfirmClear(false)}
						className="py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold animate-pulse"
					>
						Sure?
					</button>
				) : (
					<button onClick={() => setConfirmClear(true)} disabled={!transcript} className="py-2.5 rounded-xl bg-slate-700 hover:bg-red-700 disabled:bg-slate-800 disabled:text-slate-600 text-red-300 hover:text-white disabled:hover:text-slate-600 text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors">
						<Trash2 className="w-4 h-4" /> Clear
					</button>
				)}
			</div>
		</section>
	);
}