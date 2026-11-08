import React, { useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useRemoteState, type RemoteConnection } from './useRemoteState';
import { PinGate, BackgroundLayer, DisplayChrome, useRemoteBackground } from './RemoteShell';

export default function RemoteTranscribeDisplay() {
	const conn = useRemoteState();
	const [bg, setBg] = useRemoteBackground('remoteBg.transcribe');
	return (
		<PinGate conn={conn}>
			<div className="fixed inset-0 overflow-hidden select-none">
				<BackgroundLayer bg={bg} />
				<CaptionFeed conn={conn} />
				<DisplayChrome connected={conn.connected} bg={bg} setBg={setBg} bgKey="remoteBg.transcribe" />
			</div>
		</PinGate>
	);
}

export function CaptionFeed({ conn, compact = false }: { conn: RemoteConnection; compact?: boolean }) {
	const t = conn.state.transcribe;
	const scrollRef = useRef<HTMLDivElement>(null);
	const transcript = t?.transcript || '';
	const interim = t?.interim || '';

	useEffect(() => {
		const el = scrollRef.current;
		if (el) el.scrollTop = el.scrollHeight;
	}, [transcript, interim]);

	const paragraphs = transcript.split(/\n+/).filter(Boolean);
	const tail = paragraphs.slice(-6);

	return (
		<div className="absolute inset-0 flex flex-col">
			<div className={`flex items-center gap-2 ${compact ? 'px-3 pt-2' : 'px-8 pt-6'}`}>
				<span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${compact ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-sm'} ${t?.isListening ? 'bg-red-600/90 text-white' : 'bg-slate-800/80 text-slate-400'}`}>
					{t?.isListening ? <Mic className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} animate-pulse`} /> : <MicOff className={compact ? 'w-3 h-3' : 'w-4 h-4'} />}
					{t?.isListening ? 'LIVE' : 'Standby'}
				</span>
			</div>
			<div ref={scrollRef} className={`flex-1 overflow-hidden flex flex-col justify-end ${compact ? 'px-3 pb-3 gap-1.5' : 'px-[6vw] pb-[8vh] gap-[2vh]'}`}>
				{tail.length === 0 && !interim && (
					<p className={`text-white/40 font-medium ${compact ? 'text-xs' : 'text-[2.5vw]'}`} style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.8)' }}>
						{t?.isListening ? 'Listening… captions will appear here.' : 'Waiting for transcription to start on the main computer.'}
					</p>
				)}
				{tail.map((p, i) => (
					<p
						key={`${paragraphs.length - tail.length + i}`}
						className={`font-semibold text-white leading-snug ${compact ? 'text-xs' : ''}`}
						style={{
							fontSize: compact ? undefined : 'clamp(1.2rem, 3.2vw, 3.4rem)',
							opacity: 0.45 + 0.55 * ((i + 1) / tail.length),
							textShadow: '2px 2px 6px rgba(0,0,0,0.9)',
						}}
					>
						{p}
					</p>
				))}
				{interim && (
					<p className={`font-medium text-white/70 italic leading-snug ${compact ? 'text-xs' : ''}`} style={{ fontSize: compact ? undefined : 'clamp(1.2rem, 3.2vw, 3.4rem)', textShadow: '2px 2px 6px rgba(0,0,0,0.9)' }}>
						{interim}
					</p>
				)}
			</div>
		</div>
	);
}