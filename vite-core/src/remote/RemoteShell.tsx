import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Settings2, Maximize, Minimize, Home, Wifi, WifiOff, X, Lock, Image as ImageIcon } from 'lucide-react';
import type { RemoteConnection } from './useRemoteState';

export function PinGate({ conn, children }: { conn: RemoteConnection; children: React.ReactNode }) {
	const [pin, setPin] = useState('');
	if (!conn.auth.required || conn.auth.ok) return <>{children}</>;
	return (
		<div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
			<div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-8 shadow-2xl">
				<div className="w-14 h-14 mx-auto mb-4 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center">
					<Lock className="w-6 h-6 text-emerald-400" />
				</div>
				<h1 className="text-xl font-bold text-white text-center mb-1">Access PIN required</h1>
				<p className="text-sm text-slate-400 text-center mb-6">Enter the PIN shown in the Remote Access window on the main computer.</p>
				<form onSubmit={(e) => { e.preventDefault(); conn.submitPin(pin.trim()); }}>
					<input
						type="password"
						inputMode="numeric"
						autoFocus
						value={pin}
						onChange={(e) => setPin(e.target.value)}
						placeholder="Enter PIN"
						className="w-full bg-slate-800 border border-slate-600 rounded-xl px-4 py-3 text-white text-center text-lg tracking-widest focus:outline-none focus:border-emerald-500 mb-4"
					/>
					<button type="submit" className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors">
						Connect
					</button>
				</form>
				{conn.connected && <p className="text-xs text-red-400 text-center mt-3">Wrong PIN. Try again.</p>}
			</div>
		</div>
	);
}

export function ConnectionBadge({ connected, className = '' }: { connected: boolean; className?: string }) {
	return (
		<span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${connected ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40' : 'bg-red-500/15 text-red-300 border-red-500/40 animate-pulse'} ${className}`}>
			{connected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
			{connected ? 'Live' : 'Reconnecting…'}
		</span>
	);
}

export interface BgSettings {
	mode: 'solid' | 'image';
	color: string;
	image: string;
	dim: number;
}

const DEFAULT_BG: BgSettings = { mode: 'solid', color: '#000000', image: '', dim: 40 };

const PRESETS: Array<{ label: string; color: string }> = [
	{ label: 'Black', color: '#000000' },
	{ label: 'Chroma green', color: '#00ff00' },
	{ label: 'Chroma blue', color: '#0000ff' },
	{ label: 'White', color: '#ffffff' },
	{ label: 'Slate', color: '#0f172a' },
	{ label: 'Deep blue', color: '#1e3a8a' },
	{ label: 'Magenta', color: '#ff00ff' },
];

export function useRemoteBackground(storageKey: string) {
	const [bg, setBg] = useState<BgSettings>(() => {
		try {
			const raw = localStorage.getItem(storageKey);
			if (raw) return { ...DEFAULT_BG, ...JSON.parse(raw) };
		} catch { /* corrupt storage */ }
		return DEFAULT_BG;
	});
	useEffect(() => {
		try { localStorage.setItem(storageKey, JSON.stringify(bg)); } catch { /* image too large */ }
	}, [bg, storageKey]);
	return [bg, setBg] as const;
}

export function BackgroundLayer({ bg }: { bg: BgSettings }) {
	if (bg.mode === 'image' && bg.image) {
		return (
			<div className="absolute inset-0" style={{ backgroundColor: bg.color }}>
				<img src={bg.image} alt="" className="w-full h-full object-cover" />
				<div className="absolute inset-0 bg-black" style={{ opacity: bg.dim / 100 }} />
			</div>
		);
	}
	return <div className="absolute inset-0" style={{ backgroundColor: bg.color }} />;
}

export function BackgroundSettingsPanel({
	bg, setBg, onClose,
}: {
	bg: BgSettings;
	setBg: React.Dispatch<React.SetStateAction<BgSettings>>;
	onClose: () => void;
}) {
	const fileRef = useRef<HTMLInputElement>(null);
	const [error, setError] = useState('');
	const onFile = (file: File | undefined) => {
		if (!file) return;
		if (file.size > 3.5 * 1024 * 1024) {
			setError('Image is too large (max 3.5 MB). Choose a smaller file.');
			return;
		}
		setError('');
		const reader = new FileReader();
		reader.onload = () => setBg((b) => ({ ...b, mode: 'image', image: String(reader.result) }));
		reader.readAsDataURL(file);
	};
	return (
		<div className="absolute top-0 right-0 h-full w-80 max-w-[85vw] bg-slate-900/95 backdrop-blur border-l border-slate-700 shadow-2xl z-40 flex flex-col animate-slide-in-right">
			<div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
				<h2 className="font-semibold text-white flex items-center gap-2"><Settings2 className="w-4 h-4 text-emerald-400" /> Screen background</h2>
				<button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300" aria-label="Close settings"><X className="w-4 h-4" /></button>
			</div>
			<div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-5">
				<p className="text-xs text-slate-400 leading-relaxed">
					This background applies to <span className="text-emerald-300 font-medium">this screen only</span>. The main program display is never affected.
				</p>
				<div>
					<div className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-2">Solid color</div>
					<div className="grid grid-cols-4 gap-2">
						{PRESETS.map((p) => (
							<button
								key={p.color}
								title={p.label}
								onClick={() => setBg((b) => ({ ...b, mode: 'solid', color: p.color }))}
								className={`h-10 rounded-lg border-2 transition-transform hover:scale-105 ${bg.mode === 'solid' && bg.color === p.color ? 'border-emerald-400 ring-2 ring-emerald-400/40' : 'border-slate-600'}`}
								style={{ backgroundColor: p.color }}
							/>
						))}
						<label className={`h-10 rounded-lg border-2 flex items-center justify-center cursor-pointer overflow-hidden relative ${bg.mode === 'solid' && !PRESETS.some((p) => p.color === bg.color) ? 'border-emerald-400' : 'border-slate-600'}`} title="Custom color">
							<div className="absolute inset-0" style={{ background: 'conic-gradient(#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)' }} />
							<input
								type="color"
								value={bg.color}
								onChange={(e) => setBg((b) => ({ ...b, mode: 'solid', color: e.target.value }))}
								className="absolute inset-0 opacity-0 cursor-pointer"
							/>
						</label>
					</div>
					<div className="mt-2 flex items-center gap-2">
						<input
							type="text"
							value={bg.color}
							onChange={(e) => setBg((b) => ({ ...b, mode: 'solid', color: e.target.value }))}
							className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
						/>
					</div>
				</div>
				<div>
					<div className="text-xs font-semibold text-slate-300 uppercase tracking-wide mb-2">Background image</div>
					<input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
					<button
						onClick={() => fileRef.current?.click()}
						className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-slate-500 hover:border-emerald-400 hover:bg-slate-800 text-slate-300 text-sm transition-colors"
					>
						<ImageIcon className="w-4 h-4" /> Upload from this device
					</button>
					{error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
					{bg.image && (
						<div className="mt-3 space-y-3">
							<div className="relative rounded-lg overflow-hidden border border-slate-600">
								<img src={bg.image} alt="Background preview" className="w-full h-24 object-cover" />
								{bg.mode === 'image' && <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-semibold">ACTIVE</span>}
							</div>
							<div className="flex gap-2">
								<button
									onClick={() => setBg((b) => ({ ...b, mode: 'image' }))}
									className={`flex-1 py-1.5 rounded-lg text-xs font-medium ${bg.mode === 'image' ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
								>
									Use image
								</button>
								<button
									onClick={() => setBg((b) => ({ ...b, mode: 'solid', image: '' }))}
									className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-slate-700 text-red-300 hover:bg-red-900/50"
								>
									Remove
								</button>
							</div>
							<div>
								<div className="flex justify-between text-xs text-slate-400 mb-1">
									<span>Image dimming</span><span>{bg.dim}%</span>
								</div>
								<input
									type="range" min={0} max={90} value={bg.dim}
									onChange={(e) => setBg((b) => ({ ...b, dim: Number(e.target.value) }))}
									className="w-full accent-emerald-500"
								/>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

export function DisplayChrome({
	connected, bg, setBg, bgKey,
}: {
	connected: boolean;
	bg: BgSettings;
	setBg: React.Dispatch<React.SetStateAction<BgSettings>>;
	bgKey: string;
}) {
	const [visible, setVisible] = useState(true);
	const [showSettings, setShowSettings] = useState(false);
	const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
	const hideTimer = useRef<number>();

	const poke = useCallback(() => {
		setVisible(true);
		window.clearTimeout(hideTimer.current);
		hideTimer.current = window.setTimeout(() => setVisible(false), 3500);
	}, []);

	useEffect(() => {
		poke();
		const onFs = () => setIsFullscreen(!!document.fullscreenElement);
		document.addEventListener('fullscreenchange', onFs);
		return () => {
			document.removeEventListener('fullscreenchange', onFs);
			window.clearTimeout(hideTimer.current);
		};
	}, [poke]);

	const toggleFullscreen = () => {
		if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
		else document.documentElement.requestFullscreen().catch(() => undefined);
	};

	void bgKey;
	return (
		<div className="absolute inset-0 z-30 pointer-events-none" onMouseMove={poke} onTouchStart={poke}>
			<div className={`absolute top-3 right-3 flex items-center gap-2 transition-opacity duration-500 pointer-events-auto ${visible || showSettings ? 'opacity-100' : 'opacity-0'}`}>
				<ConnectionBadge connected={connected} />
				<Link to="/remote" className="p-2 rounded-lg bg-slate-900/70 backdrop-blur border border-slate-600/60 text-slate-200 hover:bg-slate-800" title="Remote home">
					<Home className="w-4 h-4" />
				</Link>
				<button onClick={toggleFullscreen} className="p-2 rounded-lg bg-slate-900/70 backdrop-blur border border-slate-600/60 text-slate-200 hover:bg-slate-800" title="Toggle fullscreen">
					{isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
				</button>
				<button onClick={() => setShowSettings((s) => !s)} className={`p-2 rounded-lg backdrop-blur border ${showSettings ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-slate-900/70 border-slate-600/60 text-slate-200 hover:bg-slate-800'}`} title="Background settings">
					<Settings2 className="w-4 h-4" />
				</button>
			</div>
			{showSettings && (
				<div className="pointer-events-auto">
					<BackgroundSettingsPanel bg={bg} setBg={setBg} onClose={() => setShowSettings(false)} />
				</div>
			)}
		</div>
	);
}